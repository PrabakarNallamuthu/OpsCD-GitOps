/**
 * WO-075: RBAC and Tenant Management Admin Page
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../auth/api-client.js';

interface User {
  id: string;
  email: string;
  roles: string[];
  active: boolean;
  createdAt: string;
}

const ALL_ROLES = ['admin', 'engineer', 'auditor', 'viewer'];

export function RbacAdminPage() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRoles, setNewRoles] = useState<string[]>([]);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.get('/users').then((r) => r.data),
    staleTime: 30_000,
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      apiClient.patch(`/users/${userId}/roles`, { roles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      apiClient.patch(`/users/${userId}/${active ? 'activate' : 'deactivate'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User & RBAC Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage users, roles, and access control</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Email', 'Roles', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400 animate-pulse">
                  Loading users…
                </td>
              </tr>
            ) : users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {user.roles.map((r) => (
                      <span key={r} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{r}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => { setSelectedUser(user); setNewRoles(user.roles); }}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Edit Roles
                  </button>
                  <button
                    onClick={() => toggleActiveMutation.mutate({ userId: user.id, active: !user.active })}
                    className={`text-xs px-2 py-1 rounded ${user.active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {user.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 space-y-4">
            <h3 className="font-semibold text-gray-800">Edit roles for {selectedUser.email}</h3>
            <div className="space-y-2">
              {ALL_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoles.includes(role)}
                    onChange={(e) =>
                      setNewRoles((prev) => e.target.checked ? [...prev, role] : prev.filter((r) => r !== role))
                    }
                    className="w-4 h-4"
                  />
                  {role}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateRolesMutation.mutate({ userId: selectedUser.id, roles: newRoles })}
                disabled={updateRolesMutation.isPending}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {updateRolesMutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
