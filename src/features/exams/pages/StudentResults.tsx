import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../auth/contexts/AuthContext";
import Layout from "../../../layout/Layout";
import LoadingState from "../../dashboard/components/LoadingState";
import { calculateDuration } from "../../../shared/utils/dateUtils";
import { examRepository } from "../repositories/ExamRepository";
import { examLogRepository } from "../repositories/ExamLogRepository";
import { classRepository } from "../../classes/repositories/ClassRepository";
import { classMembershipRepository } from "../../classes/repositories/ClassMembershipRepository";

type ExamAttempt = {
  grade: string | null;
  feedback: string | null;
  created_at: string;
  finished_at: string | null;
};

type StudentResult = {
  student_id: string;
  student_name: string;
  average_grade: number | null;
  exam_count: number;
  exam_attempts: ExamAttempt[];
};

type ExamInfo = {
  id: number;
  title: string;
  description: string | null;
};

type ClassInfo = {
  id: string;
  title: string;
};

const StudentResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();

  const examId = searchParams.get("exam-id");
  const classId = searchParams.get("class-id");

  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(
    new Set()
  );
  const [hideShortAttempts, setHideShortAttempts] = useState(false);

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) {
      return;
    }

    // If there's no user, redirect
    if (!user) {
      navigate("/classes");
      return;
    }

    // Wait for userProfile to load after user is available
    if (user && userProfile === null) {
      return;
    }

    // Verify user is teacher
    if (userProfile?.is_student !== false) {
      navigate("/classes");
      return;
    }

    if (!examId || !classId) {
      setError("Manglende eksamen-ID eller klasse-ID");
      setLoading(false);
      return;
    }

    fetchData();
  }, [user, userProfile, examId, classId, navigate, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch exam info
      const examData = await examRepository.fetchById(Number(examId));

      if (!examData || examData.user_id !== user.id) {
        setError("Eksamen ikke fundet eller du har ikke adgang til den");
        return;
      }

      setExamInfo({
        id: examData.id,
        title: examData.title || "Uden titel",
        description: examData.description,
      });

      // Fetch class info
      if (!classId) {
        setError("Manglende klasse-ID");
        return;
      }

      const classData = await classRepository.fetchById(classId, user.id);

      if (!classData) {
        setError("Klasse ikke fundet eller du har ikke adgang til den");
        return;
      }

      setClassInfo({
        id: classData.id as string,
        title: classData.title,
      });

      // Fetch student results
      await fetchStudentResults();
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Fejl ved hentning af data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentResults = async () => {
    try {
      if (!classId) return;

      // Get all class members with their profiles
      const membersWithProfiles =
        await classMembershipRepository.fetchWithProfiles(classId);

      if (membersWithProfiles.length === 0) {
        setStudentResults([]);
        return;
      }

      // Get user IDs from profiles
      const userIds = membersWithProfiles
        .map((member) => member.user_id)
        .filter(Boolean);

      if (userIds.length === 0) {
        setStudentResults([]);
        return;
      }

      // Fetch exam logs for these students for this specific exam
      const logsData = await examLogRepository.fetchByExamAndUsers(
        Number(examId),
        userIds
      );

      // Process results
      const resultsMap = new Map<
        string,
        {
          student_id: string;
          student_name: string;
          exam_attempts: ExamAttempt[];
        }
      >();
      
      // Initialize all students
      membersWithProfiles.forEach((member) => {
        if (member.user_id) {
          resultsMap.set(member.user_id, {
            student_id: member.user_id,
            student_name: member.full_name || "Unavngivet",
            exam_attempts: [],
          });
        }
      });

      // Add exam attempts to students
      logsData?.forEach((log: any) => {
        const student = resultsMap.get(log.user_id);
        if (student) {
          student.exam_attempts.push({
            grade: log.grade,
            feedback: log.feedback,
            created_at: log.created_at,
            finished_at: log.finished_at,
          });
        }
      });

      // Calculate averages and create final results
      const results: StudentResult[] = Array.from(resultsMap.values()).map(
        (student) => {
          let averageGrade = null;

          // All attempts are included
          const allAttempts = student.exam_attempts;

          // Only count graded attempts for average calculation
          const numericGrades = allAttempts
            .map((attempt) =>
              attempt.grade ? parseFloat(attempt.grade) : null
            )
            .filter(
              (grade): grade is number => grade !== null && !isNaN(grade)
            );

          if (numericGrades.length > 0) {
            averageGrade =
              numericGrades.reduce((sum, grade) => sum + grade, 0) /
              numericGrades.length;
          }

          return {
            student_id: student.student_id,
            student_name: student.student_name,
            average_grade: averageGrade,
            exam_count: allAttempts.length, // All attempts, including ungraded
            exam_attempts: allAttempts,
          };
        }
      );

      // Sort by average grade (highest first), then by name
      results.sort((a, b) => {
        if (a.average_grade === null && b.average_grade === null) {
          return a.student_name.localeCompare(b.student_name);
        }
        if (a.average_grade === null) return 1;
        if (b.average_grade === null) return -1;
        if (a.average_grade !== b.average_grade) {
          return b.average_grade - a.average_grade;
        }
        return a.student_name.localeCompare(b.student_name);
      });

      setStudentResults(results);
    } catch (err) {
      console.error("Error processing student results:", err);
      setStudentResults([]);
    }
  };

  const formatGrade = (grade: number | null): string => {
    if (grade === null) return "Ingen resultater";
    return grade.toFixed(1);
  };

  const getGradeColor = (grade: number | null): string => {
    if (grade === null) return "text-gray-500";
    if (grade >= 10) return "text-green-600";
    if (grade >= 7) return "text-yellow-600";
    if (grade >= 4) return "text-orange-600";
    return "text-red-600";
  };

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("da-DK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAttemptDurationSeconds = (attempt: ExamAttempt): number | null => {
    if (!attempt.finished_at) return null;
    const startMs = new Date(attempt.created_at).getTime();
    const endMs = new Date(attempt.finished_at).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
    return Math.max(0, (endMs - startMs) / 1000);
  };

  const filteredResults = useMemo(() => {
    if (!hideShortAttempts) {
      return studentResults;
    }

    return studentResults.map((student) => {
      const filteredAttempts = student.exam_attempts.filter((attempt) => {
        const durationSeconds = getAttemptDurationSeconds(attempt);
        return durationSeconds === null || durationSeconds >= 20;
      });

      const numericGrades = filteredAttempts
        .map((attempt) => (attempt.grade ? parseFloat(attempt.grade) : null))
        .filter((grade): grade is number => grade !== null && !isNaN(grade));

      const averageGrade =
        numericGrades.length > 0
          ? numericGrades.reduce((sum, grade) => sum + grade, 0) /
            numericGrades.length
          : null;

      return {
        ...student,
        exam_attempts: filteredAttempts,
        exam_count: filteredAttempts.length,
        average_grade: averageGrade,
      };
    });
  }, [hideShortAttempts, studentResults]);

  if (loading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              to="/classes"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              ← Tilbage til klasser
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            to={`/class/${classId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Tilbage til {classInfo?.title}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Elevresultater
          </h1>
          <div className="text-lg text-gray-600">
            <p>
              <strong>Eksamen:</strong> {examInfo?.title}
            </p>
            <p>
              <strong>Klasse:</strong> {classInfo?.title}
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Resultater ({filteredResults.length} elever)
              </h2>
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={hideShortAttempts}
                  onChange={(event) =>
                    setHideShortAttempts(event.target.checked)
                  }
                />
                Skjul forsøg under 20 sekunder
              </label>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Ingen resultater fundet for denne eksamen.</p>
              <p className="text-sm mt-2">
                Enten har ingen elever taget eksamen, eller der er ingen elever
                i klassen.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Elev
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gennemsnitskarakter
                      <div className="text-xs normal-case font-normal text-gray-400 mt-0.5">
                        (kun bedømte forsøg)
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Antal forsøg
                      <div className="text-xs normal-case font-normal text-gray-400 mt-0.5">
                        (alle forsøg)
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result, index) => {
                    const isExpanded = expandedStudents.has(result.student_id);
                    const hasAttempts = result.exam_attempts.length > 0;

                    return (
                      <React.Fragment key={result.student_id}>
                        {/* Main student row */}
                        <tr
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-12">
                            {hasAttempts && (
                              <button
                                onClick={() =>
                                  toggleStudentExpansion(result.student_id)
                                }
                                className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                                aria-label={
                                  isExpanded ? "Skjul detaljer" : "Vis detaljer"
                                }
                              >
                                <svg
                                  className={`w-4 h-4 transition-transform ${
                                    isExpanded ? "rotate-90" : ""
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {result.student_name}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGradeColor(
                              result.average_grade
                            )}`}
                          >
                            {formatGrade(result.average_grade)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.exam_count}
                          </td>
                        </tr>

                        {/* Expanded detail rows */}
                        {isExpanded && hasAttempts && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 bg-gray-50">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-4">
                                  Individuelle eksamensforsøg
                                </h4>
                                <div className="space-y-3">
                                  {result.exam_attempts.map(
                                    (attempt, attemptIndex) => {
                                      const numericGrade = attempt.grade
                                        ? parseFloat(attempt.grade)
                                        : null;
                                      return (
                                        <div
                                          key={attemptIndex}
                                          className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow"
                                        >
                                          {/* Grade, Duration and Time on one row */}
                                          <div className="flex items-center justify-between gap-4 flex-wrap">
                                            <div className="flex items-center gap-6">
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-500">
                                                  Karakter:
                                                </span>
                                                <span
                                                  className={`text-xl font-bold ${getGradeColor(
                                                    numericGrade
                                                  )}`}
                                                >
                                                  {attempt.grade || "Ingen"}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-500">
                                                  Varighed:
                                                </span>
                                                <span className="text-sm font-medium text-gray-700">
                                                  {calculateDuration(
                                                    attempt.created_at,
                                                    attempt.finished_at
                                                  )}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              {attempt.finished_at
                                                ? formatDate(
                                                    attempt.finished_at
                                                  )
                                                : "Ikke afsluttet"}
                                            </div>
                                          </div>

                                          {/* Feedback on separate row */}
                                          {attempt.feedback ? (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                              <div className="text-xs font-medium text-gray-500 mb-1">
                                                Feedback:
                                              </div>
                                              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {attempt.feedback}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                              <span className="text-sm text-gray-400 italic">
                                                Ingen feedback
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statistics */}
        {filteredResults.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Statistik
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredResults.length}
                </div>
                <div className="text-sm text-gray-500">Elever i alt</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredResults.filter((r) => r.average_grade !== null)
                    .length}
                </div>
                <div className="text-sm text-gray-500">Har taget eksamen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredResults.reduce((sum, r) => sum + r.exam_count, 0)}
                </div>
                <div className="text-sm text-gray-500">Forsøg i alt</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${getGradeColor(
                    filteredResults.filter((r) => r.average_grade !== null)
                      .length > 0
                      ? filteredResults
                          .filter((r) => r.average_grade !== null)
                          .reduce((sum, r) => sum + r.average_grade!, 0) /
                          filteredResults.filter((r) => r.average_grade !== null)
                            .length
                      : null
                  )}`}
                >
                  {filteredResults.filter((r) => r.average_grade !== null)
                    .length > 0
                    ? (
                        filteredResults
                          .filter((r) => r.average_grade !== null)
                          .reduce((sum, r) => sum + r.average_grade!, 0) /
                        filteredResults.filter((r) => r.average_grade !== null)
                          .length
                      ).toFixed(1)
                    : "N/A"}
                </div>
                <div className="text-sm text-gray-500">Gennemsnit</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentResults;
