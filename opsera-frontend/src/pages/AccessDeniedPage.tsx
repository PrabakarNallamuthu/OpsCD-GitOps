import React from 'react';
import { Link } from 'react-router-dom';

export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4">
      <div className="text-6xl font-bold text-red-200">403</div>
      <h1 className="text-2xl font-semibold text-gray-700">Access Denied</h1>
      <p className="text-gray-500 max-w-md">
        You do not have permission to access this page. Contact your administrator
        if you believe this is a mistake.
      </p>
      <Link
        to="/dashboard"
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
