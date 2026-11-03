import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/contexts/AuthContext";
import Layout from "../../../layout/Layout";
import LoadingState from "../../dashboard/components/LoadingState";
import JoinCodeDisplay from "../components/JoinCodeDisplay";
import { Class } from "../../../types";
import { classRepository } from "../repositories/ClassRepository";
import {
  classMembershipRepository,
  type MemberWithProfile,
} from "../repositories/ClassMembershipRepository";
import {
  classExamRepository,
  type ClassExamDetails,
} from "../../exams/repositories/ClassExamRepository";

interface ExamCardProps {
  exam: ClassExamDetails;
  classId: string;
}

interface MemberCardProps {
  member: MemberWithProfile;
  onRemove: (memberId: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onRemove }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu when clicking outside
  React.useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = () => setMenuOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  const handleRemove = () => {
    onRemove(member.id);
    setMenuOpen(false);
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{member.full_name}</h3>
          {member.school && (
            <p className="text-sm text-gray-600">{member.school}</p>
          )}
          <p className="text-xs text-gray-500">
            Tilmeldt:{" "}
            {new Date(member.joined_at).toLocaleDateString("da-DK", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Three-dots Menu Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            <svg
              className="h-5 w-5 text-gray-500"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
              <circle cx="12" cy="5" r="1" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border rounded-md shadow-lg z-10 w-48 py-1 overflow-hidden">
              <button
                onClick={handleRemove}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Fjern medlem
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ExamCard: React.FC<ExamCardProps> = ({ exam, classId }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu when clicking outside
  React.useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = () => setMenuOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("da-DK");
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {exam.title || "Uden titel"}
          </h3>
          {exam.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {exam.description}
            </p>
          )}
          <div className="text-xs text-gray-500 mt-2">
            Oprettet: {formatDate(exam.created_at)}
          </div>
        </div>

        {/* Three-dots Menu Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            <svg
              className="h-5 w-5 text-gray-500"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
              <circle cx="12" cy="5" r="1" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border rounded-md shadow-lg z-10 w-48 py-1 overflow-hidden">
              <Link
                to={`/exam?id=${exam.id}`}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Rediger
              </Link>
              <Link
                to={`/live?id=${exam.id}`}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                  />
                </svg>
                Start eksamen
              </Link>
              {/*
              <Link
                to={`/student-results?exam-id=${exam.id}&class-id=${classId}`}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Se resultater
              </Link>
              */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ClassDetails: React.FC = () => {
  const [classData, setClassData] = useState<Class | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [classExams, setClassExams] = useState<ClassExamDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { id } = useParams();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id && user) {
      fetchClassAndMembers();
    }
  }, [id, user?.id]);

  const fetchClassAndMembers = async () => {
    try {
      // Fetch class data
      const data = await classRepository.fetchById(id!, user.id);
      setClassData(data);

      await Promise.all([fetchMembers(), fetchClassExams()]);
    } catch (error) {
      console.error("Error fetching class:", error);
      navigate("/classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const members = await classMembershipRepository.fetchWithProfiles(id!);
      setMembers(members);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchClassExams = async () => {
    try {
      const exams = await classExamRepository.fetchByClassId(id!);
      setClassExams(exams);
    } catch (error) {
      console.error("Error preparing class exams:", error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm("Er du sikker på at du vil fjerne dette medlem?")) {
      return;
    }

    try {
      await classMembershipRepository.delete(memberId);
      await fetchMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Fejl ved fjernelse af medlem");
    }
  };

  const handleDelete = async () => {
    if (!classData) return;

    if (window.confirm("Er du sikker på at du vil slette denne klasse?")) {
      try {
        await classRepository.delete(classData.id);
        navigate("/classes");
      } catch (error) {
        console.error("Error deleting class:", error);
        alert("Der opstod en fejl ved sletning af klassen");
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("da-DK");
  };

  if (loading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  if (!classData) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Klasse ikke fundet</p>
            <Link
              to="/classes"
              className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
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
      <div className="relative min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            to="/classes"
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
            Tilbage til klasser
          </Link>
        </div>

        {/* Class Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {classData.title}
              </h1>
              <div className="flex items-center gap-3">
                {classData.join_code && (
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    Inviter studenter
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {classData.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Beskrivelse
                  </h3>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {classData.description}
                  </p>
                </div>
              )}

              {classData.schoolname && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Skolenavn
                  </h3>
                  <p className="text-gray-900">{classData.schoolname}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Oprettet
                </h3>
                <p className="text-gray-900">
                  {formatDate(classData.created_at)}
                </p>
              </div>
            </div>

            {/* Class exams */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Klasseeksamener ({classExams.length})
                </h2>
                {userProfile?.is_student === false && (
                  <Link
                    to={`/create?classId=${classData.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Opret eksamen
                  </Link>
                )}
              </div>

              {classExams.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  <p>Ingen eksamener er tilknyttet denne klasse endnu.</p>
                  <p className="text-sm mt-2">
                    Brug knappen "Opret eksamen" ovenfor for at knytte en
                    eksamen til klassen.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {classExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      classId={classData.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Members Section */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Studerende ({members.length})
                </h2>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  <p>Ingen elever har tilmeldt sig denne klasse endnu.</p>
                  <p className="text-sm mt-2">
                    Del tilmeldingslinket ovenfor for at invitere elever.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onRemove={handleRemoveMember}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Join Code Modal */}
        {showJoinModal && classData?.join_code && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Inviter studenter til klassen
                  </h2>
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <JoinCodeDisplay
                  joinCode={classData.join_code}
                  className="mb-4"
                />

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Luk
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClassDetails;
