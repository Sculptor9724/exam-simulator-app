import { supabase } from "../../../config/supabaseClient";
import { apiUrl } from "../../../config/apiConfig";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  school: string | null;
  is_student?: boolean;
}

export interface ProfileDetails {
  id: string;
  user_id: string;
  full_name: string | null;
  school: string | null;
  education_name: string | null;
  semester: number | null;
  is_student: boolean;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  full_name?: string | null;
  school?: string | null;
  education_name?: string | null;
  semester?: number | null;
}

/**
 * Repository for managing Profile entities
 * Handles all database operations related to user profiles
 */
export class ProfileRepository {
  /**
   * Fetches a profile by user_id (returns only id)
   */
  async fetchByUserId(userId: string): Promise<{ id: string } | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    // PGRST116 is the error code for More than 1 or no items where returned when requesting a singular response. See Singular or Plural.
    if (error && error.code === "PGRST116") {
      // No profile found
      return null;
    }

    if (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }

    return data;
  }

  /**
   * Fetches multiple profiles by their IDs
   */
  async fetchByIds(profileIds: string[]): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, school")
      .in("id", profileIds);

    if (error) {
      console.error("Error fetching profiles:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Creates a new profile
   */
  async create(profileData: {
    user_id: string;
    full_name?: string | null;
    is_student?: boolean;
  }): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from("profiles")
      .insert([profileData])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      throw error;
    }

    return data;
  }

  /**
   * Gets or creates a profile for a user
   * Useful for the join class flow
   */
  async getOrCreate(
    userId: string,
    fullName?: string | null,
    isStudent: boolean = true
  ): Promise<{ id: string }> {
    // Try to fetch existing profile
    const existing = await this.fetchByUserId(userId);

    if (existing) {
      return existing;
    }

    // Create new profile if it doesn't exist
    return this.create({
      user_id: userId,
      full_name: fullName,
      is_student: isStudent,
    });
  }

  /**
   * Fetches full profile details by user_id
   */
  async fetchDetailsByUserId(userId: string): Promise<ProfileDetails | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // No profile found
      return null;
    }

    if (error) {
      console.error("Error fetching profile details:", error);
      throw error;
    }

    return data;
  }

  /**
   * Updates a profile by user_id
   */
  async updateByUserId(
    userId: string,
    updates: ProfileUpdateData
  ): Promise<ProfileDetails> {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }

    return data;
  }

  /**
   * Deletes a user's account and all associated data via the backend.
   * The backend uses the service role key to perform the deletion securely.
   * The user ID is derived from the verified JWT on the server — never trusted from the client.
   */
  async deleteAccount(): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("No active session found");
    }

    const response = await fetch(`${apiUrl}/api/me`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        (errorData as { error?: string }).error || "Failed to delete account",
      );
    }
  }
}

// Export singleton instance
export const profileRepository = new ProfileRepository();
