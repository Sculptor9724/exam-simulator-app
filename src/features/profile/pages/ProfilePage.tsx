import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../../layout/Layout";
import { useAuth } from "../../auth/contexts/AuthContext";
import {
  profileRepository,
  ProfileDetails,
  ProfileUpdateData,
} from "../../auth/repositories/ProfileRepository";
import ProfileDetailsDisplay from "../components/ProfileDetails";
import ProfileForm from "../components/ProfileForm";
import DeleteAccountButton from "../components/DeleteAccountButton";

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const profileData = await profileRepository.fetchDetailsByUserId(
          user.id
        );
        if (profileData) {
          setProfile(profileData);
        } else {
          setError("Profil ikke fundet");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Der opstod en fejl ved indlæsning af profilen");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleSave = async (updates: ProfileUpdateData) => {
    if (!user) return;

    try {
      const updatedProfile = await profileRepository.updateByUserId(
        user.id,
        updates
      );
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    try {
      await profileRepository.deleteAccount();
      // Sign out and redirect to landing page
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      throw err;
    }
  };

  return (
    <Layout>
      <div className="relative min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Indlæser profil...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!isLoading && !error && profile && (
          <>
            {isEditing ? (
              <ProfileForm
                profile={profile}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <ProfileDetailsDisplay
                profile={profile}
                onEdit={() => setIsEditing(true)}
              />
            )}

            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <DeleteAccountButton onDelete={handleDelete} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
