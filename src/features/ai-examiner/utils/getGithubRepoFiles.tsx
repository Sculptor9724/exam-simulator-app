import { ExamSimulator } from "../../../shared/contexts/ExamSimulatorContext";
import { supabase } from "../../../config/supabaseClient";
import { apiUrl } from "../../../config/apiConfig";

// New function to get exam questions based on repoContents and learningGoals
export async function getRepoQuestions(
  repoUrl: string,
  examSimulator: ExamSimulator
): Promise<string> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await fetch(`${apiUrl}/github-repo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        repoUrl,
        learning_goals: examSimulator.learning_goals,
        typical_questions: examSimulator.typical_questions,
        duration: examSimulator.duration,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch exam questions: ${response.statusText}`);
    }

    const data = await response.text();
    //console.log(data);

    return data;
  } catch (error) {
    console.error("Error fetching exam questions:", error);
    throw error;
  }
}

export default getRepoQuestions;
