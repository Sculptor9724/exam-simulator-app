import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/contexts/AuthContext";
import { profileRepository } from "../../auth/repositories/ProfileRepository";
import Layout from "../../../layout/Layout";
import LoadingState from "../../dashboard/components/LoadingState";
import ClassCard from "../components/ClassCard";
import {
  classRepository,
  ClassWithExams,
} from "../repositories/ClassRepository";

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<ClassWithExams[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const isStudent = userProfile?.is_student === true;

  const fetchClasses = useCallback(async () => {
    if (!user) return;
    try {
      let profileId = userProfile?.id as string | undefined;

      if (!profileId) {
        const profile = await profileRepository.fetchByUserId(user.id);
        if (!profile) {
          setClasses([]);
          setLoading(false);
          return;
        }
        profileId = profile.id as string;
      }

      if (isStudent) {
        // Students: fetch classes they're enrolled in
        const data = await classRepository.fetchClassesWithExams(profileId);
        setClasses(data);
      } else {
        // Teachers: fetch classes they created, with exams
        const data = await classRepository.fetchTeacherClassesWithExams(
          user.id
        );
        setClasses(data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile?.id, isStudent]);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user, fetchClasses]);

  if (loading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
              Mine Klasser
            </h1>
            {/* Desktop Create Button - only for teachers */}
            {!isStudent && (
              <Link
                to="/class-editor"
                className="hidden md:inline-flex bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Opret ny klasse
              </Link>
            )}
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            {isStudent
              ? "Du er ikke tilmeldt nogen klasser endnu."
              : "Du har ikke oprettet nogen klasser endnu."}
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classData={classItem}
                isStudent={isStudent}
              />
            ))}
          </div>
        )}

        {/* Mobile Create Button - only for teachers */}
        {!isStudent && (
          <Link
            to="/class-editor"
            className="md:hidden fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
            aria-label="Create new class"
          >
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </Link>
        )}
      </div>
    </Layout>
  );
};

export default Classes;
