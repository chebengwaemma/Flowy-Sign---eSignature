import { notFound } from "next/navigation";
import { DetailPageView } from "@/components/marketing/DetailPageView";
import { TEAM_PAGES } from "@/components/marketing/page-content";
import { getMarketing } from "@/lib/get-marketing";

export function generateStaticParams() {
  return TEAM_PAGES.map((p) => ({ slug: p.slug }));
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { teamPages } = await getMarketing();
  const page = teamPages.find((p) => p.slug === slug);
  if (!page) notFound();

  const related = teamPages
    .filter((p) => p.slug !== slug)
    .slice(0, 4)
    .map((p) => ({
      href: `/teams/${p.slug}`,
      title: p.title,
      desc: p.lead,
    }));

  return <DetailPageView page={{ ...page, related }} />;
}
