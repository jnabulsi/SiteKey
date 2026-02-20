type Props = {
  searchParams: Promise<{
    next?: string;
    assetToken?: string;
    error?: string;
  }>;
};

export default async function AccessPage(props: Props) {
  const { next = "/", assetToken = "", error } = await props.searchParams;

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

        <form method="POST" action="/api/access" className="space-y-4">
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
