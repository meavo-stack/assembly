import { ReactNode } from "react";
import { Card } from "@/components/ui";

export type AssemblyListCardProps = {
  dealId: string;
  clientName: string;
  channelType: string;
  assemblyDate: Date | null;
  market: string;
  installPartnerName: string;
  deliveryPartnerName: string;
  submitted: boolean;
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", { timeZone: "UTC" });
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

function PartnerField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value || "—"}</p>
    </div>
  );
}

export function AssemblyListCard({
  dealId,
  clientName,
  channelType,
  assemblyDate,
  market,
  installPartnerName,
  deliveryPartnerName,
  submitted,
}: AssemblyListCardProps) {
  return (
    <Card className="transition hover:border-brand-500">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-medium text-slate-900">{dealId}</p>
        <span
          className={
            submitted
              ? "shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
              : "shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
          }
        >
          {submitted ? "Questionnaire completed" : "Not completed"}
        </span>
      </div>

      <p className="mt-1 truncate text-sm text-slate-600">{clientName || "Unknown client"}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <MetaChip>{formatDate(assemblyDate)}</MetaChip>
        {market ? <MetaChip>{market}</MetaChip> : null}
        {channelType ? <MetaChip>{channelType}</MetaChip> : null}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
        <PartnerField label="Install" value={installPartnerName} />
        <PartnerField label="Delivery" value={deliveryPartnerName} />
      </div>
    </Card>
  );
}
