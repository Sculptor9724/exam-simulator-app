import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../../../config/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, is_student, role, school, full_name")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        } else {
          setUserProfile(data);
        }
      };
      fetchProfile();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  // Expose the user and auth methods
  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    userProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
