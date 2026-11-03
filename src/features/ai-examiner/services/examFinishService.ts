import { supabase } from "../../../config/supabaseClient";
import { apiUrl } from "../../../config/apiConfig";
import { examLogRepository } from "../../exams/repositories/ExamLogRepository";
import { type Exam } from "../../exams/repositories/ExamRepository";
import { examLogger } from "../lib/examLogger";

export interface GradeAndFeedback {
  grade: string | null;
  feedback: string | null;
}

export interface FinishExamParams {
  examLogId: number;
  outputMessage: string;
  finishedReason: "redirect" | "time_passed" | "user_finished";
}

export interface FinishExamResult {
  examLogId: number;
  grade: string | null;
  feedback: string | null;
  success: boolean;
}

/**
 * Service for handling exam finish flow
 * Centralizes all logic related to finishing an exam including:
 * - Fetching grade and feedback from AI
 * - Updating exam logs
 * - Managing finish state
 */
class ExamFinishService {
  /**
   * Fetches grade and feedback from the backend AI service
   * Extracts the last N words from the conversation for grading
   */
  async fetchGradeAndFeedback(
    outputMessage: string,
    exam?: Partial<Exam> | null,
    lastNumberOfWords: number = 300
  ): Promise<GradeAndFeedback> {
    examLogger.log("grade_api_call_start", {
      outputLength: outputMessage?.length,
      examTitle: exam?.title,
    });
    try {
      // Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No active session found");
      }

      // Call backend API to get grade and feedback
      const response = await fetch(`${apiUrl}/get-grade-and-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text: outputMessage,
          title: exam?.title ?? null,
          description: exam?.description ?? null,
          learning_goals: (exam as any)?.learning_goals ?? null,
          grade_criteria: (exam as any)?.grade_criteria ?? null,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch grade and feedback: ${response.statusText}`
        );
      }

      const result = await response.json();

      examLogger.log("grade_api_call_done", {
        grade: result.grade,
        feedbackLength: result.feedback?.length,
      });
      return {
        grade: result.grade || null,
        feedback: result.feedback || null,
      };
    } catch (error) {
      examLogger.log("grade_api_call_error", String(error));
      console.error("Error fetching grade and feedback:", error);
      // Return null values on error instead of throwing
      // This allows the exam to finish gracefully even if grading fails
      return {
        grade: null,
        feedback: null,
      };
    }
  }

  /**
   * Completes the exam finish flow:
   * 1. Fetches grade and feedback from AI
   * 2. Updates exam log with results
   * 3. Returns finish result
   */
  async finishExam(params: FinishExamParams): Promise<FinishExamResult> {
    const { examLogId, outputMessage, finishedReason } = params;

    try {
      // Fetch grade and feedback from AI
      const { grade, feedback } =
        await this.fetchGradeAndFeedback(outputMessage);

      // Update exam log with finish information
      await examLogRepository.updateById(examLogId, {
        finished_at: new Date().toISOString(),
        finished_reason: finishedReason,
        grade,
        feedback,
      });

      return {
        examLogId,
        grade,
        feedback,
        success: true,
      };
    } catch (error) {
      console.error("Error finishing exam:", error);

      // Even if grading fails, still mark exam as finished
      try {
        await examLogRepository.updateById(examLogId, {
          finished_at: new Date().toISOString(),
          finished_reason: finishedReason,
          grade: null,
          feedback: null,
        });
      } catch (updateError) {
        console.error("Error updating exam log:", updateError);
      }

      return {
        examLogId,
        grade: null,
        feedback: null,
        success: false,
      };
    }
  }
}

// Export singleton instance
export const examFinishService = new ExamFinishService();
