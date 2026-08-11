import React from 'react';
import { useAuth } from '../auth/AuthContext.js';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage system configuration</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Profile</h2>
        <dl className="space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">User ID</dt>
            <dd className="font-mono text-gray-700">{user?.sub ?? '—'}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Roles</dt>
            <dd className="text-gray-700">{user?.roles?.join(', ') ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
