import { supabase } from "../../../config/supabaseClient";

export interface ClassExamDetails {
  id: number;
  title: string | null;
  description: string | null;
  created_at: string;
  duration: number | null;
  is_public: boolean | null;
}

/**
 * Repository for managing ClassExam junction table
 * Handles the many-to-many relationship between classes and exams
 */
export class ClassExamRepository {
  /**
   * Fetches all exams for a specific class with full exam details
   */
  async fetchByClassId(classId: string): Promise<ClassExamDetails[]> {
    const { data, error } = await supabase
      .from("class_exams")
      .select(
        "exam_id, created_at, exams(id, title, description, created_at, duration, is_public)"
      )
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching class exams:", error);
      throw error;
    }

    const formatted = (data || [])
      .map((entry: any) => entry.exams)
      .filter((exam: any): exam is ClassExamDetails => Boolean(exam))
      .map((exam: any) => ({
        id: Number(exam.id),
        title: exam.title,
        description: exam.description,
        created_at: exam.created_at,
        duration: exam.duration,
        is_public: exam.is_public,
      }));

    return formatted;
  }

  /**
   * Fetches class exams for multiple classes (used in Dashboard)
   */
  async fetchByClassIds(
    classIds: string[],
    excludeExamIds: number[] = []
  ): Promise<any[]> {
    if (classIds.length === 0) {
      return [];
    }

    let query = supabase
      .from("class_exams")
      .select("exam_id, class_id, classes(id, title), exams(*)")
      .in("class_id", classIds);

    if (excludeExamIds.length > 0) {
      query = query.not("exam_id", "in", `(${excludeExamIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching class exams for multiple classes:", error);
      throw error;
    }

    // Transform data to include class information and sort by created_at
    return (data || [])
      .filter((entry: any) => entry.exams)
      .map((entry: any) => ({
        exam: entry.exams,
        classId: entry.class_id,
        classTitle: entry.classes?.title || "Ukendt klasse",
      }))
      .sort((a: any, b: any) => {
        const dateA = new Date(a.exam.created_at).getTime();
        const dateB = new Date(b.exam.created_at).getTime();
        return dateB - dateA; // Most recent first
      });
  }

  /**
   * Adds an exam to a class
   */
  async addExamToClass(classId: string, examId: number): Promise<void> {
    const { error } = await supabase.from("class_exams").insert([
      {
        class_id: classId,
        exam_id: examId,
      },
    ]);

    if (error) {
      console.error("Error adding exam to class:", error);
      throw error;
    }
  }

  /**
   * Removes an exam from a class
   */
  async removeExamFromClass(classId: string, examId: number): Promise<void> {
    const { error } = await supabase
      .from("class_exams")
      .delete()
      .eq("class_id", classId)
      .eq("exam_id", examId);

    if (error) {
      console.error("Error removing exam from class:", error);
      throw error;
    }
  }

  /**
   * Deletes all class associations for a given exam
   */
  async deleteByExamId(examId: number): Promise<void> {
    const { error } = await supabase
      .from("class_exams")
      .delete()
      .eq("exam_id", examId);

    if (error) {
      console.error("Error deleting class associations for exam:", error);
      throw error;
    }
  }

  /**
   * Fetches the class ID associated with an exam
   */
  async fetchClassIdByExamId(examId: number): Promise<string | null> {
    const { data, error } = await supabase
      .from("class_exams")
      .select("class_id")
      .eq("exam_id", examId);

    if (error) {
      console.error("Error fetching class ID by exam ID:", error);
      throw error;
    }

    if (data && data.length > 0) {
      return data[0].class_id;
    }

    return null;
  }
}

// Export singleton instance
export const classExamRepository = new ClassExamRepository();
