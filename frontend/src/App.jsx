import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClassDetail from "./pages/teacher/TeacherClassDetail";
import TeacherSessionDetail from "./pages/teacher/TeacherSessionDetail";
import TeacherReport from "./pages/teacher/TeacherReport";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentClassDetail from "./pages/student/StudentClassDetail";
import StudentAttendanceHistory from "./pages/student/StudentAttendanceHistory";
import StudentScanQR from "./pages/student/StudentScanQR";

import { useAuth } from "./context/AuthContext";

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            user.role === "TEACHER" ? (
              <Navigate to="/teacher" replace />
            ) : (
              <Navigate to="/student" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/login" element={<LoginPage />} />

      {/* TEACHER */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute role="TEACHER">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classes/:id"
        element={
          <ProtectedRoute role="TEACHER">
            <TeacherClassDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/sessions/:sessionId"
        element={
          <ProtectedRoute role="TEACHER">
            <TeacherSessionDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classes/:id/report"
        element={
          <ProtectedRoute role="TEACHER">
            <TeacherReport />
          </ProtectedRoute>
        }
      />
      <Route path="/teacher/report" element={<Navigate to="/teacher" replace />} />

      {/* STUDENT */}
      <Route
        path="/student"
        element={
          <ProtectedRoute role="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/classes/:id"
        element={
          <ProtectedRoute role="STUDENT">
            <StudentClassDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/classes/:id/attendance"
        element={
          <ProtectedRoute role="STUDENT">
            <StudentAttendanceHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/scan"
        element={
          <ProtectedRoute role="STUDENT">
            <StudentScanQR />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div>
      <Navbar />
      <div className="container">
        <AppRoutes />
      </div>
    </div>
  );
}
