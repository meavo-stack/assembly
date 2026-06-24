import { revalidatePath } from "next/cache";

const QUESTIONNAIRE_ADMIN_PATHS = [
  "/questionnaire",
  "/questionnaire/translations",
  "/questionnaire/preview",
] as const;

export function revalidateQuestionnaireAdmin() {
  for (const path of QUESTIONNAIRE_ADMIN_PATHS) {
    revalidatePath(path);
  }
}
