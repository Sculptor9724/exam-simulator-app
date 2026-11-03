import React, { useState, useEffect } from "react";
import Layout from "../../../layout/Layout";
import { useAuth } from "../../auth/contexts/AuthContext";
import StatsOverview from "../components/StatsOverview";
import ExamLogsList from "../components/ExamLogsList";
import ContinueWhereYouLeftOff from "../components/ContinueWhereYouLeftOff";
import {
  examLogRepository,
  UserExamStats,
  RecentExam,
} from "../../exams/repositories/ExamLogRepository";

export default function Dashboard() {
  const { user, userProfile, loading: authLoading } = useAuth();

  // Dashboard stats state
  const [userStats, setUserStats] = useState<UserExamStats>({
    totalExams: 0,
    averageGrade: null,
    totalMinutes: 0,
  });
  const [recentExams, setRecentExams] = useState<RecentExam[]>([]);
  const [lastExam, setLastExam] = useState<RecentExam | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingRecentExams, setIsLoadingRecentExams] = useState(true);

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading || !user) {
        setIsLoadingStats(false);
        return;
      }

      setIsLoadingStats(true);
      try {
        const stats = await examLogRepository.fetchUserStats(user.id);
        setUserStats(stats);
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, authLoading]);

  // Fetch recent exams and set last exam for "Continue where you left off"
  useEffect(() => {
    const fetchRecent = async () => {
      if (authLoading || !user) {
        setIsLoadingRecentExams(false);
        return;
      }

      setIsLoadingRecentExams(true);
      try {
        const exams = await examLogRepository.fetchRecentExams(user.id, 5);
        setRecentExams(exams);
        // Set the first (most recent) exam as lastExam
        if (exams.length > 0) {
          setLastExam(exams[0]);
        }
      } catch (error) {
        console.error("Error fetching recent exams:", error);
      } finally {
        setIsLoadingRecentExams(false);
      }
    };

    fetchRecent();
  }, [user, authLoading]);

  return (
    <Layout>
      <div className="relative min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Velkommen tilbage
            {userProfile?.full_name
              ? `, ${userProfile.full_name.split(" ")[0]}`
              : ""}
          </h1>
          <p className="text-lg text-gray-600">
            Klar til at træne den næste mundtlige eksamen?
          </p>
        </div>

        {/* Statistics Overview */}
        <StatsOverview stats={userStats} loading={isLoadingStats} />

        {/* Continue Where You Left Off */}
        <ContinueWhereYouLeftOff
          lastExam={lastExam}
          loading={isLoadingRecentExams}
        />

        {/* Recent Exams */}
        <ExamLogsList exams={recentExams} loading={isLoadingRecentExams} />
      </div>
    </Layout>
  );
}
