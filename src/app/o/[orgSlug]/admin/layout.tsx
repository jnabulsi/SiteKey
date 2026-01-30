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
    <main style={{ padding: 16 }}>
      <header style={{ marginBottom: 16 }}>
        <strong>SiteKey Admin</strong> — {org.name} ({orgSlug})
        <nav style={{ marginTop: 8, display: "flex", gap: 12 }}>
          <a href={`/o/${orgSlug}/admin`}>Home</a>
          <a href={`/o/${orgSlug}/admin/assets`}>Assets</a>
          <a href={`/o/${orgSlug}/admin/settings`}>Settings</a>
        </nav>
      </header>

      {children}
    </main>
  );
}

