import Link from "next/link";
import { BoothModel, ResourceType } from "@prisma/client";
import { BOOTH_MODEL_GROUPS, boothModelLabel } from "@/lib/booth-models";
import { resourceTypeLabel } from "@/lib/resources";
import { Card } from "@/components/ui";

export type ResourceListItem = {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  models: { boothModel: BoothModel }[];
};

export function ResourceLibraryList({
  resources,
  basePath,
  modelFilter,
  preview = false,
}: {
  resources: ResourceListItem[];
  basePath: string;
  modelFilter: BoothModel | null;
  preview?: boolean;
}) {
  return (
    <>
      {preview && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-medium">Preview mode</span> — this is how partners see the resource library.
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={basePath}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !modelFilter ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          All models
        </Link>
        {BOOTH_MODEL_GROUPS.map((group) => (
          <div key={group.line} className="flex flex-wrap gap-2">
            {group.models.map((model) => (
              <Link
                key={model.value}
                href={`${basePath}?model=${model.value}`}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  modelFilter === model.value
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {model.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        {resources.map((resource) => (
          <Link key={resource.id} href={`${basePath}/${resource.id}`}>
            <Card className="transition hover:border-brand-500">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{resource.title}</p>
                  {resource.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{resource.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {resource.models.map((entry) => (
                      <span
                        key={entry.boothModel}
                        className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800"
                      >
                        {boothModelLabel(entry.boothModel)}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {resourceTypeLabel(resource.type)}
                </span>
              </div>
            </Card>
          </Link>
        ))}
        {resources.length === 0 && (
          <Card>
            <p className="text-sm text-slate-600">
              {modelFilter
                ? `No resources for ${boothModelLabel(modelFilter)} yet.`
                : preview
                  ? "No resources in the library yet. Add resources on the builder page, then preview again."
                  : "No resources available yet."}
            </p>
            {modelFilter && (
              <Link href={basePath} className="mt-2 inline-block text-sm text-brand-700 underline">
                Show all resources
              </Link>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
