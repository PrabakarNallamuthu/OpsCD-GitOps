/**
 * WO-095: Frontend Routing with RBAC guards
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.js';
import { ProtectedRoute } from '../auth/ProtectedRoute.js';
import { useAuth } from '../auth/AuthContext.js';

const DashboardPage = lazy(() => import('../pages/DashboardPage.js'));
const ReleasesPage = lazy(() => import('../pages/ReleasesPage.js'));
const AuditPage = lazy(() => import('../pages/AuditPage.js'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage.js'));
const SettingsPage = lazy(() => import('../pages/SettingsPage.js'));
const LoginPage = lazy(() => import('../pages/LoginPage.js'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.js'));
const AccessDeniedPage = lazy(() => import('../pages/AccessDeniedPage.js'));

const Loader = () => (
  <div className="flex items-center justify-center h-screen text-sm text-gray-500">
    Loading...
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="releases" element={<ReleasesPage />} />
              <Route
                path="audit"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'auditor']}>
                    <AuditPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="analytics"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'viewer', 'engineer']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
