import { findOrgBySlug } from "@/lib/org/orgRepo";
import { getSession } from "@/lib/auth/getSession";
import { redirect, notFound } from "next/navigation";

type Props = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ error?: string }>;
};


export default async function AdminLoginPage(props: Props) {
  const { orgSlug } = await props.params;

  const org = await findOrgBySlug(orgSlug);
  if (!org) notFound();

  const session = await getSession();

  const { error } = await props.searchParams;

  if (
    session &&
    session.session_type === "admin" &&
    session.org_id === org.id &&
    session.expires_at > new Date()
  ) {
    redirect(`/o/${encodeURIComponent(orgSlug)}/admin/assets`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold">Admin login</h1>

        {error === "invalid" && (
          <p className="text-sm text-red-600 dark:text-red-400">Invalid password</p>
        )}
        {error === "rate_limit" && (
          <p className="text-sm text-red-600 dark:text-red-400">Too many attempts. Please try again later.</p>
        )}

        <form method="POST" action={`/api/o/${encodeURIComponent(orgSlug)}/login`} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
