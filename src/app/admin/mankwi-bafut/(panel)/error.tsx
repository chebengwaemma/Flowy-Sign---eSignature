"use client";

export default function AdminPanelError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">Admin didn’t open</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        The control center could not read the database. In MongoDB Atlas → Network Access, allow
        0.0.0.0/0, then try again.
      </p>
      <button type="button" className="btn btn-primary mt-6" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
