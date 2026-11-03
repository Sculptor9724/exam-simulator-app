import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Layout from "../../../layout/Layout";
import { useAuth } from "../../auth/contexts/AuthContext";
import { ExamSimulator } from "../../../shared/contexts/ExamSimulatorContext";
import FilterChips, {
  FilteredExams,
  SectionVisibility,
} from "../components/FilterChips";
import ExamCarousel from "../components/ExamCarousel";
import { examRepository } from "../repositories/ExamRepository";
import { profileRepository } from "../../auth/repositories/ProfileRepository";
import { classMembershipRepository } from "../../classes/repositories/ClassMembershipRepository";
import { classExamRepository } from "../repositories/ClassExamRepository";
import { fetchCompletedExamIds } from "../repositories/ExamLogRepository";

const HIGHLIGHTED_EXAM_IDS: string[] = [];

type ClassExamSimulator = {
  exam: ExamSimulator;
  classId: string;
  classTitle: string;
};

export default function ExamsPage() {
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const { user, userProfile, loading: authLoading } = useAuth();

  // All exam data
  const [highlightedExams, setHighlightedExams] = useState<ExamSimulator[]>([]);
  const [publicExamSimulators, setPublicExamSimulators] = useState<
    ExamSimulator[]
  >([]);
  const [usersExamSimulators, setUsersExamSimulators] = useState<
    ExamSimulator[]
  >([]);
  const [classExamSimulators, setClassExamSimulators] = useState<
    ClassExamSimulator[]
  >([]);
  const [completedExamIds, setCompletedExamIds] = useState<Set<string>>(
    new Set()
  );

  // Single loading state for all fetches
  const [isLoading, setIsLoading] = useState(true);

  // Filtered results from FilterChips
  const [filteredExams, setFilteredExams] = useState<FilteredExams>({
    highlighted: [],
    classExams: [],
    public: [],
    userExams: [],
  });
  const [showSection, setShowSection] = useState<SectionVisibility>({
    highlighted: true,
    classExams: true,
    public: true,
    myExams: true,
  });
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const isStudent = userProfile?.is_student === true;

  // Callback for FilterChips
  const handleFilteredExamsChange = useCallback(
    (
      filtered: FilteredExams,
      visibility: SectionVisibility,
      hasFilters: boolean
    ) => {
      setFilteredExams(filtered);
      setShowSection(visibility);
      setHasActiveFilters(hasFilters);
    },
    []
  );

  // Get class title for an exam
  const getClassTitleForExam = (examId: string): string | undefined => {
    const found = classExamSimulators.find((item) => item.exam.id === examId);
    return found?.classTitle;
  };

  // Single useEffect to fetch all exam data
  useEffect(() => {
    const fetchAllExamData = async () => {
      if (authLoading) return;

      setIsLoading(true);

      const excludeIds = HIGHLIGHTED_EXAM_IDS.map(Number);

      try {
        // Build array of fetch promises based on what we need
        const fetchPromises: Promise<any>[] = [];
        const fetchKeys: string[] = [];

        // 1. Always fetch highlighted exams
        if (HIGHLIGHTED_EXAM_IDS.length > 0) {
          fetchPromises.push(
            examRepository.fetchByIds(HIGHLIGHTED_EXAM_IDS.map(Number))
          );
          fetchKeys.push("highlighted");
        }

        // 2. Fetch user-specific data if logged in
        if (user) {
          // User's own exams
          fetchPromises.push(examRepository.fetchByUserId(user.id, excludeIds));
          fetchKeys.push("userExams");

          // Public exams (excluding user's own)
          fetchPromises.push(
            examRepository.fetchPublicExcludingUser(user.id, excludeIds)
          );
          fetchKeys.push("publicExams");

          // Completed exam IDs for statistics button
          fetchPromises.push(fetchCompletedExamIds(user.id));
          fetchKeys.push("completedIds");

          // Class exams (only for students)
          if (userProfile?.is_student !== false) {
            fetchPromises.push(
              fetchClassExamsForUser(user.id, userProfile?.id, excludeIds)
            );
            fetchKeys.push("classExams");
          }
        }

        // Execute all fetches in parallel
        const results = await Promise.allSettled(fetchPromises);

        // Process results
        results.forEach((result, index) => {
          const key = fetchKeys[index];

          if (result.status === "fulfilled") {
            switch (key) {
              case "highlighted":
                setHighlightedExams(result.value as ExamSimulator[]);
                break;
              case "userExams":
                setUsersExamSimulators(result.value as ExamSimulator[]);
                break;
              case "publicExams":
                setPublicExamSimulators(result.value as ExamSimulator[]);
                break;
              case "completedIds":
                setCompletedExamIds(result.value as Set<string>);
                break;
              case "classExams":
                setClassExamSimulators(result.value as ClassExamSimulator[]);
                break;
            }
          } else {
            console.error(`Error fetching ${key}:`, result.reason);
            // Set empty defaults on error
            switch (key) {
              case "highlighted":
                setHighlightedExams([]);
                break;
              case "userExams":
                setUsersExamSimulators([]);
                break;
              case "publicExams":
                setPublicExamSimulators([]);
                break;
              case "completedIds":
                setCompletedExamIds(new Set());
                break;
              case "classExams":
                setClassExamSimulators([]);
                break;
            }
          }
        });
      } catch (error) {
        console.error("Error fetching exam data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllExamData();
  }, [user, userProfile?.is_student, userProfile?.id, authLoading]);

  // Helper function to fetch class exams (extracted for cleaner code)
  async function fetchClassExamsForUser(
    userId: string,
    profileId: string | undefined,
    excludeIds: number[]
  ): Promise<ClassExamSimulator[]> {
    let resolvedProfileId = profileId;

    if (!resolvedProfileId) {
      const profile = await profileRepository.fetchByUserId(userId);
      if (!profile) return [];
      resolvedProfileId = profile.id as string;
    }

    if (!resolvedProfileId) return [];

    const classIds = await classMembershipRepository.fetchClassIdsByProfileId(
      resolvedProfileId
    );

    if (classIds.length === 0) return [];

    const classExamDetails = await classExamRepository.fetchByClassIds(
      classIds,
      excludeIds
    );

    const uniqueMap = new Map<string | number, ClassExamSimulator>();
    classExamDetails.forEach((detail: any) => {
      const examIdKey = detail.exam.id;
      if (examIdKey !== undefined && !uniqueMap.has(examIdKey)) {
        uniqueMap.set(examIdKey, {
          exam: detail.exam as ExamSimulator,
          classId: detail.classId,
          classTitle: detail.classTitle,
        });
      }
    });

    return Array.from(uniqueMap.values());
  }

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
      setTimeout(() => setToastMessage(""), 300);
    }, 3000);
  };

  // Section icons
  const highlightedIcon = (
    <svg
      className="w-5 h-5 text-yellow-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  const classExamsIcon = (
    <svg
      className="w-5 h-5 text-indigo-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );

  const publicExamsIcon = (
    <svg
      className="w-5 h-5 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );

  const myExamsIcon = (
    <svg
      className="w-5 h-5 text-blue-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  return (
    <Layout>
      <div className="relative min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
              Eksamener
            </h1>
            <Link
              to="/create"
              className="hidden md:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <svg
                className="w-5 h-5"
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
              Opret ny eksamen
            </Link>
          </div>

          {/* Filter Chips */}
          <FilterChips
            highlightedExams={highlightedExams}
            classExams={classExamSimulators.map((c) => c.exam)}
            publicExams={publicExamSimulators}
            userExams={usersExamSimulators}
            showClassExams={isStudent}
            onFilteredExamsChange={handleFilteredExamsChange}
          />

          {/* Highlighted Exams Carousel */}
          {showSection.highlighted && (
            <ExamCarousel
              title="Fremhævede Eksamener"
              icon={highlightedIcon}
              exams={filteredExams.highlighted}
              isLoading={isLoading}
              emptyMessage="Ingen fremhævede eksamener"
              completedExamIds={completedExamIds}
              currentUserId={user?.id}
              onCopyLink={showToast}
            />
          )}

          {/* Class Exams Carousel - Only for students */}
          {isStudent && showSection.classExams && (
            <ExamCarousel
              title="Eksamener fra dine klasser"
              icon={classExamsIcon}
              exams={filteredExams.classExams}
              isLoading={isLoading}
              emptyMessage="Du har ingen klasseeksamener endnu"
              getClassTitle={getClassTitleForExam}
              completedExamIds={completedExamIds}
              currentUserId={user?.id}
              onCopyLink={showToast}
            />
          )}

          {/* User's Created Exams - Same carousel style */}
          {showSection.myExams && (
            <ExamCarousel
              title="Dine oprettede eksamener"
              icon={myExamsIcon}
              exams={filteredExams.userExams}
              isLoading={isLoading}
              emptyMessage="Du har ingen eksamener endnu"
              completedExamIds={completedExamIds}
              isOwner={true}
              onCopyLink={showToast}
            />
          )}

          {/* Public Exams Carousel */}
          {showSection.public && (
            <ExamCarousel
              title="Udforsk Offentlige Eksamener"
              icon={publicExamsIcon}
              exams={filteredExams.public}
              isLoading={isLoading}
              emptyMessage="Ingen offentlige eksamener"
              completedExamIds={completedExamIds}
              currentUserId={user?.id}
              onCopyLink={showToast}
            />
          )}

          {/* No results message when filters are active */}
          {hasActiveFilters &&
            filteredExams.highlighted.length === 0 &&
            filteredExams.userExams.length === 0 &&
            filteredExams.classExams.length === 0 &&
            filteredExams.public.length === 0 &&
            !isLoading && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Ingen eksamener fundet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Prøv at ændre dine filtre for at se flere resultater.
                </p>
              </div>
            )}

          {/* Mobile Create Button */}
          <Link
            to="/create"
            className="md:hidden fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors z-40"
            aria-label="Create new simulator"
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

          {/* Toast Notification */}
          <div
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white py-3 px-6 rounded-lg shadow-lg z-50 flex items-center transition-opacity duration-300 ${
              isToastVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <svg
              className="h-5 w-5 text-green-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {toastMessage}
          </div>
        </div>
      </div>
    </Layout>
  );
}
