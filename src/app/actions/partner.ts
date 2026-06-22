"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SubmissionStatus } from "@prisma/client";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { verifySecret } from "@/lib/password";
import { setPartnerSession, clearPartnerSession } from "@/lib/partner-session";

export async function partnerLogin(slug: string, formData: FormData): Promise<{ error?: string }> {
  const code = String(formData.get("code") ?? "").trim();
  const partner = await prisma.assemblyPartner.findFirst({
    where: { slug, isActive: true },
  });

  if (!partner?.codeHash) {
    return { error: "Access is not configured for this partner. Contact MEAVO." };
  }

  const valid = await verifySecret(code, partner.codeHash);
  if (!valid) return { error: "Invalid access code." };

  await setPartnerSession(partner.id);
  revalidatePath(`/${slug}`);
  redirect(`/${slug}`);
}

export async function partnerLogout(slug: string): Promise<void> {
  await clearPartnerSession();
  redirect(`/${slug}`);
}

export async function saveQuestionAnswer(
  slug: string,
  dealId: string,
  questionId: string,
  checked: boolean,
): Promise<void> {
  const partner = await prisma.assemblyPartner.findFirst({ where: { slug, isActive: true } });
  if (!partner) throw new Error("Partner not found");

  const assembly = await prisma.assembly.findFirst({
    where: { dealId, installPartnerId: partner.id },
  });
  if (!assembly) throw new Error("Assembly not found");

  const submission = await prisma.questionnaireSubmission.upsert({
    where: { assemblyId_partnerId: { assemblyId: assembly.id, partnerId: partner.id } },
    create: {
      assemblyId: assembly.id,
      partnerId: partner.id,
      status: SubmissionStatus.IN_PROGRESS,
    },
    update: {
      status: SubmissionStatus.IN_PROGRESS,
    },
  });

  await prisma.questionAnswer.upsert({
    where: {
      submissionId_questionId: { submissionId: submission.id, questionId },
    },
    create: { submissionId: submission.id, questionId, checked },
    update: { checked },
  });
}

export async function uploadSubmissionPhotos(
  slug: string,
  dealId: string,
  formData: FormData,
): Promise<void> {
  const partner = await prisma.assemblyPartner.findFirst({ where: { slug, isActive: true } });
  if (!partner) throw new Error("Partner not found");

  const assembly = await prisma.assembly.findFirst({
    where: { dealId, installPartnerId: partner.id },
  });
  if (!assembly) throw new Error("Assembly not found");

  const submission = await prisma.questionnaireSubmission.upsert({
    where: { assemblyId_partnerId: { assemblyId: assembly.id, partnerId: partner.id } },
    create: {
      assemblyId: assembly.id,
      partnerId: partner.id,
      status: SubmissionStatus.IN_PROGRESS,
    },
    update: {},
  });

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const existingCount = await prisma.submissionPhoto.count({ where: { submissionId: submission.id } });

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const blob = await put(`assembly/${assembly.dealId}/${Date.now()}-${file.name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    await prisma.submissionPhoto.create({
      data: {
        submissionId: submission.id,
        storageKey: blob.url,
        fileName: file.name,
        sortOrder: existingCount + i,
      },
    });
  }

  revalidatePath(`/${slug}/${dealId}`);
}

export async function submitQuestionnaire(slug: string, dealId: string): Promise<void> {
  const partner = await prisma.assemblyPartner.findFirst({ where: { slug, isActive: true } });
  if (!partner) throw new Error("Partner not found");

  const assembly = await prisma.assembly.findFirst({
    where: { dealId, installPartnerId: partner.id },
  });
  if (!assembly) throw new Error("Assembly not found");

  await prisma.questionnaireSubmission.upsert({
    where: { assemblyId_partnerId: { assemblyId: assembly.id, partnerId: partner.id } },
    create: {
      assemblyId: assembly.id,
      partnerId: partner.id,
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
    },
    update: {
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  revalidatePath(`/${slug}`);
  redirect(`/${slug}`);
}
