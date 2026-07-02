"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BoothModel, ResourceType } from "@prisma/client";
import { BOOTH_MODEL_GROUPS } from "@/lib/booth-models";
import { resourceTypeLabel } from "@/lib/resources";
import { updateResource } from "@/app/actions/resources";
import { Button, Input } from "@/components/ui";

export type ResourceEditItem = {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  youtubeUrl: string | null;
  linkUrl: string | null;
  models: BoothModel[];
  files: { id: string; fileName: string }[];
};

export function ResourceEditForm({
  resource,
  onCancel,
}: {
  resource: ResourceEditItem;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const selectedModels = new Set(resource.models);

  return (
    <form
      className="space-y-4"
      encType="multipart/form-data"
      action={async (formData) => {
        setError(null);
        setPending(true);
        const result = await updateResource(formData);
        setPending(false);
        if (result.error) {
          setError(result.error);
          return;
        }
        onCancel();
        router.refresh();
      }}
    >
      <input type="hidden" name="id" value={resource.id} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Type</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {resourceTypeLabel(resource.type)}
        </span>
      </div>

      <Input label="Title" name="title" required defaultValue={resource.title} />

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Description (optional)</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={resource.description}
          placeholder="Short summary for partners"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>

      {resource.type === ResourceType.YOUTUBE && (
        <Input
          label="YouTube link"
          name="youtubeUrl"
          required
          defaultValue={resource.youtubeUrl ?? ""}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      )}

      {resource.type === ResourceType.LINK && (
        <Input
          label="Link URL"
          name="linkUrl"
          required
          defaultValue={resource.linkUrl ?? ""}
          placeholder="https://..."
        />
      )}

      {resource.type === ResourceType.PDF && (
        <>
          {resource.files.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-700">Existing PDFs</legend>
              <ul className="space-y-2">
                {resource.files.map((file) => (
                  <li key={file.id}>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="removeFileIds"
                        value={file.id}
                        className="rounded border-slate-300"
                      />
                      <span className="truncate">Remove {file.fileName}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Add more PDFs</span>
            <input
              name="files"
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="block w-full text-sm text-slate-600"
            />
            <p className="text-xs text-slate-500">Optional. Max 25 MB per PDF.</p>
          </label>
        </>
      )}

      {resource.type === ResourceType.IMAGE && (
        <>
          {resource.files.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-700">Existing images</legend>
              <ul className="space-y-2">
                {resource.files.map((file) => (
                  <li key={file.id}>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="removeFileIds"
                        value={file.id}
                        className="rounded border-slate-300"
                      />
                      <span className="truncate">Remove {file.fileName}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Add more images</span>
            <input
              name="files"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="block w-full text-sm text-slate-600"
            />
            <p className="text-xs text-slate-500">
              Optional. JPEG, PNG, WebP, or GIF — max 10 MB each.
            </p>
          </label>
        </>
      )}

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-700">Applicable booth models</legend>
        {BOOTH_MODEL_GROUPS.map((group) => (
          <div key={group.line}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{group.line}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {group.models.map((model) => (
                <label key={model.value} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="models"
                    value={model.value}
                    defaultChecked={selectedModels.has(model.value)}
                    className="rounded border-slate-300"
                  />
                  {model.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
