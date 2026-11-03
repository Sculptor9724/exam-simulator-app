import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/contexts/AuthContext";
import Layout from "../../../layout/Layout";
import LoadingState from "../../dashboard/components/LoadingState";
import StatsOverview from "../../dashboard/components/StatsOverview";
import ExamLogsList from "../../dashboard/components/ExamLogsList";
import { examLogRepository } from "../repositories/ExamLogRepository";
import type {
  ExamStatistics as ExamStatsType,
  UserExamStats,
  RecentExam,
} from "../repositories/ExamLogRepository";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ExamStatistics() {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("exam-id");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [statistics, setStatistics] = useState<ExamStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prepare stats for StatsOverview component
  const userStats: UserExamStats = statistics
    ? {
        totalExams: statistics.total_attempts,
        averageGrade: statistics.average_grade,
        totalMinutes: statistics.total_time_minutes,
      }
    : {
        totalExams: 0,
        averageGrade: null,
        totalMinutes: 0,
      };

  // Convert ExamStatisticsLog[] to RecentExam[] for ExamLogsList component
  const recentExams: RecentExam[] = statistics
    ? statistics.attempts.map((attempt) => ({
        id: attempt.id,
        exam_id: statistics.exam_id,
        exam_title: statistics.exam_title,
        grade: attempt.grade,
        feedback: attempt.feedback,
        created_at: attempt.created_at,
        finished_at: attempt.finished_at,
        duration_minutes: attempt.duration_minutes,
      }))
    : [];

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (!examId) {
      setError("Manglende eksamen-ID");
      setLoading(false);
      return;
    }

    fetchStatistics();
  }, [user, examId, authLoading, navigate]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = await examLogRepository.fetchExamStatistics(
        user!.id,
        Number(examId)
      );

      setStatistics(stats);
    } catch (err) {
      console.error("Error fetching exam statistics:", err);
      setError("Kunne ikke hente statistik");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data - only include attempts with grades
  const chartData = statistics
    ? {
        labels: statistics.attempts
          .filter((attempt) => attempt.grade !== null)
          .map((_, index) => `Forsøg ${index + 1}`),
        datasets: [
          {
            label: "Karakter",
            data: statistics.attempts
              .filter((attempt) => attempt.grade !== null)
              .map((attempt) => parseFloat(attempt.grade!)),
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            tension: 0.1,
          },
        ],
      }
    : { labels: [], datasets: [] };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Karakterudvikling for eksamener med karakter",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Forsøg",
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 12,
        title: {
          display: true,
          text: "Karakter",
        },
        grid: {
          display: false,
        },
      },
    },
  };
  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <LoadingState />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!statistics || statistics.total_attempts === 0) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-6">
            <Link
              to="/exams"
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Tilbage til eksamener"
            >
              <svg
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Eksamenstatistik
            </h1>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800 mb-2">
              Du har endnu ikke gennemført denne eksamen.
            </p>
            <Link
              to={`/live?id=${examId}`}
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start eksamen
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link
            to="/exams"
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Tilbage til eksamener"
          >
            <svg
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Statistik: {statistics?.exam_title || "Eksamen"}
          </h1>
        </div>

        {/* Stats Overview */}
        <StatsOverview stats={userStats} loading={loading} />

        {/* Chart */}
        {chartData && statistics && statistics.attempts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div style={{ height: "400px" }}>
              <Line options={chartOptions} data={chartData} />
            </div>
          </div>
        )}

        {/* Exam Logs List */}
        <ExamLogsList exams={recentExams} loading={loading} />

        {/* Action Button */}
        {statistics && (
          <div className="mt-8 flex justify-center">
            <Link
              to={`/live?id=${statistics.exam_id}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
            >
              <svg
                className="h-5 w-5 mr-2"
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
              Tag eksamen igen
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
