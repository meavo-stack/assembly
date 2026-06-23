import Link from "next/link";
import { Suspense } from "react";
import { SubmissionStatus } from "@prisma/client";
import { refreshFromSheet } from "@/app/actions/meavo";
import { AssemblyFilters } from "@/components/assembly-filters";
import { requireMeavoAccess } from "@/lib/meavo-auth";
import {
  buildAssemblyWhere,
  formatFilterDateLabel,
  parseAssemblyFilters,
} from "@/lib/assembly-filters";
import { prisma } from "@/lib/prisma";
import { Button, Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", { timeZone: "UTC" });
}

export default async function AssembliesPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    from?: string;
    to?: string;
    market?: string;
    partner?: string;
    q?: string;
  }>;
}) {
  await requireMeavoAccess();

  const params = await searchParams;
  const filters = parseAssemblyFilters(params);
  const where = buildAssemblyWhere(filters);

  const [assemblies, importState, marketRows, partners] = await Promise.all([
    prisma.assembly.findMany({
      where,
      orderBy: [{ assemblyDate: "asc" }, { dealId: "asc" }],
      include: {
        installPartner: true,
        submissions: { select: { status: true } },
      },
      take: 500,
    }),
    prisma.sheetImportState.findUnique({ where: { id: "default" } }),
    prisma.assembly.findMany({
      where: { market: { not: "" } },
      distinct: ["market"],
      select: { market: true },
      orderBy: { market: "asc" },
    }),
    prisma.assemblyPartner.findMany({
      where: { isInternal: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const markets = marketRows.map((row) => row.market);
  const dateLabel = formatFilterDateLabel(filters);
  const marketLabel = filters.market ?? "All markets";
  const partnerLabel =
    partners.find((partner) => partner.id === filters.partnerId)?.name ?? "All partners";

  return (
    <>
      <PageHeader
        title="Assemblies"
        description="Mirrored from the delivery tracker sheet. CS continues scheduling in Google Sheets."
      >
        <form
          action={async () => {
            "use server";
            await refreshFromSheet();
          }}
        >
          <Button type="submit">Refresh from sheet</Button>
        </form>
      </PageHeader>

      <Suspense fallback={null}>
        <AssemblyFilters filters={filters} markets={markets} partners={partners} />
      </Suspense>

      <p className="mb-4 text-sm text-slate-500">
        Showing {assemblies.length} {assemblies.length === 1 ? "assembly" : "assemblies"} for{" "}
        <span className="font-medium text-slate-700">{dateLabel}</span>
        {filters.market ? (
          <>
            {" "}
            in <span className="font-medium text-slate-700">{marketLabel}</span>
          </>
        ) : null}
        {filters.partnerId ? (
          <>
            {" "}
            for <span className="font-medium text-slate-700">{partnerLabel}</span>
          </>
        ) : null}
        {filters.search ? (
          <>
            {" "}
            matching <span className="font-medium text-slate-700">&quot;{filters.search}&quot;</span>
          </>
        ) : null}
        {importState?.lastRunAt ? (
          <>
            {" "}
            · Last import: {importState.lastRunAt.toLocaleString("en-GB")} ({importState.rowCount}{" "}
            rows)
          </>
        ) : null}
      </p>

      <div className="grid gap-3">
        {assemblies.map((assembly) => {
          const submitted = assembly.submissions.some((s) => s.status === SubmissionStatus.SUBMITTED);
          return (
            <Link key={assembly.id} href={`/assemblies/${encodeURIComponent(assembly.dealId)}`}>
              <Card className="transition hover:border-brand-500">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{assembly.dealId}</p>
                    <p className="text-sm text-slate-600">{assembly.clientName || "Unknown client"}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p>{formatDate(assembly.assemblyDate)}</p>
                    <p>{assembly.market}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500">Install: {assembly.installPartnerName || "—"}</span>
                  <span
                    className={
                      submitted
                        ? "rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800"
                        : "rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600"
                    }
                  >
                    {submitted ? "Questionnaire completed" : "Not completed"}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
        {assemblies.length === 0 && (
          <Card>
            <p className="text-sm text-slate-600">
              No assemblies match these filters. Try another date, market, partner, or search term, or
              refresh from the sheet.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
