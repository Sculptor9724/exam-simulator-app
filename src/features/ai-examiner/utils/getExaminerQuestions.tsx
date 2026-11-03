import { supabase } from "../../../config/supabaseClient";
import { apiUrl } from "../../../config/apiConfig";
import { ExamSimulator } from "../../../shared/contexts/ExamSimulatorContext";

function pickRandomExamples(
  examples: string | null | undefined,
  max = 2,
): string | null | undefined {
  if (!examples) return examples;
  const parts = examples
    .split(/(?=Task example \d+\n)/)
    .filter((p) => p.trim());
  if (parts.length <= max) return examples;
  const shuffled = [...parts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, max).join("\n");
}

export async function getExaminerQuestions(examSimulator: any): Promise<any> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await fetch(`${apiUrl}/get-examiner-questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        learning_goals: examSimulator.learning_goals,
        description: examSimulator.description,
        title: examSimulator.title,
        duration: examSimulator.duration,
        typical_questions: examSimulator.typical_questions,
        examples: pickRandomExamples(examSimulator.examples),
        task_generation_instructions:
          examSimulator.task_generation_instructions,
      }),
    });

    if (!response.ok) {
      console.error("Error fetching exam content:", response.statusText);
      return {
        "task-student": "Error: Failed to connect to the examiner service.",
      };
    }

    const result = await response.json();

    return result;
  } catch (error) {
    console.error("Error fetching exam content:", error);
    return {
      "task-student": "Error: Failed to connect to the examiner service.",
    };
  }
}

export default getExaminerQuestions;
