import { findOrgBySlug } from "@/lib/org/orgRepo";
import { requireAdminSession } from "@/lib/auth/requireAdminSession";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ orgSlug: string }>;
};

export default async function AdminHomePage(props: Props) {
  const { orgSlug } = await props.params;

  const org = await findOrgBySlug(orgSlug);
  if (!org) notFound();

  await requireAdminSession(org.id, orgSlug);

  return (
    <main style={{ padding: 16 }}>
      <h1>Admin</h1>
      <p>Organisation: {orgSlug}</p>
      <p>Admin dashboard placeholder</p>
    </main>
  );
}

