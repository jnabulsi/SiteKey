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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Assets</h1>
        <a
          href={`/o/${encodeURIComponent(orgSlug)}/admin/assets/new`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          New asset
        </a>
      </div>

      {assets.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No assets yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Visibility</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {assets.map((a) => (
                <tr key={a.id}>
                  <td className="py-3 font-medium">{a.name}</td>
                  <td className="py-3">
                    {a.is_public ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-950 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-green-600/20 ring-inset">
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-50 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20 ring-inset">
                        Private
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right space-x-3">
                    <a
                      href={`/o/${encodeURIComponent(orgSlug)}/admin/assets/${a.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </a>
                    <a
                      href={`/a/${a.public_token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
