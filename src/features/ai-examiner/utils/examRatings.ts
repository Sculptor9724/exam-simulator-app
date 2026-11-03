import { supabase } from "../../../config/supabaseClient";

interface ExamRating {
  exam_id: string; // Changed from number to string to match examId prop type
  user_id: string; // Added user_id
  rating: number;
  good_feedback?: string;
  improve_feedback?: string;
}

export const saveExamRating = async (ratingData: ExamRating) => {
  const { data, error } = await supabase
    .from("exam_ratings")
    .insert([ratingData]);

  if (error) {
    console.error("Error saving exam rating:", error);
    throw error;
  }

  return data;
};
