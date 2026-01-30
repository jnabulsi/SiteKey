type Props = { params: Promise<{ assetId: string }> };

export default async function EditAssetPage(props: Props) {
  const { assetId } = await props.params;

  return (
    <>
      <h1>Edit Asset</h1>
      <p>Asset ID: {assetId}</p>
      <p>TODO</p>
    </>
  );
}

