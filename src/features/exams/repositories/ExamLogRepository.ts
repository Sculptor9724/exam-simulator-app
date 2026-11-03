import { supabase } from "../../../config/supabaseClient";
import { calculateDurationMinutes } from "../../../shared/utils/dateUtils";

export interface ExamLog {
  user_id: string;
  exam_id: number;
  grade: number | null | string;
  feedback: string | null;
  created_at: string;
  finished_at: string | null;
  finished_reason?: "redirect" | "time_passed" | "user_finished" | null;
}

export interface ExamLogWithDetails extends ExamLog {
  id: number;
  exam_title: string;
  exam_type?: string | null;
  grade_criteria?: string | null;
  class_title?: string;
}

export interface UserExamStats {
  totalExams: number;
  averageGrade: number | null;
  totalMinutes: number;
}

export interface RecentExam {
  id: number;
  exam_id: number;
  exam_title: string;
  grade: string | null;
  feedback: string | null;
  created_at: string;
  finished_at: string | null;
  duration_minutes: number | null;
  class_title?: string;
}

export interface ExamStatisticsLog {
  id: number;
  grade: string | null;
  feedback: string | null;
  created_at: string;
  finished_at: string | null;
  duration_minutes: number | null;
}

export interface ExamStatistics {
  exam_id: number;
  exam_title: string;
  total_attempts: number;
  average_grade: number | null;
  total_time_minutes: number;
  attempts: ExamStatisticsLog[];
}

/**
 * Repository for managing ExamLog entities
 * Handles all database operations related to exam logs (student results)
 */
export class ExamLogRepository {
  /**
   * Helper: Parse grade string to number
   */
  private parseGrade(grade: string | null | number): number | null {
    if (grade === null) return null;

    const numericGrade = typeof grade === "number" ? grade : parseFloat(grade);
    return !isNaN(numericGrade) ? numericGrade : null;
  }

  /**
   * Helper: Calculate average grade from a list of grades
   */
  private calculateAverageGrade(
    grades: (string | null | number)[]
  ): number | null {
    let totalGrade = 0;
    let validGrades = 0;

    grades.forEach((grade) => {
      const numericGrade = this.parseGrade(grade);
      if (numericGrade !== null) {
        totalGrade += numericGrade;
        validGrades++;
      }
    });

    if (validGrades === 0) return null;

    const average = totalGrade / validGrades;
    return Math.round(average * 10) / 10;
  }

