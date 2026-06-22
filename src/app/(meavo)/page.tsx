import Link from "next/link";
import { SubmissionStatus } from "@prisma/client";
import { refreshFromSheet } from "@/app/actions/meavo";
import { requireMeavoAccess } from "@/lib/meavo-auth";
import { prisma } from "@/lib/prisma";
import { Button, Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB");
}

export default async function AssembliesPage() {
  await requireMeavoAccess();

  const [assemblies, importState] = await Promise.all([
    prisma.assembly.findMany({
      orderBy: [{ assemblyDate: "asc" }, { dealId: "asc" }],
      include: {
        installPartner: true,
        submissions: { select: { status: true } },
      },
      take: 200,
    }),
    prisma.sheetImportState.findUnique({ where: { id: "default" } }),
  ]);

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

      {importState?.lastRunAt && (
        <p className="mb-4 text-sm text-slate-500">
          Last import: {importState.lastRunAt.toLocaleString("en-GB")} ({importState.rowCount} rows)
        </p>
      )}

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
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>Install: {assembly.installPartnerName || "—"}</span>
                  {submitted && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800">
                      Questionnaire submitted
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
        {assemblies.length === 0 && (
          <Card>
            <p className="text-sm text-slate-600">
              No assemblies yet. Configure Google Sheets credentials and click Refresh from sheet.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
