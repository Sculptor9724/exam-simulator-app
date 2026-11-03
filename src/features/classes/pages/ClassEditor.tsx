import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/contexts/AuthContext";
import Layout from "../../../layout/Layout";
import { classRepository } from "../repositories/ClassRepository";

const ClassEditor: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schoolname, setSchoolname] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const fetchClass = async () => {
    try {
      const data = await classRepository.fetchById(id!, user.id);
      setTitle(data.title);
      setDescription(data.description || "");
      setSchoolname(data.schoolname || "");
    } catch (error) {
      console.error("Error fetching class:", error);
      navigate("/classes");
    }
  };

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      fetchClass();
    }
  }, [id, user.id, navigate]); // Added all dependencies

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Titel er påkrævet");
      return;
    }

    setLoading(true);

    try {
      const classData = {
        title: title.trim(),
        description: description.trim() || null,
        schoolname: schoolname.trim() || null,
        user_id: user.id,
      };

      if (isEditing) {
        await classRepository.update(id!, classData);
      } else {
        await classRepository.create(classData);
      }

      navigate("/classes");
    } catch (error) {
      console.error("Error saving class:", error);
      alert("Der opstod en fejl ved gemning af klassen");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/classes");
  };

  return (
    <Layout>
      <div className="relative min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {isEditing ? "Rediger klasse" : "Opret ny klasse"}
            </h1>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Indtast klassetitel"
                  maxLength={255}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Beskrivelse
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Indtast klassebeskrivelse (valgfrit)"
                />
              </div>

              <div>
                <label
                  htmlFor="schoolname"
                  className="block text-sm font-medium text-gray-700"
                >
                  Skolenavn
                </label>
                <input
                  type="text"
                  id="schoolname"
                  value={schoolname}
                  onChange={(e) => setSchoolname(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Indtast skolenavn (valgfrit)"
                  maxLength={255}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? "Gemmer..."
                  : isEditing
                  ? "Gem ændringer"
                  : "Opret klasse"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClassEditor;
