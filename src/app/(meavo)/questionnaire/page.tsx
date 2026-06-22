import { requireMeavoAccess } from "@/lib/meavo-auth";
import { prisma } from "@/lib/prisma";
import {
  addQuestion,
  deleteQuestion,
  toggleQuestionnairePublished,
} from "@/app/actions/meavo";
import { Button, Card, Input, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function QuestionnairePage() {
  await requireMeavoAccess();

  const questionnaire = await prisma.questionnaire.findFirst({
    orderBy: { createdAt: "asc" },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <>
      <PageHeader
        title="Install questionnaire"
        description="Partners complete these steps one at a time on mobile, then attach photos."
      >
        {questionnaire && (
          <form action={toggleQuestionnairePublished}>
            <input type="hidden" name="publish" value={String(!questionnaire.isPublished)} />
            <Button type="submit" variant="secondary">
              {questionnaire.isPublished ? "Unpublish" : "Publish"}
            </Button>
          </form>
        )}
      </PageHeader>

      <Card className="mb-6">
        <h2 className="font-medium text-slate-900">Add question</h2>
        <form action={addQuestion} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input label="Question" name="text" required placeholder="All panels fitted correctly" />
          </div>
          <div className="flex items-end">
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-3">
        {questionnaire?.questions.map((q, index) => (
          <Card key={q.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Step {index + 1}</p>
                <p className="mt-1 text-slate-900">{q.text}</p>
              </div>
              <form action={deleteQuestion}>
                <input type="hidden" name="id" value={q.id} />
                <Button type="submit" variant="danger">
                  Remove
                </Button>
              </form>
            </div>
          </Card>
        ))}
        {!questionnaire?.questions.length && (
          <Card>
            <p className="text-sm text-slate-600">No questions yet. Add your first install check above.</p>
          </Card>
        )}
      </div>
    </>
  );
}
