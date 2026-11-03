import { supabase } from "../../../config/supabaseClient";
import { ClassMembership } from "../../../types";

/**
 * Extended ClassMembership type that includes profile information
 */
export interface MemberWithProfile {
  id: string;
  class_id: string;
  user_id: string;
  joined_at: string;
  full_name: string;
  school: string | null;
}

/**
 * Repository for managing ClassMembership entities
 * Handles all database operations related to class memberships
 */
export class ClassMembershipRepository {
  /**
   * Fetches all memberships for a class with full profile information
   * Uses a single join query for better performance
   */
  async fetchWithProfiles(classId: string): Promise<MemberWithProfile[]> {
    const { data, error } = await supabase
      .from("class_memberships")
      .select(
        `
        id,
        class_id,
        joined_at,
        profiles!inner(
          user_id,
          full_name,
          school
        )
      `
      )
      .eq("class_id", classId)
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("Error fetching members with profiles:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform data to match MemberWithProfile interface
    const transformedMembers: MemberWithProfile[] = data.map((member: any) => ({
      id: member.id,
      class_id: member.class_id,
      user_id: member.profiles?.user_id || "",
      joined_at: member.joined_at,
      full_name: member.profiles?.full_name || "Unavngivet",
      school: member.profiles?.school || null,
    }));

    return transformedMembers;
  }

  /**
   * Fetches class IDs that a user (by profile_id) is a member of
   */
  async fetchClassIdsByProfileId(profileId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("class_memberships")
      .select("class_id")
      .eq("profile_id", profileId);

    if (error) {
      console.error("Error fetching class memberships:", error);
      throw error;
    }

    return data?.map((membership) => membership.class_id) || [];
  }

  /**
   * Fetches memberships with nested profile information (for StudentResults)
   */
  async fetchWithProfilesNested(classId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("class_memberships")
      .select(
        `
        profile_id,
        profiles!inner(
          id,
          user_id,
          full_name,
          school
        )
      `
      )
      .eq("class_id", classId);

    if (error) {
      console.error("Error fetching memberships with profiles:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Creates a new class membership
   */
  async create(classId: string, profileId: string): Promise<void> {
    const { error } = await supabase.from("class_memberships").insert([
      {
        class_id: classId,
        profile_id: profileId,
      },
    ]);

    if (error) {
      console.error("Error creating membership:", error);
      throw error;
    }
  }

  /**
   * Deletes a class membership
   */
  async delete(membershipId: string): Promise<void> {
    const { error } = await supabase
      .from("class_memberships")
      .delete()
      .eq("id", membershipId);

    if (error) {
      console.error("Error deleting membership:", error);
      throw error;
    }
  }

  /**
   * Checks if a membership already exists
   */
  async exists(classId: string, profileId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("class_memberships")
      .select("id")
      .eq("class_id", classId)
      .eq("profile_id", profileId)
      .single();

    if (error && error.code === "PGRST116") {
      // No rows returned - membership doesn't exist
      return false;
    }

    if (error) {
      console.error("Error checking membership:", error);
      throw error;
    }

    return !!data;
  }
}

// Export singleton instance
export const classMembershipRepository = new ClassMembershipRepository();
