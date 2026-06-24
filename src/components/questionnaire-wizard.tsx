"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  type AnswerRecord,
  type SectionRecord,
  buildWizardSteps,
  isStepComplete,
} from "@/lib/questionnaire";
import { saveQuestionAnswer, submitQuestionnaire, uploadSubmissionPhotos } from "@/app/actions/partner";
import { Button, Card } from "@/components/ui";

export function QuestionnaireWizard({
  slug,
  dealId,
  sections,
  initialAnswers = {},
  hasPhotos = false,
  isSubmitted = false,
  preview = false,
}: {
  slug?: string;
  dealId?: string;
  sections: SectionRecord[];
  initialAnswers?: Record<string, AnswerRecord>;
  hasPhotos?: boolean;
  isSubmitted?: boolean;
  preview?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewComplete, setPreviewComplete] = useState(false);

  const steps = useMemo(() => buildWizardSteps(sections, answers), [sections, answers]);
  const currentStep = steps[step];
  const totalSteps = steps.length;

  useEffect(() => {
    setStep((s) => Math.min(s, Math.max(steps.length - 1, 0)));
  }, [steps.length]);

  function completePreview() {
    setPreviewComplete(true);
  }

  function restartPreview() {
    setAnswers({});
    setStep(0);
    setPreviewComplete(false);
    setError(null);
  }

  function persistAnswer(questionId: string, answer: Parameters<typeof saveQuestionAnswer>[3]) {
    if (preview || !slug || !dealId) return;
    startTransition(async () => {
      await saveQuestionAnswer(slug, dealId, questionId, answer);
    });
  }

  if (previewComplete) {
    return (
      <Card className="text-center">
        <p className="text-lg font-medium text-slate-900">Preview complete</p>
        <p className="mt-2 text-sm text-slate-600">
          You reached the end of the questionnaire. Nothing was saved — this is a test run only.
        </p>
        <Button type="button" className="mt-4" onClick={restartPreview}>
          Start over
        </Button>
      </Card>
    );
  }

  if (isSubmitted && !preview) {
    return (
      <Card className="text-center">
        <p className="text-lg font-medium text-slate-900">Questionnaire submitted</p>
        <p className="mt-2 text-sm text-slate-600">Thank you. MEAVO has received your install checklist.</p>
      </Card>
    );
  }

  if (!sections.length) {
    return (
      <Card>
        <p className="text-sm text-slate-600">
          {preview
            ? "No sections in the questionnaire yet. Add sections on the builder page, then preview again."
            : "No questionnaire has been published yet."}
        </p>
      </Card>
    );
  }

  if (!currentStep) {
    return (
      <Card>
        <p className="text-sm text-slate-600">No steps available for this questionnaire.</p>
      </Card>
    );
  }

  function goNext() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {preview && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-medium">Preview mode</span> — answers and photos are not saved.
        </div>
      )}

      <p className="mb-4 text-center text-sm text-slate-500">
        Step {step + 1} of {totalSteps}
      </p>

      {currentStep.kind === "section" && (
        <Card>
          <p className="text-lg font-medium text-slate-900">{currentStep.title}</p>
          <div className="mt-4 space-y-3">
            {currentStep.questions.map((question) => (
              <label
                key={question.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-6 w-6 shrink-0 rounded border-slate-300"
                  checked={answers[question.id]?.checked ?? false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: {
                        checked,
                        text: prev[question.id]?.text ?? "",
                        yesNo: prev[question.id]?.yesNo ?? null,
                      },
                    }));
                    persistAnswer(question.id, { checked });
                  }}
                />
                <span className="text-base text-slate-700">{question.text}</span>
              </label>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" disabled={step === 0} onClick={goBack}>
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!isStepComplete(currentStep, answers) || pending}
              onClick={goNext}
            >
              Next
            </Button>
          </div>
        </Card>
      )}

      {currentStep.kind === "yes_no" && (
        <Card>
          <p className="text-lg font-medium text-slate-900">{currentStep.question.text}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: "Yes", value: true },
              { label: "No", value: false },
            ].map((option) => {
              const selected = answers[currentStep.question.id]?.yesNo === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  className={`rounded-lg border px-4 py-3 text-base font-medium transition ${
                    selected
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setAnswers((prev) => ({
                      ...prev,
                      [currentStep.question.id]: {
                        checked: false,
                        text: "",
                        yesNo: option.value,
                      },
                    }));
                    persistAnswer(currentStep.question.id, { yesNoAnswer: option.value });
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" disabled={step === 0} onClick={goBack}>
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!isStepComplete(currentStep, answers) || pending}
              onClick={() => {
                const answer = answers[currentStep.question.id];
                if (answer?.yesNo === false && currentStep.question.endsQuestionnaireOnNo) {
                  if (preview) {
                    completePreview();
                    return;
                  }
                  startTransition(async () => {
                    if (slug && dealId) await submitQuestionnaire(slug, dealId);
                  });
                  return;
                }
                goNext();
              }}
            >
              {answers[currentStep.question.id]?.yesNo === false &&
              currentStep.question.endsQuestionnaireOnNo
                ? preview
                  ? "Finish preview"
                  : "Finish"
                : "Next"}
            </Button>
          </div>
        </Card>
      )}

      {currentStep.kind === "follow_up" && (
        <Card>
          <p className="text-lg font-medium text-slate-900">{currentStep.question.text}</p>
          <textarea
            className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            rows={4}
            placeholder="Describe the issues…"
            value={answers[currentStep.question.id]?.text ?? ""}
            onChange={(e) => {
              const text = e.target.value;
              setAnswers((prev) => ({
                ...prev,
                [currentStep.question.id]: {
                  checked: false,
                  text,
                  yesNo: null,
                },
              }));
            }}
            onBlur={(e) => {
              persistAnswer(currentStep.question.id, { textAnswer: e.target.value });
            }}
          />
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!isStepComplete(currentStep, answers) || pending}
              onClick={() => {
                const text = answers[currentStep.question.id]?.text ?? "";
                if (preview) {
                  setAnswers((prev) => ({
                    ...prev,
                    [currentStep.question.id]: {
                      checked: false,
                      text,
                      yesNo: null,
                    },
                  }));
                  goNext();
                  return;
                }
                startTransition(async () => {
                  if (slug && dealId) {
                    await saveQuestionAnswer(slug, dealId, currentStep.question.id, { textAnswer: text });
                  }
                  goNext();
                });
              }}
            >
              Next
            </Button>
          </div>
        </Card>
      )}

      {currentStep.kind === "photos" && (
        <Card>
          <p className="text-lg font-medium text-slate-900">Installation photos</p>
          <p className="mt-2 text-sm text-slate-600">
            Attach photos of the completed assembly (booth exterior, interior, and any issues).
          </p>

          {preview ? (
            <div className="mt-4 space-y-4">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="block w-full text-sm"
                disabled
              />
              <p className="text-xs text-slate-500">Photo upload is disabled in preview mode.</p>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>
                  Back
                </Button>
                <Button type="button" className="flex-1" onClick={completePreview}>
                  Complete preview
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="mt-4 space-y-4"
              action={async (formData) => {
                setError(null);
                startTransition(async () => {
                  if (!slug || !dealId) return;
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
                <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
