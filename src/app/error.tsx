"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="label-mono text-accent">oops</p>
      <p className="stadium-banner mt-2 text-3xl">This page couldn’t load</p>
      <p className="mt-3 text-sm text-muted">
        Reload to try again, or head back home.
      </p>
      {error.message && (
        <p className="mt-4 break-all font-mono text-xs text-danger">
          {error.message}
        </p>
      )}
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" className="btn-primary" onClick={() => reset()}>
          Reload
        </button>
        <a href="/" className="btn-ghost">
          Back home
        </a>
      </div>
    </div>
  );
}
