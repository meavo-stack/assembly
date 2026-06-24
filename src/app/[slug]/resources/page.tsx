import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePartnerSession } from "@/lib/partner-session";
import { parseBoothModelFilter } from "@/lib/booth-models";
import { prisma } from "@/lib/prisma";
import { MEVAO_RESERVED_SEGMENTS } from "@/lib/constants";
import { ResourceLibraryList } from "@/components/resource-library-list";

export const dynamic = "force-dynamic";

export default async function PartnerResourcesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ model?: string }>;
}) {
  const { slug } = await params;
  if (MEVAO_RESERVED_SEGMENTS.has(slug)) notFound();

  const partner = await requirePartnerSession(slug);
  if (!partner) notFound();

  const { model: modelParam } = await searchParams;
  const modelFilter = parseBoothModelFilter(modelParam);

  const resources = await prisma.resource.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { models: true },
    ...(modelFilter ? { where: { models: { some: { boothModel: modelFilter } } } } : {}),
  });

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6">
      <div className="mb-6">
        <Link href={`/${slug}`} className="text-sm text-brand-700 underline">
          ← Back to assemblies
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Resource library</h1>
        <p className="text-sm text-slate-600">Assembly guides and troubleshooting</p>
      </div>

      <ResourceLibraryList
        resources={resources}
        basePath={`/${slug}/resources`}
        modelFilter={modelFilter}
      />
    </div>
  );
}
