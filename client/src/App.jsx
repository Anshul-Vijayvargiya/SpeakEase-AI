import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import useAuthStore from "./store/authStore";

// Components & Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ResumeUploadPage from "./pages/ResumeUploadPage";
import TargetRolePage from "./pages/TargetRolePage";
import InterviewSetupPage from "./pages/InterviewSetupPage";
import InterviewPage from "./pages/InterviewPage";
import ReportDashboard from "./pages/ReportDashboard";
import PracticeDashboard from "./pages/PracticeDashboard";
import ProcessingPage from "./pages/ProcessingPage"; // Will be created in Phase 5
import HistoryPage from "./pages/HistoryPage";
import ResumeAnalysisPage from "./pages/ResumeAnalysisPage";
import SettingsPage from "./pages/SettingsPage";
import AptitudePage from "./pages/AptitudePage";
import SQLTestSetupPage from "./pages/SQLTestSetupPage";
import SQLTestPage from "./pages/SQLTestPage";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
};

function App() {
  const { isAuthenticated, checkAuth, loading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);


  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-white font-sans text-slate-900">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
          <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/setup/role" element={<ProtectedRoute><TargetRolePage /></ProtectedRoute>} />
          <Route path="/setup/resume" element={<ProtectedRoute><ResumeUploadPage /></ProtectedRoute>} />
          <Route path="/setup/check" element={<ProtectedRoute><InterviewSetupPage /></ProtectedRoute>} />
          <Route path="/interview/:id" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
          <Route path="/processing/:id" element={<ProtectedRoute><ProcessingPage /></ProtectedRoute>} />
          <Route path="/report/:id" element={<ProtectedRoute><ReportDashboard /></ProtectedRoute>} />
          <Route path="/practice/:topicId" element={<ProtectedRoute><PracticeDashboard /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/resume" element={<ProtectedRoute><ResumeAnalysisPage /></ProtectedRoute>} />
          <Route path="/aptitude" element={<ProtectedRoute><AptitudePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/sql-setup" element={<ProtectedRoute><SQLTestSetupPage /></ProtectedRoute>} />
          <Route path="/sql-test/:sessionId" element={<ProtectedRoute><SQLTestPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;