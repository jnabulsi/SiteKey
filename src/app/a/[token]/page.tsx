import { redirect, notFound } from "next/navigation";
import { findAssetByPublicToken } from "@/lib/assets/assetRepo";
import { getSession } from "@/lib/auth/getSession";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function AssetPage(props: Props) {
  const { token } = await props.params;

  const asset = await findAssetByPublicToken(token);
  if (!asset) notFound();

  // Public asset: always accessible
  if (asset.is_public) {
    return (
      <main style={{ padding: 16 }}>
        <h1>{asset.name}</h1>
        <p>Public asset</p>
      </main>
    );
  }

  // Private asset: require session for the same org
  const session = await getSession();
  if (!session || session.org_id !== asset.org_id) {
    redirect(`/access?next=/a/${encodeURIComponent(token)}&assetToken=${encodeURIComponent(token)}`);
  }

  return (
    <main style={{ padding: 16 }}>
      <h1>{asset.name}</h1>
      <p>Private asset (authorised)</p>
    </main>
  );
}

