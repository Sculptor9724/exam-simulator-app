import { supabase } from "../../../config/supabaseClient";

/**
 * Repository for managing Waitlist entities
 * Handles all database operations related to waitlist signups
 */
export class WaitlistRepository {
  /**
   * Adds an email to the waitlist
   */
  async addToWaitlist(email: string): Promise<void> {
    const { error } = await supabase.from("waitlist").insert([{ email }]);

    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
      throw error;
    }
  }
}

// Export singleton instance
export const waitlistRepository = new WaitlistRepository();
