"use client";

import { useState, useRef } from "react";

type Document = {
  id: string;
  title: string;
  doc_type: string | null;
  notes: string | null;
  filename: string;
  size_bytes: string | null;
};

type Props = {
  doc: Document;
  orgSlug: string;
};

type Phase = "idle" | "init" | "uploading" | "finalizing" | "done" | "error";

export default function DocumentActions({ doc, orgSlug }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [docType, setDocType] = useState(doc.doc_type ?? "");
  const [notes, setNotes] = useState(doc.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [replacePhase, setReplacePhase] = useState<Phase>("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const apiBase = `/api/o/${encodeURIComponent(orgSlug)}/admin/documents/${encodeURIComponent(doc.id)}`;

  if (deleted) return null;

  async function handleSaveMetadata(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(apiBase, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          docType: docType.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setError(null);

    try {
      const res = await fetch(apiBase, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      setDeleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleReplace() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }

    setError(null);

    // Phase 1: Init replace
    setReplacePhase("init");
    let initData: {
      documentId: string;
      newStorageKey: string;
      oldStorageKey: string;
      presignedUrl: string;
      filename: string;
      sizeBytes: number;
    };
    try {
      const res = await fetch(`${apiBase}/init-replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: "application/pdf",
          sizeBytes: file.size,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Init failed (${res.status})`);
      }
      initData = await res.json();
    } catch (err) {
      setReplacePhase("error");
      setError(err instanceof Error ? err.message : "Init replace failed");
      return;
    }

    // Phase 2: Upload to S3
    setReplacePhase("uploading");
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
      setReplacePhase("error");
      setError(err instanceof Error ? err.message : "Upload failed");
      return;
    }

    // Phase 3: Finalize replace
    setReplacePhase("finalizing");
    try {
      const res = await fetch(`${apiBase}/finalize-replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStorageKey: initData.newStorageKey,
          oldStorageKey: initData.oldStorageKey,
          filename: initData.filename,
          sizeBytes: initData.sizeBytes,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Finalize failed (${res.status})`);
      }
    } catch (err) {
      setReplacePhase("error");
      setError(err instanceof Error ? err.message : "Finalize failed");
      return;
    }

    setReplacePhase("done");
    if (fileRef.current) fileRef.current.value = "";
  }

  const replaceBusy =
    replacePhase !== "idle" &&
    replacePhase !== "done" &&
    replacePhase !== "error";

  return (
    <li>
      {editing ? (
        <form onSubmit={handleSaveMetadata} style={{ marginBottom: "0.5em" }}>
          <div>
            <label>
              Title
              <br />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={saving}
                required
              />
            </label>
          </div>
          <div>
            <label>
              Doc type
              <br />
              <input
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                maxLength={100}
                disabled={saving}
              />
            </label>
          </div>
          <div>
            <label>
              Notes
              <br />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={2000}
                disabled={saving}
              />
            </label>
          </div>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>{" "}
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
          >
            Cancel
          </button>
        </form>
      ) : (
        <>
          <a href={`/d/${doc.id}`} target="_blank" rel="noreferrer">
            {title}
          </a>
          {docType && <> — {docType}</>}
          {notes && <> — {notes}</>}
          {" "}
          <button type="button" onClick={() => setEditing(true)}>
            Edit
          </button>{" "}
          <button type="button" onClick={handleDelete}>
            Delete
          </button>
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: "0.25em" }}>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          disabled={replaceBusy}
          style={{ fontSize: "0.85em" }}
        />
        <button type="button" onClick={handleReplace} disabled={replaceBusy}>
          {replaceBusy ? replacePhaseLabel(replacePhase) : "Replace file"}
        </button>
        {replacePhase === "done" && (
          <span style={{ color: "green", marginLeft: "0.5em" }}>
            Replaced!
          </span>
        )}
      </div>
    </li>
  );
}

function replacePhaseLabel(phase: Phase): string {
  switch (phase) {
    case "init":
      return "Preparing…";
    case "uploading":
      return "Uploading…";
    case "finalizing":
      return "Finalizing…";
    default:
      return "Replace file";
  }
}
