"use client";

import { useState, useRef } from "react";

type Props = {
  orgSlug: string;
  assetId: string;
};

type Phase = "idle" | "init" | "uploading" | "finalizing" | "done" | "error";

export default function DocumentUploadForm({ orgSlug, assetId }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("");
  const [notes, setNotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = phase !== "idle" && phase !== "done" && phase !== "error";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }

    const apiBase = `/api/o/${encodeURIComponent(orgSlug)}/admin/assets/${encodeURIComponent(assetId)}/documents`;

    // Phase 1: Init
    setPhase("init");
    let initData: { documentId: string; storageKey: string; presignedUrl: string };
    try {
      const res = await fetch(`${apiBase}/init-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: "application/pdf",
          sizeBytes: file.size,
          title: title.trim() || undefined,
          docType: docType.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Init failed (${res.status})`);
      }
      initData = await res.json();
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Init failed");
      return;
    }

    // Phase 2: Upload to S3
    setPhase("uploading");
    try {
      const res = await fetch(initData.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!res.ok) {
        throw new Error(`S3 upload failed (${res.status})`);
      }
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Upload failed");
      return;
    }

    // Phase 3: Finalize
    setPhase("finalizing");
    try {
      const res = await fetch(`${apiBase}/finalize-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: initData.documentId,
          storageKey: initData.storageKey,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Finalize failed (${res.status})`);
      }
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Finalize failed");
      return;
    }

    setPhase("done");
  }

  return (
    <div>
      <h2>Upload Document</h2>

      {phase === "done" && (
        <p style={{ color: "green" }}>
          Upload complete.{" "}
          <button type="button" onClick={() => window.location.reload()}>
            Reload to see document
          </button>
        </p>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            PDF file
            <br />
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              disabled={busy}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Title (optional, defaults to filename)
            <br />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={busy}
            />
          </label>
        </div>

        <div>
          <label>
            Document type (optional)
            <br />
            <input
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              maxLength={100}
              disabled={busy}
            />
          </label>
        </div>

        <div>
          <label>
            Notes (optional)
            <br />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              disabled={busy}
            />
          </label>
        </div>

        <button type="submit" disabled={busy}>
          {busy ? phaseLabel(phase) : "Upload"}
        </button>
      </form>
    </div>
  );
}

function phaseLabel(phase: Phase): string {
  switch (phase) {
    case "init":
      return "Preparing upload…";
    case "uploading":
      return "Uploading to storage…";
    case "finalizing":
      return "Finalizing…";
    default:
      return "Upload";
  }
}
