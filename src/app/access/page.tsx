import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { findAssetByPublicToken } from "@/lib/assets/assetRepo";
import { createFieldSession } from "@/lib/auth/sessionRepo";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/passwords";
import { checkRateLimit } from "@/lib/rateLimit/rateLimit";

const ACCESS_MAX = 10;
const ACCESS_WINDOW_MS = 10 * 60 * 1000;

type Props = {
  searchParams: Promise<{
    next?: string;
    assetToken?: string;
    error?: string;
  }>;
};

export default async function AccessPage(props: Props) {
  const { next = "/", assetToken = "", error } = await props.searchParams;

  async function access(formData: FormData) {
    "use server";
    const hdrs = await headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      hdrs.get("x-real-ip") ||
      "unknown";

    const rl = await checkRateLimit(`access:${ip}`, ACCESS_MAX, ACCESS_WINDOW_MS);

    const accessCode = String(formData.get("accessCode") ?? "");
    const token = String(formData.get("assetToken") ?? "");
    const nextUrl = String(formData.get("next") ?? "/");

    function failRedirect(err: string): never {
      const params = new URLSearchParams({ error: err });
      if (token) params.set("assetToken", token);
      if (nextUrl && nextUrl !== "/") params.set("next", nextUrl);
      redirect(`/access?${params}`);
    }

    if (!rl.allowed) failRedirect("rate_limit");

    const asset = await findAssetByPublicToken(token);
    if (!asset) failRedirect("invalid");

    const org = await prisma.organisation.findUnique({ where: { id: asset.org_id } });
    if (!org) failRedirect("invalid");

    const valid = await verifyPassword(accessCode, org.access_code_hash);
    if (!valid) failRedirect("invalid");

    const { rawToken, expiresAt } = await createFieldSession(org.id);
    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      httpOnly: true,
      secure: true,
      value: rawToken,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    const safeNext = nextUrl.startsWith("/") ? nextUrl : "/";
    redirect(safeNext);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold">Access</h1>

        {error === "invalid" && (
          <p className="text-sm text-red-600 dark:text-red-400">Invalid access code</p>
        )}
        {error === "rate_limit" && (
          <p className="text-sm text-red-600 dark:text-red-400">Too many attempts. Please try again later.</p>
        )}

        <form action={access} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="assetToken" value={assetToken} />

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="accessCode">
              Access code
            </label>
            <input
              id="accessCode"
              name="accessCode"
              type="password"
              required
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
