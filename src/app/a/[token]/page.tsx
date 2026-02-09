import { redirect, notFound } from "next/navigation";
import { findAssetByPublicToken } from "@/lib/assets/assetRepo";
import { getSession } from "@/lib/auth/getSession";
import { listReadyDocumentsForAsset } from "@/lib/documents/documentRepo";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function AssetPage(props: Props) {
  const { token } = await props.params;

  const asset = await findAssetByPublicToken(token);
  if (!asset) notFound();

  // Public asset: always accessible
  if (asset.is_public) {
    const documents = await listReadyDocumentsForAsset(asset.id);

    return (
      <main style={{ padding: 16 }}>
        <h1>{asset.name}</h1>
        <p>Public asset</p>

        <h2 style={{ marginTop: 16 }}>Documents</h2>
        {documents.length === 0 ? (
          <p>No documents.</p>
        ) : (
          <ul>
            {documents.map((d) => (
              <li key={d.id}>
                <a href={`/d/${d.id}`}>{d.title}</a>
                {d.doc_type ? ` (${d.doc_type})` : null}
              </li>
            ))}
          </ul>
        )}
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
    <main style={{ padding: 16 }}>
      <h1>{asset.name}</h1>
      <p>Private asset (authorised)</p>

      <h2 style={{ marginTop: 16 }}>Documents</h2>
      {documents.length === 0 ? (
        <p>No documents.</p>
      ) : (
        <ul>
          {documents.map((d) => (
            <li key={d.id}>
              <a href={`/d/${d.id}`}>{d.title}</a>
              {d.doc_type ? ` (${d.doc_type})` : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

