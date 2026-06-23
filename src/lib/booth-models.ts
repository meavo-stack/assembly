import { BoothModel } from "@prisma/client";

export type BoothModelGroup = {
  line: string;
  models: { value: BoothModel; label: string }[];
};

export const BOOTH_MODEL_GROUPS: BoothModelGroup[] = [
  {
    line: "Classic Line",
    models: [
      { value: BoothModel.SOHO, label: "Soho" },
      { value: BoothModel.WORKSTATION, label: "Workstation" },
      { value: BoothModel.CAMDEN_2, label: "Camden 2" },
      { value: BoothModel.CAMDEN_4, label: "Camden 4" },
    ],
  },
  {
    line: "Haven Line",
    models: [
      { value: BoothModel.HAVEN_ONE, label: "Haven One" },
      { value: BoothModel.HAVEN_FOCUS, label: "Haven Focus" },
      { value: BoothModel.HAVEN_2, label: "Haven 2" },
      { value: BoothModel.HAVEN_4, label: "Haven 4" },
    ],
  },
];

export const ALL_BOOTH_MODELS = BOOTH_MODEL_GROUPS.flatMap((group) => group.models);

export function boothModelLabel(model: BoothModel): string {
  return ALL_BOOTH_MODELS.find((entry) => entry.value === model)?.label ?? model;
}

export function parseBoothModels(formData: FormData): BoothModel[] {
  const values = formData.getAll("models").map(String);
  const allowed = new Set(ALL_BOOTH_MODELS.map((entry) => entry.value));
  return values.filter((value): value is BoothModel => allowed.has(value as BoothModel));
}

export function parseYoutubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      const id = parsed.searchParams.get("v");
      return id || null;
    }
  } catch {
    return null;
  }

  return null;
}
