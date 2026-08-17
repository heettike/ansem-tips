"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-sm text-muted">error</p>
      <p className="display mt-4 text-4xl sm:text-5xl">
        page couldn&apos;t load
      </p>
      <p className="mt-4 text-muted">
        reload and try again. if it keeps happening, come back later.
      </p>
      <p className="mt-6 break-all rounded-lg border border-danger/30 p-3 text-xs text-danger">
        {error.message}
      </p>
      <div className="mt-10 flex justify-center gap-3">
        <button type="button" className="btn-primary" onClick={() => reset()}>
          reload
        </button>
        <Link href="/" className="btn-ghost">
          home
        </Link>
      </div>
    </div>
  );
}
