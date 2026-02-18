import { findAssetsForOrg } from "@/lib/assets/assetRepo";
import { findOrgBySlug } from "@/lib/org/orgRepo";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{
    q?: string;
    visibility?: string;
    sort?: string;
  }>;
};

function parseVisibility(v?: string): "public" | "private" | undefined {
  if (v === "public" || v === "private") return v;
  return undefined;
}

function parseSort(
  s?: string,
): "name-asc" | "name-desc" | "created-asc" | "created-desc" | undefined {
  const valid = ["name-asc", "name-desc", "created-asc", "created-desc"];
  if (s && valid.includes(s))
    return s as "name-asc" | "name-desc" | "created-asc" | "created-desc";
  return undefined;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminAssetsPage(props: Props) {
  const { orgSlug } = await props.params;
  const sp = await props.searchParams;

  const org = await findOrgBySlug(orgSlug);
  if (!org) notFound();

  const search = sp.q?.trim() || undefined;
  const visibility = parseVisibility(sp.visibility);
  const sort = parseSort(sp.sort);

  const assets = await findAssetsForOrg(org.id, { search, visibility, sort });

  const hasFilters = search || visibility || sort;
  const orgPrefix = `/o/${encodeURIComponent(orgSlug)}`;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Assets</h1>
        <a
          href={`${orgPrefix}/admin/assets/new`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          New asset
        </a>
      </div>

      {/* Search / filter bar */}
      <form
        method="GET"
        className="mb-4 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[180px]">
          <label
            htmlFor="q"
            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            Search
          </label>
          <input
            type="text"
            id="q"
            name="q"
            defaultValue={search ?? ""}
            placeholder="Asset name..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="visibility"
            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            Visibility
          </label>
          <select
            id="visibility"
            name="visibility"
            defaultValue={visibility ?? ""}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="sort"
            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort ?? ""}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Newest</option>
            <option value="created-asc">Oldest</option>
            <option value="name-asc">A&#8211;Z</option>
            <option value="name-desc">Z&#8211;A</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-md bg-gray-100 dark:bg-gray-800 px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Filter
        </button>

        {hasFilters && (
          <a
            href={`${orgPrefix}/admin/assets`}
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline py-1.5"
          >
            Clear
          </a>
        )}
      </form>

      {assets.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          {hasFilters ? "No matching assets." : "No assets yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Docs</th>
                <th className="px-4 py-2.5 font-medium">Visibility</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {assets.map((a) => {
                const editHref = `${orgPrefix}/admin/assets/${a.id}`;
                return (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <a
                        href={editHref}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {a.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {a._count.documents}
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(a.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <a
                        href={`/api${orgPrefix}/admin/assets/${a.id}/qr`}
                        download
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        QR
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
