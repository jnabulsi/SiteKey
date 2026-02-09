import { prisma } from "@/lib/db/prisma";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ orgSlug: string }>;
};

export default async function AdminAssetsPage(props: Props) {
  const { orgSlug } = await props.params;

  const org = await findOrgBySlug(orgSlug);
  if (!org) notFound();

  const assets = await prisma.asset.findMany({
    where: { org_id: org.id },
    orderBy: { created_at: "desc" },
  });

  return (
    <>
      <h1>Assets</h1>

      <p>
        <a href={`/o/${encodeURIComponent(orgSlug)}/admin/assets/new`}>Create new asset</a>
      </p>

      {assets.length === 0 ? (
        <p>No assets yet.</p>
      ) : (
        <ul>
          {assets.map((a) => (
            <li key={a.id}>
              <strong>{a.name}</strong>{" "}
              {a.is_public ? "(public)" : "(private)"} —{" "}
              <a href={`/o/${encodeURIComponent(orgSlug)}/admin/assets/${a.id}`}>Edit</a>{" "}
              —{" "}
              <a href={`/a/${a.public_token}`} target="_blank" rel="noreferrer">
                Open
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

