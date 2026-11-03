import React from "react";
import { ProfileDetails } from "../../auth/repositories/ProfileRepository";

interface ProfileDetailsDisplayProps {
  profile: ProfileDetails;
  onEdit: () => void;
}

const ProfileDetailsDisplay: React.FC<ProfileDetailsDisplayProps> = ({
  profile,
  onEdit,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Min profil</h2>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Rediger profil
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fulde navn
          </label>
          <p className="text-gray-900">{profile.full_name || "Ikke angivet"}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Skole
          </label>
          <p className="text-gray-900">{profile.school || "Ikke angivet"}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Uddannelse
          </label>
          <p className="text-gray-900">
            {profile.education_name || "Ikke angivet"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Semester
          </label>
          <p className="text-gray-900">
            {profile.semester
              ? `${profile.semester}. semester`
              : "Ikke angivet"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rolle
          </label>
          <p className="text-gray-900">
            {profile.is_student ? "Studerende" : "Lærer"}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Medlem siden:{" "}
            {new Date(profile.created_at).toLocaleDateString("da-DK", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailsDisplay;
