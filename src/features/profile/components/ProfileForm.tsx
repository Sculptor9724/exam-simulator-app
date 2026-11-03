import React, { useState } from "react";
import {
  ProfileDetails,
  ProfileUpdateData,
} from "../../auth/repositories/ProfileRepository";

interface ProfileFormProps {
  profile: ProfileDetails;
  onSave: (updates: ProfileUpdateData) => Promise<void>;
  onCancel: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ProfileUpdateData>({
    full_name: profile.full_name || "",
    school: profile.school || "",
    education_name: profile.education_name || "",
    semester: profile.semester || undefined,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "semester" ? (value ? parseInt(value, 10) : undefined) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Der opstod en fejl ved gemning af profilen");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Rediger profil</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fulde navn
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Dit fulde navn"
          />
        </div>

        <div>
          <label
            htmlFor="school"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Skole
          </label>
          <input
            type="text"
            id="school"
            name="school"
            value={formData.school || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Din skole eller institution"
          />
        </div>

        <div>
          <label
            htmlFor="education_name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Uddannelse
          </label>
          <input
            type="text"
            id="education_name"
            name="education_name"
            value={formData.education_name || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Din uddannelse"
          />
        </div>

        {profile.is_student && (
          <div>
            <label
              htmlFor="semester"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Semester
            </label>
            <select
              id="semester"
              name="semester"
              value={formData.semester || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Vælg semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                <option key={sem} value={sem}>
                  {sem}. semester
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isSaving ? "Gemmer..." : "Gem ændringer"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Annuller
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
