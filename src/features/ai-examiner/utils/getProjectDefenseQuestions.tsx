import { ExamSimulator } from "../../../shared/contexts/ExamSimulatorContext";
import { supabase } from "../../../config/supabaseClient";
import { apiUrl } from "../../../config/apiConfig";

export async function getProjectDefenseQuestions(
  files: File[],
  repoUrl: string | null,
  examSimulator: ExamSimulator,
): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  if (repoUrl) {
    formData.append("repoUrl", repoUrl);
  }

  

  formData.append("learning_goals", examSimulator.learning_goals ?? "");
  formData.append("typical_questions", examSimulator.typical_questions ?? "");
  formData.append("description", examSimulator.description ?? "");
  formData.append("grade_criteria", examSimulator.grade_criteria ?? "");
  formData.append("feedback", examSimulator.feedback ?? "");
  formData.append("duration", String(examSimulator.duration ?? 20));

  const response = await fetch(`${apiUrl}/project-defense`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to process documents: ${response.status} ${response.statusText}. ${errorText}`,
    );
  }

  return response.text();
}
