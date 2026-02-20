"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import LoginModal from "./LoginModal";
import CreateOrgModal from "./CreateOrgModal";

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [createOrgOpen, setCreateOrgOpen] = useState(!!error);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          SiteKey
        </h1>
        <p className="mt-2 text-lg text-gray-400 dark:text-gray-500 font-medium">
          Documentation at the point of work
        </p>
        <p className="mt-5 max-w-lg text-base text-gray-500 dark:text-gray-400">
          QR codes that link physical assets to their technical documentation.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setCreateOrgOpen(true)}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Get started
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-8 text-center">
            How it works
          </h2>
          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">1</p>
              <h3 className="font-medium mb-1">Attach a QR code</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generate and print a QR label for any switchboard, machine, or asset.
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">2</p>
              <h3 className="font-medium mb-1">Technician scans it</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No app to install. Just scan and enter the shared access code.
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">3</p>
              <h3 className="font-medium mb-1">View the docs</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                PDFs load instantly on any device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            SiteKey
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <a
              href="mailto:jordanabulsi@gmail.com"
              className="hover:text-gray-700 dark:hover:text-gray-300"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <CreateOrgModal
        open={createOrgOpen}
        onClose={() => setCreateOrgOpen(false)}
        error={error}
      />
    </div>
  );
}
