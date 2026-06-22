import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let questionnaire = await prisma.questionnaire.findFirst();
  if (!questionnaire) {
    questionnaire = await prisma.questionnaire.create({
      data: {
        isPublished: true,
        questions: {
          create: [
            { text: "Booth is level and securely positioned", sortOrder: 0, required: true },
            { text: "All panels are fitted and doors close properly", sortOrder: 1, required: true },
            { text: "Power and lighting tested and working", sortOrder: 2, required: true },
            { text: "Ventilation/fans tested (if applicable)", sortOrder: 3, required: true },
            { text: "Area cleaned and packaging removed", sortOrder: 4, required: true },
          ],
        },
      },
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
