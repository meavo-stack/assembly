import { QuestionType } from "@prisma/client";
import { requireMeavoAccess } from "@/lib/meavo-auth";
import { prisma } from "@/lib/prisma";
import {
  addQuestion,
  deleteQuestion,
  moveQuestion,
  toggleQuestionnairePublished,
} from "@/app/actions/meavo";
import { Button, Card, Input, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

function questionTypeLabel(type: QuestionType): string {
  return type === QuestionType.TEXT ? "Free text" : "Checkbox";
}

export default async function QuestionnairePage() {
  await requireMeavoAccess();

  const questionnaire = await prisma.questionnaire.findFirst({
    orderBy: { createdAt: "asc" },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });

  const questions = questionnaire?.questions ?? [];

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
        <form action={addQuestion} className="mt-4 flex flex-col gap-3">
          <Input label="Question" name="text" required placeholder="All panels fitted correctly" />
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Answer type</span>
            <select
              name="type"
              defaultValue="CHECKBOX"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="CHECKBOX">Checkbox — tick to confirm</option>
              <option value="TEXT">Free text — partner types an answer</option>
            </select>
          </label>
          <div>
            <Button type="submit">Add question</Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-3">
        {questions.map((q, index) => (
          <Card key={q.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-slate-500">Step {index + 1}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {questionTypeLabel(q.type)}
                  </span>
                </div>
                <p className="mt-1 text-slate-900">{q.text}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex gap-1">
                  <form action={moveQuestion}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="direction" value="up" />
                    <Button type="submit" variant="secondary" className="px-2 py-1.5" disabled={index === 0}>
                      ↑
                    </Button>
                  </form>
                  <form action={moveQuestion}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="direction" value="down" />
                    <Button
                      type="submit"
                      variant="secondary"
                      className="px-2 py-1.5"
                      disabled={index === questions.length - 1}
                    >
                      ↓
                    </Button>
                  </form>
                </div>
                <form action={deleteQuestion}>
                  <input type="hidden" name="id" value={q.id} />
                  <Button type="submit" variant="danger">
                    Remove
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        ))}
        {!questions.length && (
          <Card>
            <p className="text-sm text-slate-600">No questions yet. Add your first install check above.</p>
          </Card>
        )}
      </div>
    </>
  );
}
