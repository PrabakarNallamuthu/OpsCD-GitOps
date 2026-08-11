/**
 * WO-069: DORA metrics dashboard component
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { apiClient } from '../../auth/api-client.js';

interface DoraMetrics {
  deploymentFrequency: number;
  leadTimeHours: number;
  changeFailureRate: number;
  mttrHours: number;
  level: 'elite' | 'high' | 'medium' | 'low';
}

interface TrendPoint {
  week: string;
  deployments: number;
  failures: number;
}

const LEVEL_STYLES: Record<string, string> = {
  elite: 'text-green-700 bg-green-100 border-green-200',
  high: 'text-blue-700 bg-blue-100 border-blue-200',
  medium: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  low: 'text-red-700 bg-red-100 border-red-200',
};

export function DoraMetricsDashboard() {
  const { data: metrics } = useQuery<DoraMetrics>({
    queryKey: ['dora-metrics'],
    queryFn: () => apiClient.get('/analytics/dora').then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: trends = [] } = useQuery<TrendPoint[]>({
    queryKey: ['dora-trends'],
    queryFn: () => apiClient.get('/analytics/dora/trends').then((r) => r.data),
    staleTime: 300_000,
  });

  return (
    <div className="space-y-6">
      {metrics && (
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-gray-500">Performance level:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${LEVEL_STYLES[metrics.level] ?? ''}`}>
            {metrics.level.toUpperCase()}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Deploy Freq', value: metrics?.deploymentFrequency, unit: '/day' },
          { label: 'Lead Time', value: metrics?.leadTimeHours, unit: 'hrs' },
          { label: 'Change Failure', value: metrics ? `${(metrics.changeFailureRate * 100).toFixed(1)}%` : '—', unit: '' },
          { label: 'MTTR', value: metrics?.mttrHours, unit: 'hrs' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{m.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {m.value ?? '—'}<span className="text-sm font-normal text-gray-400 ml-1">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {trends.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Deployment & Failure Trend (12 weeks)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="deployGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="deployments" stroke="#3b82f6" fill="url(#deployGradient)" name="Deployments" />
              <Area type="monotone" dataKey="failures" stroke="#ef4444" fill="url(#failGradient)" name="Failures" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
