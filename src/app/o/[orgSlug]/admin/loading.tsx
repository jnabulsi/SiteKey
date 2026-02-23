export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-9 w-28 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="space-y-2">
              <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
