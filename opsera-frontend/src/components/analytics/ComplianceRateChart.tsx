/**
 * WO-070: Compliance rate visualization by framework
 * WO-071: Team analytics view
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { apiClient } from '../../auth/api-client.js';

interface ComplianceRate {
  framework: string;
  rate: number;
  passing: number;
  total: number;
}

interface TeamMetric {
  team: string;
  deploymentFrequency: number;
  successRate: number;
  avgRiskScore: number;
}

export function ComplianceRateChart() {
  const { data: rates = [] } = useQuery<ComplianceRate[]>({
    queryKey: ['compliance-rates'],
    queryFn: () => apiClient.get('/analytics/compliance-rates').then((r) => r.data),
    staleTime: 300_000,
  });

  const radarData = rates.map((r) => ({ framework: r.framework, rate: Math.round(r.rate * 100) }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Compliance by Framework</h3>
      {radarData.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="framework" tick={{ fontSize: 11 }} />
            <Radar name="Compliance %" dataKey="rate" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
            <Tooltip formatter={(v) => [`${v}%`, 'Compliance']} />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          No compliance data available
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {rates.map((r) => (
          <div key={r.framework} className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{r.framework}</span>
            <span className={`font-semibold ${r.rate >= 0.9 ? 'text-green-600' : r.rate >= 0.7 ? 'text-yellow-600' : 'text-red-600'}`}>
              {Math.round(r.rate * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamAnalyticsTable() {
  const { data: teams = [] } = useQuery<TeamMetric[]>({
    queryKey: ['team-analytics'],
    queryFn: () => apiClient.get('/analytics/teams').then((r) => r.data),
    staleTime: 300_000,
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">Team Performance</h3>
      </div>
      <table className="min-w-full divide-y divide-gray-50">
        <thead className="bg-gray-50">
          <tr>
            {['Team', 'Deploy Freq', 'Success Rate', 'Avg Risk'].map((h) => (
              <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {teams.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No data</td>
            </tr>
          ) : teams.map((t) => (
            <tr key={t.team} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm font-medium text-gray-900">{t.team}</td>
              <td className="px-4 py-2 text-sm text-gray-500">{t.deploymentFrequency}/day</td>
              <td className="px-4 py-2 text-sm text-gray-500">{Math.round(t.successRate * 100)}%</td>
              <td className="px-4 py-2 text-sm">
                <span className={`font-medium ${t.avgRiskScore >= 75 ? 'text-red-600' : t.avgRiskScore >= 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {t.avgRiskScore}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
