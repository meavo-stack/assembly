import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CHECKS = [
  "Booth is level and securely positioned",
  "All panels are fitted and doors close properly",
  "Power and lighting tested and working",
  "Ventilation/fans tested (if applicable)",
  "Area cleaned and packaging removed",
];

async function main() {
  let questionnaire = await prisma.questionnaire.findFirst();
  if (!questionnaire) {
    questionnaire = await prisma.questionnaire.create({
      data: { isPublished: true },
    });

    const section = await prisma.questionnaireSection.create({
      data: {
        questionnaireId: questionnaire.id,
        title: "Install checks",
        sortOrder: 0,
      },
    });

    await prisma.question.createMany({
      data: DEFAULT_CHECKS.map((text, sortOrder) => ({
        questionnaireId: questionnaire!.id,
        sectionId: section.id,
        text,
        sortOrder,
        required: true,
      })),
    });

    console.log("Seeded default questionnaire:", questionnaire.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
