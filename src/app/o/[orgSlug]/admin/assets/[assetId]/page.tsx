import { prisma } from "@/lib/db/prisma";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { notFound } from "next/navigation";
import DocumentUploadForm from "./DocumentUploadForm";
import DocumentActions from "./DocumentActions";

type Props = {
  params: Promise<{ orgSlug: string; assetId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditAssetPage(props: Props) {
  const { orgSlug, assetId } = await props.params;
  const { error } = await props.searchParams;


  const org = await findOrgBySlug(orgSlug);
  if (!org) notFound();

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, org_id: org.id },
  });
  if (!asset) notFound();

  return (
    <>
      <h1>Edit Asset</h1>

      {error === "name" && (
        <p style={{ color: "red" }}>Name is required</p>
      )}

      <p>
        <a href={`/a/${asset.public_token}`} target="_blank" rel="noreferrer">
          Open public link
        </a>
      </p>
      <form method="POST" action={`/api/o/${encodeURIComponent(orgSlug)}/admin/assets/${encodeURIComponent(assetId)}`}>
        <input type="hidden" name="action" value="update" />
        <div>
          <label>
            Name
            <br />
            <input name="name" defaultValue={asset.name} required maxLength={200} />
          </label>
        </div>

        <div>
          <label>
            Location
            <br />
            <input name="location" defaultValue={asset.location ?? ""} maxLength={200} />
          </label>
        </div>

        <div>
          <label>
            Notes
            <br />
            <textarea name="notes" rows={4} defaultValue={asset.notes ?? ""} maxLength={2000} />
          </label>
        </div>

        <div>
          <label>
            <input
              name="is_public"
              type="checkbox"
              defaultChecked={asset.is_public}
            />{" "}
            Public
          </label>
        </div>

        <button type="submit">Save</button>
      </form>

      <hr />

      <form method="POST" action={`/api/o/${encodeURIComponent(orgSlug)}/admin/assets/${encodeURIComponent(assetId)}`}>
        <input type="hidden" name="action" value="delete" />
        <button type="submit">Delete asset</button>
      </form>

      <hr />

      <DocumentUploadForm orgSlug={orgSlug} assetId={assetId} />

      <hr />

      <h2>Documents</h2>
      <DocumentList assetId={assetId} orgSlug={orgSlug} />
    </>
  );
}

async function DocumentList({
  assetId,
  orgSlug,
}: {
  assetId: string;
  orgSlug: string;
}) {
  const documents = await prisma.document.findMany({
    where: { asset_id: assetId, upload_status: "ready" },
    orderBy: { uploaded_at: "desc" },
    select: {
      id: true,
      title: true,
      doc_type: true,
      notes: true,
      filename: true,
      size_bytes: true,
    },
  });

  if (documents.length === 0) {
    return <p>No documents yet.</p>;
  }

  return (
    <ul>
      {documents.map((doc) => (
        <DocumentActions
          key={doc.id}
          doc={{
            ...doc,
            size_bytes: doc.size_bytes?.toString() ?? null,
          }}
          orgSlug={orgSlug}
        />
      ))}
    </ul>
  );
}

