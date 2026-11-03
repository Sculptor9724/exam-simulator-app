import { supabase } from "../../../config/supabaseClient";

export interface ExamRating {
  id?: number;
  exam_id: number;
  user_id: string;
  rating: number;
  good_feedback: string;
  improve_feedback: string;
  created_at?: string;
}

/**
 * Repository for managing ExamRating entities
 * Handles all database operations related to exam ratings/feedback
 */
export class ExamRatingRepository {
  /**
   * Creates a new exam rating
   */
  async create(
    ratingData: Omit<ExamRating, "id" | "created_at">
  ): Promise<void> {
    const { error } = await supabase.from("exam_ratings").insert([ratingData]);

    if (error) {
      console.error("Error creating exam rating:", error);
      throw error;
    }
  }

  /**
   * Fetches ratings for a specific exam
   */
  async fetchByExamId(examId: number): Promise<ExamRating[]> {
    const { data, error } = await supabase
      .from("exam_ratings")
      .select("*")
      .eq("exam_id", examId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching exam ratings:", error);
      throw error;
    }

    return data as ExamRating[];
  }

  /**
   * Fetches a user's rating for a specific exam
   */
  async fetchByExamAndUser(
    examId: number,
    userId: string
  ): Promise<ExamRating | null> {
    const { data, error } = await supabase
      .from("exam_ratings")
      .select("*")
      .eq("exam_id", examId)
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // No rating found
      return null;
    }

    if (error) {
      console.error("Error fetching exam rating:", error);
      throw error;
    }

    return data as ExamRating;
  }
}

// Export singleton instance
export const examRatingRepository = new ExamRatingRepository();
