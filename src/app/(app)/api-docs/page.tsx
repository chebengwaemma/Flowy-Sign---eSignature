import { ScrollMeetBlock } from "@/components/landing/ScrollMeetBlock";
import { ScrollMeetSplit } from "@/components/landing/ScrollMeetSplit";
import { getAppUrl } from "@/lib/app-url";

export default function ApiDocsPage() {
  return (
    <div className="home-page app-meet-page space-y-6">
      <ScrollMeetBlock side="left" distance={90}>
        <h1 className="text-2xl font-semibold text-[#1e1919]">API</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Embed signature requests and fax into your own product.
        </p>
      </ScrollMeetBlock>
      <ScrollMeetSplit className="app-meet-stack" itemClassName="app-meet-item" distance={110}>
        <div className="rounded-xl border border-[var(--line)] bg-white p-6">
          <p className="text-sm font-semibold text-[#1e1919]">Base URL</p>
          <code className="mt-2 block rounded-lg bg-[#f3f1ef] px-3 py-2 text-sm">
            {getAppUrl()}/api
          </code>
        </div>
        <ul className="space-y-2 rounded-xl border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">
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
      </ScrollMeetSplit>
    </div>
  );
}
