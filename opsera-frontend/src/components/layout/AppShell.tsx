/**
 * WO-066: Role-Based Navigation Shell and Route Guards
 * AppShell with role-filtered sidebar navigation, responsive layout.
 */
import React, { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../../auth/AuthContext.js';

interface NavItem {
  label: string;
  path: string;
  roles: Role[];
  icon: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_CONFIG: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', roles: ['Developer', 'ReleaseManager', 'SRE', 'Leadership', 'Auditor', 'Admin'], icon: '📊' },
    ],
  },
  {
    group: 'Releases',
    items: [
      { label: 'All Releases', path: '/releases', roles: ['Developer', 'ReleaseManager', 'SRE', 'Leadership', 'Auditor', 'Admin'], icon: '🚀' },
      { label: 'Create Release', path: '/releases/new', roles: ['ReleaseManager', 'Admin'], icon: '➕' },
    ],
  },
  {
    group: 'Risk & Policy',
    items: [
      { label: 'Risk Analysis', path: '/risk', roles: ['ReleaseManager', 'SRE', 'Leadership', 'Admin'], icon: '⚠️' },
      { label: 'Policy Rules', path: '/policies', roles: ['Admin'], icon: '📋' },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { label: 'DORA Metrics', path: '/analytics', roles: ['SRE', 'Leadership', 'Admin'], icon: '📈' },
    ],
  },
  {
    group: 'Compliance',
    items: [
      { label: 'Audit Trail', path: '/audit', roles: ['Auditor', 'Leadership', 'Admin'], icon: '🔍' },
      { label: 'Export Evidence', path: '/audit/export', roles: ['Auditor', 'Admin'], icon: '📥' },
    ],
  },
  {
    group: 'Administration',
    items: [
      { label: 'User Management', path: '/admin/users', roles: ['Admin'], icon: '👥' },
      { label: 'SSO Configuration', path: '/admin/sso', roles: ['Admin'], icon: '🔐' },
    ],
  },
];

function usePermission(...roles: Role[]): boolean {
  const { hasRole } = useAuth();
  return hasRole(...roles);
}

export function AppShell() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/auth/login');
  }, [logout, navigate]);

  const filteredNav = NAV_CONFIG.map((group) => ({
    ...group,
    items: group.items.filter((item) => user?.roles.some((r) => item.roles.includes(r as Role))),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-30 transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-700">
          <span className="text-xl font-bold text-blue-400">Opsera</span>
          <span className="text-xs text-gray-400">Voyage</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {filteredNav.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {group.group}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                          ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
                      }
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.roles[0]}</p>
            </div>
          </div>
          <button
            onClick={() => void handleLogout()}
            className="w-full text-left text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1 text-gray-600 hover:text-gray-900"
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {user?.roles.map((role) => (
              <span
                key={role}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
              >
                {role}
              </span>
            ))}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Re-export for use in router
export { usePermission };
