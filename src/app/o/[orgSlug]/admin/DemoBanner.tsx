"use client";

import { useState } from "react";

function calcHoursLeft(expiresAt: string): number {
  return Math.max(
    0,
    Math.round((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
  );
}

export default function DemoBanner({ expiresAt }: { expiresAt: string }) {
  const [hoursLeft] = useState(() => calcHoursLeft(expiresAt));

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-center text-sm text-amber-800 dark:text-amber-200">
      Demo organisation — expires in {hoursLeft}h.
      {" "}Password: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">demo1234</code>
      {" "}Access code: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">demo1234</code>
    </div>
  );
}
