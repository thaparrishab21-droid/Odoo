import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-darkbg-950">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <span className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Loading your profile...</span>
      </div>
    );
  }

  if (!token || !user) {
    // Redirect to login page and keep track of intended location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for this role, redirect to root dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
