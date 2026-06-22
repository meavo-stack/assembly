"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMeavoAccess } from "@/lib/meavo-auth";
import { hashSecret } from "@/lib/password";
import { importAssembliesFromSheet } from "@/lib/sheets-import";
import { slugifyPartnerName } from "@/lib/slug";

export async function refreshFromSheet(): Promise<{ imported: number; partnersCreated: number }> {
  await requireMeavoAccess();
  const result = await importAssembliesFromSheet();
  revalidatePath("/");
  revalidatePath("/partners");
  return result;
}

export async function setPartnerAccessCode(formData: FormData): Promise<void> {
  await requireMeavoAccess();
  const partnerId = String(formData.get("partnerId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (!partnerId) return;

  await prisma.assemblyPartner.update({
    where: { id: partnerId },
    data: {
      ...(code ? { codeHash: await hashSecret(code) } : {}),
      isActive: true,
    },
  });
  revalidatePath("/partners");
}

export async function updatePartnerSlug(formData: FormData): Promise<void> {
  await requireMeavoAccess();
  const partnerId = String(formData.get("partnerId") ?? "");
  const slug = slugifyPartnerName(String(formData.get("slug") ?? ""));
  if (!partnerId || !slug) return;

  await prisma.assemblyPartner.update({
    where: { id: partnerId },
    data: { slug },
  });
  revalidatePath("/partners");
}

export async function createPartner(formData: FormData): Promise<void> {
  await requireMeavoAccess();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  if (!name) return;

  const slugBase = slugifyPartnerName(name);
  let slug = slugBase;
  let suffix = 2;
  while (await prisma.assemblyPartner.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  await prisma.assemblyPartner.create({
    data: {
      name,
      slug,
      codeHash: code ? await hashSecret(code) : null,
    },
  });
  revalidatePath("/partners");
}

export async function addQuestion(formData: FormData): Promise<void> {
  await requireMeavoAccess();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const questionnaire = await getOrCreateQuestionnaire();
  const maxOrder = await prisma.question.aggregate({
    where: { questionnaireId: questionnaire.id },
    _max: { sortOrder: true },
  });

  await prisma.question.create({
    data: {
      questionnaireId: questionnaire.id,
      text,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/questionnaire");
}

export async function deleteQuestion(formData: FormData): Promise<void> {
  await requireMeavoAccess();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.question.delete({ where: { id } });
  revalidatePath("/questionnaire");
}

export async function toggleQuestionnairePublished(formData: FormData): Promise<void> {
  await requireMeavoAccess();
  const questionnaire = await getOrCreateQuestionnaire();
  const publish = formData.get("publish") === "true";
  await prisma.questionnaire.update({
    where: { id: questionnaire.id },
    data: { isPublished: publish },
  });
  revalidatePath("/questionnaire");
}

async function getOrCreateQuestionnaire() {
  const existing = await prisma.questionnaire.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;
  return prisma.questionnaire.create({ data: { isPublished: false } });
}
