export default function ApiDocsPage() {
  return (
    <div className="home-page rise space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1e1919]">API</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Embed signature requests and fax into your own product.
        </p>
      </div>
      <div className="rounded-xl border border-[var(--line)] bg-white p-6">
        <p className="text-sm font-semibold text-[#1e1919]">Base URL</p>
        <code className="mt-2 block rounded-lg bg-[#f3f1ef] px-3 py-2 text-sm">
          {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api
        </code>
        <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
          <li>
            <code className="text-[#1e1919]">POST /api/documents</code> — create signature request
          </li>
          <li>
            <code className="text-[#1e1919]">POST /api/fax</code> — queue outbound fax
          </li>
          <li>
            <code className="text-[#1e1919]">POST /api/sign/[token]</code> — complete a signature
          </li>
        </ul>
      </div>
    </div>
  );
}
