"use client";

import { useState, useTransition } from "react";
import { saveQuestionAnswer, submitQuestionnaire, uploadSubmissionPhotos } from "@/app/actions/partner";
import { Button, Card } from "@/components/ui";

type Question = {
  id: string;
  text: string;
  sortOrder: number;
};

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
  initialAnswers: Record<string, boolean>;
  hasPhotos: boolean;
  isSubmitted: boolean;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
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
          <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4">
            <input
              type="checkbox"
              className="h-6 w-6 rounded border-slate-300"
              checked={answers[currentQuestion.id] ?? false}
              onChange={(e) => {
                const checked = e.target.checked;
                setAnswers((prev) => ({ ...prev, [currentQuestion.id]: checked }));
                startTransition(async () => {
                  await saveQuestionAnswer(slug, dealId, currentQuestion.id, checked);
                });
              }}
            />
            <span className="text-base text-slate-700">Confirmed</span>
          </label>

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
              disabled={!answers[currentQuestion.id] || pending}
              onClick={() => setStep((s) => s + 1)}
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
                try {
                  await uploadSubmissionPhotos(slug, dealId, formData);
                  await submitQuestionnaire(slug, dealId);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Upload failed");
                }
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
