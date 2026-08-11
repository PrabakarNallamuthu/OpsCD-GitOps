import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.js';

interface ProtectedRouteProps {
  requiredRoles?: string[];
  children?: React.ReactNode;
}

export function ProtectedRoute({ requiredRoles, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((r) => user.roles?.includes(r));
    if (!hasRole) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
