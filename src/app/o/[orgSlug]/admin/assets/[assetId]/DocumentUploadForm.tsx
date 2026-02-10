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
      <h2 className="text-lg font-medium mb-4">Upload Document</h2>

      {phase === "done" && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-4">
          Upload complete.{" "}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="underline hover:no-underline"
          >
            Reload to see document
          </button>
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">PDF file</label>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            disabled={busy}
            required
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200 dark:file:bg-gray-700 dark:hover:file:bg-gray-600 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="upload-title">
            Title (optional, defaults to filename)
          </label>
          <input
            id="upload-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            disabled={busy}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="upload-doctype">
            Document type (optional)
          </label>
          <input
            id="upload-doctype"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            maxLength={100}
            disabled={busy}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="upload-notes">
            Notes (optional)
          </label>
          <textarea
            id="upload-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={2000}
            disabled={busy}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
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
