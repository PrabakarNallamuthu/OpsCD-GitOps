import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../auth/api-client.js';

interface DoraMetrics {
  deploymentFrequency: number;
  leadTimeHours: number;
  changeFailureRate: number;
  mttrHours: number;
}

function MetricCard({ label, value, unit, trend }: { label: string; value: string | number; unit?: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">
        {value}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: dora, isLoading } = useQuery<DoraMetrics>({
    queryKey: ['dora-metrics'],
    queryFn: () => apiClient.get('/analytics/dora').then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Release Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">DORA metrics and deployment health</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Deployment Frequency" value={dora?.deploymentFrequency ?? '—'} unit="/day" />
          <MetricCard label="Lead Time" value={dora?.leadTimeHours ?? '—'} unit="hrs" />
          <MetricCard label="Change Failure Rate" value={dora?.changeFailureRate != null ? `${(dora.changeFailureRate * 100).toFixed(1)}%` : '—'} />
          <MetricCard label="MTTR" value={dora?.mttrHours ?? '—'} unit="hrs" />
        </div>
      )}
    </div>
  );
}
