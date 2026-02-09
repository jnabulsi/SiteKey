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
    redirect(`/o/${encodeURIComponent(orgSlug)}/admin`);
  }

  return (
    <main style={{ padding: 16 }}>
      <h1>Admin login</h1>

      {error === "invalid" && (
        <p style={{ color: "red" }}>Invalid password</p>
      )}

      <form method="POST" action={`/api/o/${encodeURIComponent(orgSlug)}/login`}>
        <div>
          <label>
            Password
            <br />
            <input name="password" type="password" required />
          </label>
        </div>

        <button type="submit">Login</button>
      </form>
    </main>
  );
}

