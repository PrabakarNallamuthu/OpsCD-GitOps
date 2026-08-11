import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiClient } from '../auth/api-client.js';

interface RiskTrend {
  date: string;
  riskScore: number;
  deploymentCount: number;
}

export default function AnalyticsPage() {
  const { data: trends = [], isLoading } = useQuery<RiskTrend[]>({
    queryKey: ['risk-trends'],
    queryFn: () => apiClient.get('/analytics/risk-trends').then((r) => r.data),
    staleTime: 300_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Risk trends and deployment insights</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Risk Score Over Time</h2>
        {isLoading ? (
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="riskScore" stroke="#ef4444" name="Risk Score" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="deploymentCount" stroke="#3b82f6" name="Deployments" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
