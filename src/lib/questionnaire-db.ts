import { prisma } from "@/lib/prisma";

export async function migrateOrphanQuestions(questionnaireId: string): Promise<void> {
  const orphans = await prisma.question.findMany({
    where: { questionnaireId, sectionId: null },
    orderBy: { sortOrder: "asc" },
  });
  if (orphans.length === 0) return;

  const maxSectionOrder = await prisma.questionnaireSection.aggregate({
    where: { questionnaireId },
    _max: { sortOrder: true },
  });

  const section = await prisma.questionnaireSection.create({
    data: {
      questionnaireId,
      title: "Install checks",
      sortOrder: (maxSectionOrder._max.sortOrder ?? -1) + 1,
    },
  });

  await prisma.$transaction(
    orphans.map((q, index) =>
      prisma.question.update({
        where: { id: q.id },
        data: { sectionId: section.id, sortOrder: index },
      }),
    ),
  );
}
