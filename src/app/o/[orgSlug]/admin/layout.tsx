import { ReactNode } from "react";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { requireAdminSession } from "@/lib/auth/requireAdminSession";
import { notFound } from "next/navigation";

type Props = {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
};

export default async function AdminLayout(props: Props) {
  const { children } = props;
  const { orgSlug } = await props.params;

  const org = await findOrgBySlug(orgSlug);
  if (!org) notFound();

  await requireAdminSession(org.id, orgSlug);

  return (
    <>
      <header className="border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="font-bold">SiteKey</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{org.name}</span>
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <form
              method="POST"
              action={`/api/logout?next=/o/${encodeURIComponent(orgSlug)}/login`}
              className="inline"
            >
              <button
                type="submit"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:underline"
              >
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </>
  );
}
