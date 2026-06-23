"use client";

import { useState, useTransition } from "react";
import { QuestionType } from "@prisma/client";
import { saveQuestionAnswer, submitQuestionnaire, uploadSubmissionPhotos } from "@/app/actions/partner";
import { Button, Card } from "@/components/ui";

type Question = {
  id: string;
  text: string;
  type: QuestionType;
  sortOrder: number;
};

type AnswerState = Record<string, { checked: boolean; text: string }>;

function isAnswered(question: Question, answers: AnswerState): boolean {
  const answer = answers[question.id];
  if (!answer) return false;
  if (question.type === QuestionType.TEXT) return answer.text.trim().length > 0;
  return answer.checked;
}

export function QuestionnaireWizard({
  slug,
  dealId,
  questions,
  initialAnswers,
  hasPhotos,
  isSubmitted,
}: {
  slug: string;
  dealId: string;
  questions: Question[];
  initialAnswers: AnswerState;
  hasPhotos: boolean;
  isSubmitted: boolean;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>(initialAnswers);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onPhotosStep = step >= questions.length;
  const currentQuestion = questions[step];
  const totalSteps = questions.length + 1;

  if (isSubmitted) {
    return (
      <Card className="text-center">
        <p className="text-lg font-medium text-slate-900">Questionnaire submitted</p>
        <p className="mt-2 text-sm text-slate-600">Thank you. MEAVO has received your install checklist.</p>
      </Card>
    );
  }

  if (!questions.length) {
    return (
      <Card>
        <p className="text-sm text-slate-600">No questionnaire has been published yet.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <p className="mb-4 text-center text-sm text-slate-500">
        Step {Math.min(step + 1, totalSteps)} of {totalSteps}
      </p>

      {!onPhotosStep && currentQuestion && (
        <Card>
          <p className="text-lg font-medium text-slate-900">{currentQuestion.text}</p>

          {currentQuestion.type === QuestionType.TEXT ? (
            <textarea
              className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              rows={4}
              placeholder="Type your answer…"
              value={answers[currentQuestion.id]?.text ?? ""}
              onChange={(e) => {
                const text = e.target.value;
                setAnswers((prev) => ({
                  ...prev,
                  [currentQuestion.id]: { checked: false, text },
                }));
              }}
              onBlur={(e) => {
                const text = e.target.value;
                startTransition(async () => {
                  await saveQuestionAnswer(slug, dealId, currentQuestion.id, { textAnswer: text });
                });
              }}
            />
          ) : (
            <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4">
              <input
                type="checkbox"
                className="h-6 w-6 rounded border-slate-300"
                checked={answers[currentQuestion.id]?.checked ?? false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: { checked, text: prev[currentQuestion.id]?.text ?? "" },
                  }));
                  startTransition(async () => {
                    await saveQuestionAnswer(slug, dealId, currentQuestion.id, { checked });
                  });
                }}
              />
              <span className="text-base text-slate-700">Confirmed</span>
            </label>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!isAnswered(currentQuestion, answers) || pending}
              onClick={() => {
                if (currentQuestion.type === QuestionType.TEXT) {
                  const text = answers[currentQuestion.id]?.text ?? "";
                  startTransition(async () => {
                    await saveQuestionAnswer(slug, dealId, currentQuestion.id, { textAnswer: text });
                    setStep((s) => s + 1);
                  });
                } else {
                  setStep((s) => s + 1);
                }
              }}
            >
              Next
            </Button>
          </div>
        </Card>
      )}

      {onPhotosStep && (
        <Card>
          <p className="text-lg font-medium text-slate-900">Installation photos</p>
          <p className="mt-2 text-sm text-slate-600">
            Attach photos of the completed assembly (booth exterior, interior, and any issues).
          </p>

          <form
            className="mt-4 space-y-4"
            action={async (formData) => {
              setError(null);
              startTransition(async () => {
                const upload = await uploadSubmissionPhotos(slug, dealId, formData);
                if (upload.error) {
                  setError(upload.error);
                  return;
                }
                await submitQuestionnaire(slug, dealId);
              });
            }}
          >
            <input
              name="photos"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="block w-full text-sm"
            />
            {hasPhotos && (
              <p className="text-xs text-slate-500">You can add more photos before submitting.</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setStep(questions.length - 1)}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
