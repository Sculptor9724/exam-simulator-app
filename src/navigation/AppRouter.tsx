import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../features/landing/pages/LandingPage";
import AIExaminerPage from "../features/ai-examiner/pages/AIExaminer";
import Dashboard from "../features/dashboard/pages/Dashboard";
import ExamsPage from "../features/exams/pages/ExamsPage";
import ExamEditor from "../features/exams/pages/ExamEditor";
import ExamFinished from "../features/exams/pages/ExamFinished";
import Classes from "../features/classes/pages/Classes";
import ClassEditor from "../features/classes/pages/ClassEditor";
import ClassDetails from "../features/classes/pages/ClassDetails";
import StudentResults from "../features/exams/pages/StudentResults";
import ExamStatistics from "../features/exams/pages/ExamStatistics";
import JoinClass from "../features/classes/pages/JoinClass";
import ProfilePage from "../features/profile/pages/ProfilePage";
import { ExamSimulatorProvider } from "../shared/contexts/ExamSimulatorContext";

import { AuthProvider } from "../features/auth/contexts/AuthContext";
import { ProtectedRoute } from "../features/auth/pages/ProtectedRoute";
import LoginPage from "../features/auth/pages/Login";
import SignupPage from "../features/auth/pages/Signup";
import WaitlistPage from "../features/landing/pages/WaitlistPage";

const basename = new URL(process.env.PUBLIC_URL || "", window.location.origin)
  .pathname;

// The authentication is created via anthropic: https://claude.ai/chat/563676a5-b56e-40d3-b58e-4e33ccaf962f
export function AppRouter() {
  return (
    <AuthProvider>
      <ExamSimulatorProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/create" element={<ExamEditor />} />
              <Route path="/exam" element={<ExamEditor />} />
              <Route path="/exam-finished" element={<ExamFinished />} />
              <Route path="/live" element={<AIExaminerPage />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/class/:id" element={<ClassDetails />} />
              <Route path="/student-results" element={<StudentResults />} />
              <Route path="/exam-statistics" element={<ExamStatistics />} />
              <Route path="/class-editor" element={<ClassEditor />} />
              <Route path="/class-editor/:id" element={<ClassEditor />} />
              <Route path="/join/:joinCode" element={<JoinClass />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ExamSimulatorProvider>
    </AuthProvider>
  );
}
