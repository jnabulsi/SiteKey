import { redirect, notFound } from "next/navigation";
import { findAssetByPublicToken } from "@/lib/assets/assetRepo";
import { getSession } from "@/lib/auth/getSession";
import { listReadyDocumentsForAsset } from "@/lib/documents/documentRepo";

type Props = {
  params: Promise<{ token: string }>;
};

function DocumentList({
  documents,
}: {
  documents: {
    id: string;
    title: string;
    doc_type: string | null;
    notes: string | null;
  }[];
}) {
  if (documents.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No documents.</p>;
  }

  return (
    <div className="space-y-2">
      {documents.map((d) => (
        <a
          key={d.id}
          href={`/d/${d.id}`}
          className="block rounded-md border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-baseline gap-2">
            <span className="font-medium">{d.title}</span>
            {d.doc_type && (
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {d.doc_type}
              </span>
            )}
          </div>
          {d.notes && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {d.notes}
            </p>
          )}
        </a>
      ))}
    </div>
  );
}

export default async function AssetPage(props: Props) {
  const { token } = await props.params;

  const asset = await findAssetByPublicToken(token);
  if (!asset) notFound();

  // Public asset: always accessible
  if (asset.is_public) {
    const documents = await listReadyDocumentsForAsset(asset.id);

    return (
      <main className="flex min-h-screen items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{asset.name}</h1>
            {asset.location && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{asset.location}</p>
            )}
            {asset.notes && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">{asset.notes}</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium mb-3">Documents</h2>
            <DocumentList documents={documents} />
          </div>
        </div>
      </main>
    );
  }

  // Private asset: require session for the same org
  const session = await getSession();
  if (!session || session.org_id !== asset.org_id) {
    redirect(
      `/access?next=/a/${encodeURIComponent(token)}&assetToken=${encodeURIComponent(token)}`
    );
  }

  const documents = await listReadyDocumentsForAsset(asset.id);

  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{asset.name}</h1>
          {asset.location && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{asset.location}</p>
          )}
          {asset.notes && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">{asset.notes}</p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Documents</h2>
          <DocumentList documents={documents} />
        </div>
      </div>
    </main>
  );
}
