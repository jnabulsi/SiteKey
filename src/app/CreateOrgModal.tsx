"use client";

import { useRef, useEffect, useState, type ChangeEvent } from "react";
import { slugify } from "@/lib/org/slugValidation";

type Props = {
  open: boolean;
  onClose: () => void;
  error?: string | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  rate_limit: "Too many organisations created. Please try again later.",
  name_required: "Organisation name is required.",
  password_short: "Password must be at least 8 characters.",
  access_code_required: "Access code is required.",
  invalid_slug: "Invalid organisation ID. Use lowercase letters, numbers, and hyphens (3–50 chars).",
  slug_taken: "This organisation ID is already taken.",
};

export default function CreateOrgModal({ open, onClose, error }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setTimeout(() => nameRef.current?.focus(), 0);
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    if (!slugEdited) {
      setSlug(slugify(e.target.value));
    }
  }

  function handleSlugChange(e: ChangeEvent<HTMLInputElement>) {
    setSlugEdited(true);
    setSlug(e.target.value.toLowerCase());
  }

  const errorMessage = error ? ERROR_MESSAGES[error] ?? "Something went wrong." : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-auto w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0 shadow-xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Create Organisation</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        <form
          action="/api/orgs/create"
          method="POST"
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="orgDisplayName">
              Organisation Name
            </label>
            <input
              ref={nameRef}
              id="orgDisplayName"
              name="name"
              type="text"
              placeholder="Acme Electrical"
              required
              maxLength={200}
              onChange={handleNameChange}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="orgSlug">
              Organisation ID
            </label>
            <input
              id="orgSlug"
              name="slug"
              type="text"
              placeholder="acme-electrical"
              required
              maxLength={50}
              value={slug}
              onChange={handleSlugChange}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <p className="mt-1 text-xs text-gray-400">
              Lowercase letters, numbers, and hyphens. This becomes your URL.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="createAdminPassword">
              Admin Password
            </label>
            <input
              id="createAdminPassword"
              name="adminPassword"
              type="password"
              required
              minLength={8}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Minimum 8 characters.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="createAccessCode">
              Access Code
            </label>
            <input
              id="createAccessCode"
              name="accessCode"
              type="password"
              required
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Shared with technicians for field access.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Create Organisation
          </button>
        </form>
      </div>
    </dialog>
  );
}