  /**
   * Fetches exam logs for specific students and a specific exam
   */
  async fetchByExamAndUsers(
    examId: number,
    userIds: string[]
  ): Promise<Omit<ExamLog, "exam_id">[]> {
    if (userIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("exam_logs")
      .select("user_id, grade, feedback, created_at, finished_at")
      .eq("exam_id", examId)
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching exam logs:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Fetches the most recent exam log for a user and exam
   */
  async fetchLatestByUserAndExam(
    userId: string,
    examId: number
  ): Promise<ExamLog | null> {
    const { data, error } = await supabase
      .from("exam_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("exam_id", examId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === "PGRST116") {
      // No log found
      return null;
    }

    if (error) {
      console.error("Error fetching latest exam log:", error);
      throw error;
    }

    return data;
  }

  /**
   * Creates a new exam log entry
   */
  async create(
    logData: Omit<ExamLog, "created_at" | "finished_at"> & {
      created_at?: string;
      finished_at?: string;
    }
  ): Promise<number> {
    const { data, error } = await supabase
      .from("exam_logs")
      .insert([logData])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating exam log:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Updates an existing exam log by ID
   */
  async updateById(
    examLogId: number,
    updates: Partial<Omit<ExamLog, "user_id" | "exam_id" | "created_at">>
  ): Promise<void> {
    const { error } = await supabase
      .from("exam_logs")
      .update(updates)
      .eq("id", examLogId);

    if (error) {
      console.error("Error updating exam log:", error);
      throw error;
    }
  }

  /**
   * Fetches a specific exam log by ID with related exam and class information
   */
  async fetchByIdWithDetails(
    examLogId: string,
    userId: string
  ): Promise<ExamLogWithDetails | null> {
    const { data: examLog, error } = await supabase
      .from("exam_logs")
      .select(
        `
        id,
        exam_id,
        user_id,
        created_at,
        finished_at,
        grade,
        feedback,
        exams!inner(
          title,
          type,
          grade_criteria,
          class_exams(
            classes(
              title
            )
          )
        )
      `
      )
      .eq("id", examLogId)
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // No log found
      return null;
    }

    if (error) {
      console.error("Error fetching exam log with details:", error);
      throw error;
    }

    // Extract exam and class information from the joined data
    const exam = examLog.exams as any;
    const examTitle = exam?.title || "Unknown Exam";
    const classTitle = exam?.class_exams?.[0]?.classes?.title;

    return {
      id: examLog.id,
      user_id: examLog.user_id,
      exam_id: examLog.exam_id,
      grade: examLog.grade,
      feedback: examLog.feedback,
      created_at: examLog.created_at,
      finished_at: examLog.finished_at,
      exam_title: examTitle,
      exam_type: exam?.type ?? null,
      grade_criteria: exam?.grade_criteria ?? null,
      class_title: classTitle,
    };
  }

  /**
   * Fetches user's exam statistics
   */
  async fetchUserStats(userId: string): Promise<UserExamStats> {
    const { data, error } = await supabase
      .from("exam_logs")
      .select("id, grade, created_at, finished_at")
      .eq("user_id", userId)
      .not("finished_at", "is", null); // Only count completed exams

    if (error) {
      console.error("Error fetching user exam stats:", error);
      return {
        totalExams: 0,
        averageGrade: null,
        totalMinutes: 0,
      };
    }

    const totalExams = data.length;

    // Calculate average grade using helper
    const grades = data.map((exam) => exam.grade);
    const averageGrade = this.calculateAverageGrade(grades);

    // Calculate total minutes spent using helper
    let totalMinutes = 0;
    data.forEach((exam) => {
      const duration = calculateDurationMinutes(
        exam.created_at,
        exam.finished_at
      );
      if (duration) {
        totalMinutes += duration;
      }
    });

    return {
      totalExams,
      averageGrade,
      totalMinutes: Math.round(totalMinutes),
    };
  }

  /**
   * Fetches user's recent exam attempts
   */
  async fetchRecentExams(
    userId: string,
    limit: number = 5
  ): Promise<RecentExam[]> {
    const { data, error } = await supabase
      .from("exam_logs")
      .select(
        `
        id,
        exam_id,
        grade,
        feedback,
        created_at,
        finished_at,
        exams!inner(
          title,
          class_exams(
            classes(
              title
            )
          )
        )
      `
      )
      .eq("user_id", userId)
      .not("finished_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent exams:", error);
      return [];
    }

    return data.map((log: any) => {
      const durationMinutes = calculateDurationMinutes(
        log.created_at,
        log.finished_at
      );

      return {
        id: log.id,
        exam_id: log.exam_id,
        exam_title: log.exams?.title || "Ukendt eksamen",
        grade: log.grade,
        feedback: log.feedback,
        created_at: log.created_at,
        finished_at: log.finished_at,
        duration_minutes: durationMinutes,
        class_title: log.exams?.class_exams?.[0]?.classes?.title,
      };
    });
  }

  /**
   * Fetches exam statistics for a specific user and exam
   */
  async fetchExamStatistics(
    userId: string,
    examId: number
  ): Promise<ExamStatistics | null> {
    // Fetch exam logs with exam info in a single query
    const { data, error } = await supabase
      .from("exam_logs")
      .select(
        `
        id,
        grade,
        feedback,
        created_at,
        finished_at,
        exams!inner(
          id,
          title
        )
      `
      )
      .eq("user_id", userId)
      .eq("exam_id", examId)
      .not("finished_at", "is", null) // Only completed exams
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching exam statistics:", error);
      throw error;
    }

    // If no logs found, fetch just the exam info to return proper structure
    if (!data || data.length === 0) {
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("id, title")
        .eq("id", examId)
        .single();

      if (examError) {
        console.error("Error fetching exam:", examError);
        throw examError;
      }

      return {
        exam_id: examId,
        exam_title: examData?.title || "Unknown Exam",
        total_attempts: 0,
        average_grade: null,
        total_time_minutes: 0,
        attempts: [],
      };
    }

    // Extract exam title from the first log's joined exam data
    const examTitle = (data[0].exams as any)?.title || "Unknown Exam";

    // Calculate average grade using helper
    const grades = data.map((log) => log.grade);
    const averageGrade = this.calculateAverageGrade(grades);

    // Map attempts and calculate total time using helper
    let totalMinutes = 0;
    const attempts: ExamStatisticsLog[] = data.map((log) => {
      const durationMinutes = calculateDurationMinutes(
        log.created_at,
        log.finished_at
      );

      if (durationMinutes) {
        totalMinutes += durationMinutes;
      }

      return {
        id: log.id,
        grade: log.grade,
        feedback: log.feedback,
        created_at: log.created_at,
        finished_at: log.finished_at,
        duration_minutes: durationMinutes,
      };
    });

    return {
      exam_id: examId,
      exam_title: examTitle,
      total_attempts: data.length,
      average_grade: averageGrade,
      total_time_minutes: Math.round(totalMinutes),
      attempts,
    };
  }
}

// Export singleton instance
export const examLogRepository = new ExamLogRepository();

/**
 * Fetches distinct exam IDs that a user has completed
 */
export async function fetchCompletedExamIds(
  userId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("exam_logs")
    .select("exam_id")
    .eq("user_id", userId)
    .not("finished_at", "is", null);

  if (error) {
    console.error("Error fetching completed exam IDs:", error);
    return new Set();
  }

  // Convert to Set of strings for consistent comparison
  const examIds = new Set<string>();
  data?.forEach((log) => {
    examIds.add(String(log.exam_id));
  });

  return examIds;
}
