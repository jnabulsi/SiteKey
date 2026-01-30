type Props = {
  params: Promise<{ orgSlug: string }>;
};

export default async function NewAssetPage(props: Props) {
  const { orgSlug } = await props.params;

  return (
    <>
      <h1>New Asset</h1>

      <form method="POST" action={`/api/o/${orgSlug}/admin/assets`}>
        <div>
          <label>
            Name
            <br />
            <input name="name" required />
          </label>
        </div>

        <div>
          <label>
            Location
            <br />
            <input name="location" />
          </label>
        </div>

        <div>
          <label>
            Notes
            <br />
            <textarea name="notes" rows={4} />
          </label>
        </div>

        <div>
          <label>
            <input name="is_public" type="checkbox" /> Public
          </label>
        </div>

        <button type="submit">Create</button>
      </form>
    </>
  );
}

