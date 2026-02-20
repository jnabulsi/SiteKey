import { prisma } from "@/lib/db/prisma";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { notFound, redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/requireAdminSession";
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

  async function updateAsset(formData: FormData) {
    "use server";
    const fetchedOrg = await findOrgBySlug(orgSlug);
    if (!fetchedOrg) notFound();
    await requireAdminSession(fetchedOrg.id, orgSlug);

    const name = String(formData.get("name") ?? "").trim().slice(0, 200);
    const location = String(formData.get("location") ?? "").trim().slice(0, 200);
    const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);
    const isPublic = formData.get("is_public") === "on";

    if (!name) {
      redirect(`/o/${encodeURIComponent(orgSlug)}/admin/assets/${encodeURIComponent(assetId)}?error=name`);
    }

    await prisma.asset.updateMany({
      where: { id: assetId, org_id: fetchedOrg.id },
      data: { name, location: location || null, notes: notes || null, is_public: isPublic },
    });

    redirect(`/o/${encodeURIComponent(orgSlug)}/admin/assets`);
  }

  async function deleteAsset() {
    "use server";
    const fetchedOrg = await findOrgBySlug(orgSlug);
    if (!fetchedOrg) notFound();
    await requireAdminSession(fetchedOrg.id, orgSlug);

    await prisma.asset.deleteMany({ where: { id: assetId, org_id: fetchedOrg.id } });
    redirect(`/o/${encodeURIComponent(orgSlug)}/admin/assets`);
  }

  return (
    <>
      <div className="mb-6">
        <a
          href={`/o/${encodeURIComponent(orgSlug)}/admin/assets`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          &larr; Back to assets
        </a>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-semibold">Edit Asset</h1>
          <a
            href={`/a/${asset.public_token}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Open public link
            <span aria-hidden="true">{"\u2197"}</span>
          </a>
        </div>
      </div>

      {error === "name" && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">Name is required</p>
      )}

      <form action={updateAsset} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={asset.name}
            required
            maxLength={200}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            name="location"
            defaultValue={asset.location ?? ""}
            maxLength={200}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={asset.notes ?? ""}
            maxLength={2000}
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_public"
            name="is_public"
            type="checkbox"
            defaultChecked={asset.is_public}
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium" htmlFor="is_public">
            Public
          </label>
        </div>

        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Save
        </button>
      </form>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-10">
        <h2 className="text-lg font-medium mb-4">QR Code</h2>
        <div className="flex items-start gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/o/${encodeURIComponent(orgSlug)}/admin/assets/${encodeURIComponent(assetId)}/qr`}
            alt="QR code for this asset"
            width={200}
            height={200}
            className="rounded border border-gray-200 dark:border-gray-700"
          />
          <div className="space-y-2">
            <a
              href={`/api/o/${encodeURIComponent(orgSlug)}/admin/assets/${encodeURIComponent(assetId)}/qr`}
              download
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Download QR code
            </a>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Encodes: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">/a/{asset.public_token}</code>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-10">
        <h2 className="text-lg font-medium mb-4">Documents</h2>
        <DocumentList assetId={assetId} orgSlug={orgSlug} />

        <div className="mt-6">
          <DocumentUploadForm orgSlug={orgSlug} assetId={assetId} />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-10">
        <h2 className="text-lg font-medium text-red-600 dark:text-red-400 mb-3">Danger Zone</h2>
        <form action={deleteAsset}>
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600"
          >
            Delete asset
          </button>
        </form>
      </div>
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
    return <p className="text-gray-500 dark:text-gray-400">No documents yet.</p>;
  }

  return (
    <div className="space-y-3">
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
    </div>
  );
}
