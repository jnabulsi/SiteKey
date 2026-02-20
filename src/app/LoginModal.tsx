"use client";

import { useRef, useEffect } from "react";
import { adminLogin } from "./loginAction";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LoginModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const orgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setTimeout(() => orgRef.current?.focus(), 0);
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-auto w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0 shadow-xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Log in</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form action={adminLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="orgName">
              Organisation
            </label>
            <input
              ref={orgRef}
              id="orgName"
              name="org"
              type="text"
              placeholder="my-organisation"
              required
              maxLength={50}
              autoComplete="organization"
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="modalPassword">
              Password
            </label>
            <input
              id="modalPassword"
              name="password"
              type="password"
              required
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Log in
          </button>
        </form>
      </div>
    </dialog>
  );
}
