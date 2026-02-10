"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DocumentUploadForm from "../[assetId]/DocumentUploadForm";

export default function NewAssetPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdAssetId, setCreatedAssetId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(
        `/api/o/${encodeURIComponent(orgSlug)}/admin/assets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            location: location.trim() || undefined,
            notes: notes.trim() || undefined,
            is_public: isPublic,
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to create asset (${res.status})`);
      }

      const data = await res.json();
      setCreatedAssetId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create asset");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdAssetId) {
    return (
      <>
        <div className="mb-6">
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">
            Asset created successfully.
          </p>
          <h1 className="text-2xl font-semibold">Upload Documents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Optionally upload documents now, or do it later from the asset page.
          </p>
        </div>

        <DocumentUploadForm orgSlug={orgSlug} assetId={createdAssetId} />

        <div className="mt-8 flex gap-3">
          <Link
            href={`/o/${encodeURIComponent(orgSlug)}/admin/assets/${encodeURIComponent(createdAssetId)}`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Go to Asset
          </Link>
          <Link
            href={`/o/${encodeURIComponent(orgSlug)}/admin/assets`}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Assets
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">New Asset</h1>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
      )}

      <form onSubmit={handleCreate} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={200}
            disabled={submitting}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={200}
            disabled={submitting}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            disabled={submitting}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_public"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={submitting}
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium" htmlFor="is_public">
            Public
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating…" : "Create Asset"}
        </button>
      </form>
    </>
  );
}
