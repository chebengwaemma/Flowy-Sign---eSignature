export default function IntegrationsPage() {
  const items = ["Google Drive", "Slack", "Salesforce", "HubSpot", "Zapier", "Microsoft 365"];
  return (
    <div className="home-page rise space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1e1919]">Integrations</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Connect Flowy Sign to the tools your team already uses.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((name) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white px-5 py-4"
          >
            <span className="font-medium text-[#1e1919]">{name}</span>
            <button type="button" className="btn-bulk !w-auto px-4 py-2 text-sm">
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
