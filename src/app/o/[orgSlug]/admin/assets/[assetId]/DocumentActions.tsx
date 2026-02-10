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
type Mode = "view" | "edit" | "replace";

export default function DocumentActions({ doc, orgSlug }: Props) {
  const [mode, setMode] = useState<Mode>("view");
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

  function switchMode(next: Mode) {
    setError(null);
    setReplacePhase("idle");
    if (fileRef.current) fileRef.current.value = "";
    setMode(next);
  }

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
      switchMode("view");
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

  const sizeLabel = doc.size_bytes
    ? `${(Number(doc.size_bytes) / 1024).toFixed(0)} KB`
    : null;

  return (
    <div
      className={`rounded-md border px-4 py-3 ${
        mode !== "view"
          ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {mode === "edit" ? (
        <form onSubmit={handleSaveMetadata} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={saving}
              required
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Doc type</label>
            <input
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              maxLength={100}
              disabled={saving}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={2000}
              disabled={saving}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => switchMode("view")}
              disabled={saving}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : mode === "replace" ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">Replace file for &ldquo;{title}&rdquo;</p>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              disabled={replaceBusy}
              className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-200 dark:file:bg-gray-700 dark:hover:file:bg-gray-600 disabled:opacity-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReplace}
              disabled={replaceBusy}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {replaceBusy ? replacePhaseLabel(replacePhase) : "Upload replacement"}
            </button>
            <button
              type="button"
              onClick={() => switchMode("view")}
              disabled={replaceBusy}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            {replacePhase === "done" && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Replaced!
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <a
              href={`/d/${doc.id}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {title}
            </a>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 truncate">
              {[docType, notes, sizeLabel].filter(Boolean).join(" — ")}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => switchMode("edit")}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => switchMode("replace")}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}
    </div>
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
      return "Upload replacement";
  }
}
