import { supabase } from "../../../config/supabaseClient";
import { Class } from "../../../types";

export interface ClassWithExams {
  id: string;
  title: string;
  description: string | null;
  exams: Array<{
    id: number;
    title: string;
    description: string | null;
    duration: number | null;
    created_at: string;
  }>;
}

/**
 * Repository for managing Class entities
 * Handles all database operations related to classes
 */
export class ClassRepository {
  /**
   * Fetches all classes for a specific user
   */
  async fetchAll(userId: string): Promise<Class[]> {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching classes:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Fetches a single class by ID for a specific user
   */
  async fetchById(id: string, userId: string): Promise<Class> {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching class:", error);
      throw error;
    }

    return data;
  }

  /**
   * Fetches a class by its join code
   */
  async fetchByJoinCode(joinCode: string): Promise<Partial<Class>> {
    const { data, error } = await supabase
      .from("classes")
      .select("id, title, description, schoolname")
      .eq("join_code", joinCode)
      .single();

    if (error) {
      console.error("Error fetching class by join code:", error);
      throw error;
    }

    return data;
  }

  /**
   * Creates a new class
   */
  async create(classData: Partial<Class>): Promise<void> {
    const { error } = await supabase.from("classes").insert([classData]);

    if (error) {
      console.error("Error creating class:", error);
      throw error;
    }
  }

  /**
   * Updates an existing class
   */
  async update(id: string, classData: Partial<Class>): Promise<void> {
    const { error } = await supabase
      .from("classes")
      .update(classData)
      .eq("id", id);

    if (error) {
      console.error("Error updating class:", error);
      throw error;
    }
  }

  /**
   * Deletes a class
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("classes").delete().eq("id", id);

    if (error) {
      console.error("Error deleting class:", error);
      throw error;
    }
  }

  /**
   * Fetches user's classes with their associated exams
   */
  async fetchClassesWithExams(profileId: string): Promise<ClassWithExams[]> {
    const { data: classes, error } = await supabase
      .from("class_memberships")
      .select(
        `
        classes!inner(
          id,
          title,
          description,
          class_exams(
            exams(
              id,
              title,
              description,
              duration,
              created_at
            )
          )
        )
      `
      )
      .eq("profile_id", profileId)
      .order("classes(title)", { ascending: true });

    if (error) {
      console.error("Error fetching classes with exams:", error);
      throw error;
    }

    if (!classes || classes.length === 0) {
      return [];
    }

    return classes.map((membership: any) => {
      const cls = membership.classes;
      const exams = (cls.class_exams || [])
        .map((ce: any) => ce.exams)
        .filter((exam: any) => exam !== null)
        .map((exam: any) => ({
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          created_at: exam.created_at,
        }))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return {
        id: cls.id,
        title: cls.title,
        description: cls.description,
        exams,
      };
    });
  }

  /**
   * Fetches teacher's classes with their associated exams
   */
  async fetchTeacherClassesWithExams(
    userId: string
  ): Promise<ClassWithExams[]> {
    const { data: classes, error } = await supabase
      .from("classes")
      .select(
        `
        id,
        title,
        description,
        class_exams(
          exams(
            id,
            title,
            description,
            duration,
            created_at
          )
        )
      `
      )
      .eq("user_id", userId)
      .order("title", { ascending: true });

    if (error) {
      console.error("Error fetching teacher classes with exams:", error);
      throw error;
    }

    if (!classes || classes.length === 0) {
      return [];
    }

    return classes.map((cls: any) => {
      const exams = (cls.class_exams || [])
        .map((ce: any) => ce.exams)
        .filter((exam: any) => exam !== null)
        .map((exam: any) => ({
          id: exam.id,
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          created_at: exam.created_at,
        }))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return {
        id: cls.id,
        title: cls.title,
        description: cls.description,
        exams,
      };
    });
  }
}

// Export singleton instance
export const classRepository = new ClassRepository();
