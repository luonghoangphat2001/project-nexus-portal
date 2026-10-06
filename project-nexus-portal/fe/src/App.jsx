import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleBasedRoute } from './routes/RoleBasedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { TopicsPage } from './pages/TopicsPage';
import { TeamsPage } from './pages/TeamsPage';
import { RegistrationsPage } from './pages/RegistrationsPage';
import { MatchmakingPage } from './pages/MatchmakingPage';
import { ProfilePage } from './pages/ProfilePage';
import { SystemAdminPage } from './pages/SystemAdminPage';
import { SecurityPage } from './pages/SecurityPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AcademicPage } from './pages/AcademicPage';
import { PeriodsPage } from './pages/PeriodsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProgressPage } from './pages/ProgressPage';
import { ReportsPage } from './pages/ReportsPage';
import { CouncilsPage } from './pages/CouncilsPage';
import { AssessmentsPage } from './pages/AssessmentsPage';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="academic" element={<AcademicPage />} />
            <Route path="periods" element={<PeriodsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="progress" element={<ProgressPage />} />

            {/* User Profile & Security Settings */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Academic & Thesis Management */}
            <Route path="topics" element={<TopicsPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="registrations" element={<RegistrationsPage />} />
            <Route path="matchmaking" element={<MatchmakingPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="councils" element={<CouncilsPage />} />
            <Route path="assessments" element={
              <RoleBasedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_PRINCIPAL', 'ROLE_TEACHER', 'ROLE_COUNCIL']}>
                <AssessmentsPage />
              </RoleBasedRoute>
            } />

            {/* Module 1: Admin & Faculty Staff Management */}
            <Route
              path="users"
              element={
                <RoleBasedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_PRINCIPAL', 'ROLE_TEACHER']}>
                  <UsersPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="roles"
              element={
                <RoleBasedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_PRINCIPAL', 'ROLE_TEACHER']}>
                  <RolesPage />
                </RoleBasedRoute>
              }
            />

            {/* Module 17: System Administration */}
            <Route
              path="admin/system"
              element={
                <RoleBasedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_PRINCIPAL']}>
                  <SystemAdminPage />
                </RoleBasedRoute>
              }
            />

            {/* Module 18: Security & Audit Logs */}
            <Route
              path="admin/security"
              element={
                <RoleBasedRoute requiredRole="ROLE_ADMIN">
                  <SecurityPage />
                </RoleBasedRoute>
              }
            />

            {/* Fallback for other nested paths */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Global 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
