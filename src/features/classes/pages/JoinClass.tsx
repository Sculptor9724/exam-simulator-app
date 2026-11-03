import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/contexts/AuthContext";
import Layout from "../../../layout/Layout";
import { classRepository } from "../repositories/ClassRepository";
import { classMembershipRepository } from "../repositories/ClassMembershipRepository";
import { profileRepository } from "../../auth/repositories/ProfileRepository";

const JoinClass: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { joinCode } = useParams<{ joinCode: string }>();
  const processing = useRef(false);

  useEffect(() => {
    if (joinCode && user && !processing.current) {
      processing.current = true;
      handleJoinClass(joinCode.toUpperCase());
    }
  }, [joinCode, user]);

  const handleJoinClass = async (code: string) => {
    try {
      // Lookup class by join code
      const classData = await classRepository.fetchByJoinCode(code);

      if (!classData) {
        setError("Ugyldig deltag-kode");
        setLoading(false);
        return;
      }

      setClassInfo(classData);

      // Get or create the user's profile
      const userProfile = await profileRepository.getOrCreate(
        user.id,
        user.user_metadata?.full_name || null,
        true
      );

      if (!userProfile) {
        throw new Error("Failed to get or create user profile");
      }

      const classId = classData.id as string;
      const profileId = userProfile.id as string;

      // Check if already a member using profile_id
      const alreadyMember = await classMembershipRepository.exists(
        classId,
        profileId
      );

      if (alreadyMember) {
        setError("Du er allerede medlem af denne klasse");
        setLoading(false);
        return;
      }

      // Join the class
      await classMembershipRepository.create(classId, profileId);

      // Success - redirect to dashboard
      alert(`Du er nu medlem af klassen "${classData.title}"!`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error joining class:", error);
      setError("Der opstod en fejl ved tilmelding til klassen");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Tilmelder til klasse...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fejl</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Tilbage til oversigt
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default JoinClass;
