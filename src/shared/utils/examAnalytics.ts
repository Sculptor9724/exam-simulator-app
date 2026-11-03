import { supabase } from "../../config/supabaseClient";
import { calculateDurationMinutes } from "./dateUtils";

export interface ExamAnalytics {
  totalExams: number;
  completedExams: number;
  completionRate: number;
  avgDurationMinutes: number;
  abandonedExams: number;
}

export interface ExamSession {
  id: number;
  user_id: string;
  exam_id: number;
  started_at: Date;
  finished_at: Date | null;
  duration_minutes: number | null;
  completed: boolean;
}

/**
 * Get overall exam analytics
 */
export async function getExamAnalytics(): Promise<ExamAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from("exam_logs")
      .select("id, created_at, finished_at");

    if (error) throw error;

    const totalExams = data.length;
    const completedExams = data.filter((exam) => exam.finished_at).length;
    const abandonedExams = totalExams - completedExams;
    const completionRate =
      totalExams > 0 ? (completedExams / totalExams) * 100 : 0;

    // Calculate average duration for completed exams
    const completedExamsWithDuration = data
      .filter((exam) => exam.finished_at)
      .map((exam) =>
        calculateDurationMinutes(exam.created_at, exam.finished_at)
      )
      .filter((duration): duration is number => duration !== null);

    const avgDurationMinutes =
      completedExamsWithDuration.length > 0
        ? completedExamsWithDuration.reduce(
            (sum, duration) => sum + duration,
            0
          ) / completedExamsWithDuration.length
        : 0;

    return {
      totalExams,
      completedExams,
      completionRate: Math.round(completionRate * 100) / 100,
      avgDurationMinutes: Math.round(avgDurationMinutes * 100) / 100,
      abandonedExams,
    };
  } catch (error) {
    console.error("Error fetching exam analytics:", error);
    return null;
  }
}

/**
 * Get exam sessions for a specific user
 */
export async function getUserExamSessions(
  userId: string
): Promise<ExamSession[]> {
  try {
    const { data, error } = await supabase
      .from("exam_logs")
      .select(
        `
        id,
        user_id,
        exam_id,
        created_at,
        finished_at,
        exams (title)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((session) => ({
      id: session.id,
      user_id: session.user_id,
      exam_id: session.exam_id,
      started_at: new Date(session.created_at),
      finished_at: session.finished_at ? new Date(session.finished_at) : null,
      duration_minutes: calculateDurationMinutes(
        session.created_at,
        session.finished_at
      ),
      completed: !!session.finished_at,
    }));
  } catch (error) {
    console.error("Error fetching user exam sessions:", error);
    return [];
  }
}

/**
 * Get exam sessions for a specific exam
 */
export async function getExamSessions(examId: number): Promise<ExamSession[]> {
  try {
    const { data, error } = await supabase
      .from("exam_logs")
      .select("*")
      .eq("exam_id", examId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((session) => ({
      id: session.id,
      user_id: session.user_id,
      exam_id: session.exam_id,
      started_at: new Date(session.created_at),
      finished_at: session.finished_at ? new Date(session.finished_at) : null,
      duration_minutes: calculateDurationMinutes(
        session.created_at,
        session.finished_at
      ),
      completed: !!session.finished_at,
    }));
  } catch (error) {
    console.error("Error fetching exam sessions:", error);
    return [];
  }
}

/**
 * Force finish an abandoned exam session (admin function)
 */
export async function forceFinishExam(examLogId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("exam_logs")
      .update({ finished_at: new Date() })
      .eq("id", examLogId)
      .is("finished_at", null);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error force finishing exam:", error);
    return false;
  }
}
