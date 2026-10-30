import { notFound } from "next/navigation";
import { DetailPageView } from "@/components/marketing/DetailPageView";
import { getMarketing } from "@/lib/get-marketing";

export const dynamic = "force-dynamic";

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { featurePages } = await getMarketing();
  const page = featurePages.find((p) => p.slug === slug);
  if (!page) notFound();

  const related = featurePages
    .filter((p) => p.slug !== slug)
    .slice(0, 4)
    .map((p) => ({
      href: `/features/${p.slug}`,
      title: p.title,
      desc: p.lead,
    }));

  return <DetailPageView page={{ ...page, related }} />;
}
