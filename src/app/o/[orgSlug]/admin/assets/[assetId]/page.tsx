import { prisma } from "@/lib/db/prisma";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ orgSlug: string; assetId: string }>;
};

export default async function EditAssetPage(props: Props) {
  const { orgSlug, assetId } = await props.params;

  const org = await findOrgBySlug(orgSlug);
  if (!org) notFound();

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, org_id: org.id },
  });
  if (!asset) notFound();

  return (
    <>
      <h1>Edit Asset</h1>

      <p>
        <a href={`/a/${asset.public_token}`} target="_blank" rel="noreferrer">
          Open public link
        </a>
      </p>
      <form method="POST" action={`/api/o/${orgSlug}/admin/assets/${assetId}`}>
        <input type="hidden" name="action" value="update" />
        <div>
          <label>
            Name
            <br />
            <input name="name" defaultValue={asset.name} required />
          </label>
        </div>

        <div>
          <label>
            Location
            <br />
            <input name="location" defaultValue={asset.location ?? ""} />
          </label>
        </div>

        <div>
          <label>
            Notes
            <br />
            <textarea name="notes" rows={4} defaultValue={asset.notes ?? ""} />
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

      <form method="POST" action={`/api/o/${orgSlug}/admin/assets/${assetId}`}>
        <input type="hidden" name="action" value="delete" />
        <button type="submit">Delete asset</button>
      </form>
    </>
  );
}

