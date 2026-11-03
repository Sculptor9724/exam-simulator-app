import { supabase } from "../../../config/supabaseClient";

export interface Exam {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  type?: string | null;
  examples?: string | null;
  task_generation_instructions?: string | null;
  examiner_instructions?: string | null;
  grade_criteria?: string | null;
  feedback?: string | null;
  learning_goals?: string | null;
  typical_questions?: string | null;
  created_at: string;
  duration: number | null;
  is_public: boolean | null;
  class_exams?: any[];
}

/**
 * Repository for managing Exam entities
 * Handles all database operations related to exams
 */
export class ExamRepository {
  /**
   * Fetches public exams (those not associated with any class)
   */
  async fetchPublic(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*, class_exams(class_id)")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching public exams:", error);
      throw error;
    }

    // Filter out exams that have class associations
    const sanitized = (data || [])
      .filter((exam: any) => {
        const classRelations = exam.class_exams;
        return !Array.isArray(classRelations) || classRelations.length === 0;
      })
      .map(({ class_exams, ...exam }) => exam);

    return sanitized as Exam[];
  }

  /**
   * Fetches exams by specific IDs (for highlighted exams)
   */
  async fetchByIds(examIds: number[]): Promise<Exam[]> {
    if (examIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("exams")
      .select()
      .in("id", examIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching exams by IDs:", error);
      throw error;
    }

    return data as Exam[];
  }

  /**
   * Fetches all exams for a specific user
   */
  async fetchByUserId(
    userId: string,
    excludeIds: number[] = []
  ): Promise<Exam[]> {
    let query = supabase
      .from("exams")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching user exams:", error);
      throw error;
    }

    return data as Exam[];
  }

  /**
   * Fetches a single exam by ID
   */
  async fetchById(id: number): Promise<Exam | null> {
    const { data, error } = await supabase
      .from("exams")
      .select()
      .eq("id", id)
      .single();

    if (error && error.code === "PGRST116") {
      // No exam found
      return null;
    }

    if (error) {
      console.error("Error fetching exam by ID:", error);
      throw error;
    }

    return data as Exam;
  }

  /**
   * Fetches public exams excluding specific user and IDs
   */
  async fetchPublicExcludingUser(
    userId: string,
    excludeIds: number[] = []
  ): Promise<Exam[]> {
    let query = supabase
      .from("exams")
      .select("*, class_exams(class_id)")
      .not("user_id", "eq", userId)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching public exams:", error);
      throw error;
    }

    // Filter out exams that have class associations
    const sanitized = (data || [])
      .filter((exam: any) => {
        const classRelations = exam.class_exams;
        return !Array.isArray(classRelations) || classRelations.length === 0;
      })
      .map(({ class_exams, ...exam }) => exam);

    return sanitized as Exam[];
  }

  /**
   * Creates a new exam
   */
  async create(examData: Omit<Exam, "id" | "created_at">): Promise<Exam> {
    const { data, error } = await supabase
      .from("exams")
      .insert([examData])
      .select()
      .single();

    if (error) {
      console.error("Error creating exam:", error);
      throw error;
    }

    return data as Exam;
  }

  /**
   * Updates an existing exam
   */
  async update(id: number, examData: Partial<Exam>): Promise<void> {
    const { error } = await supabase
      .from("exams")
      .update(examData)
      .eq("id", id);

    if (error) {
      console.error("Error updating exam:", error);
      throw error;
    }
  }

  /**
   * Deletes an exam
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase.from("exams").delete().eq("id", id);

    if (error) {
      console.error("Error deleting exam:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const examRepository = new ExamRepository();
