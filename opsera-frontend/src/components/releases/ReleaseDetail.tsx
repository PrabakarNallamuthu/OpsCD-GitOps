/**
 * WO-067: Release detail view with approval, rollback actions
 * WO-068: Release status timeline
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../auth/api-client.js';

interface Release {
  id: string;
  name: string;
  version: string;
  status: string;
  environment: string;
  gitRef?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rolledBackAt?: string;
  rollbackReason?: string;
}

interface RiskAssessment {
  overallScore: number;
  riskLevel: string;
  recommendation: string;
  factors: Array<{ name: string; score: number; evidence?: string }>;
}

const STATUS_STEPS = ['draft', 'pending_approval', 'approved', 'in_progress', 'completed'];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const idx = STATUS_STEPS.indexOf(currentStatus);
  return (
    <div className="flex items-center gap-1 mt-4">
      {STATUS_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div className={`flex flex-col items-center ${i <= idx ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-3 h-3 rounded-full ${i < idx ? 'bg-green-500' : i === idx ? 'bg-blue-500 ring-2 ring-blue-200' : 'bg-gray-300'}`} />
            <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{step.replace('_', ' ')}</span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 ${i < idx ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  high: 'text-orange-600 bg-orange-50',
  critical: 'text-red-600 bg-red-50',
};

interface Props {
  releaseId: string;
}

export function ReleaseDetail({ releaseId }: Props) {
  const queryClient = useQueryClient();
  const [rollbackReason, setRollbackReason] = useState('');

  const { data: release, isLoading } = useQuery<Release>({
    queryKey: ['release', releaseId],
    queryFn: () => apiClient.get(`/releases/${releaseId}`).then((r) => r.data),
  });

  const { data: risk } = useQuery<RiskAssessment>({
    queryKey: ['risk', releaseId],
    queryFn: () => apiClient.get(`/risk/assess/${releaseId}`).then((r) => r.data),
    enabled: !!releaseId,
  });

  const approveMutation = useMutation({
    mutationFn: () => apiClient.post(`/releases/${releaseId}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['release', releaseId] }),
  });

  const rollbackMutation = useMutation({
    mutationFn: () => apiClient.post(`/releases/${releaseId}/rollback`, { reason: rollbackReason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['release', releaseId] }),
  });

  if (isLoading || !release) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{release.name}</h2>
            <p className="text-sm text-gray-500 font-mono mt-1">{release.version} · {release.environment}</p>
          </div>
          {risk && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${RISK_COLORS[risk.riskLevel] ?? 'text-gray-600 bg-gray-50'}`}>
              Risk: {risk.riskLevel} ({risk.overallScore})
            </span>
          )}
        </div>

        <StatusTimeline currentStatus={release.status} />
      </div>

      {risk && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Risk Factors</h3>
          <div className="space-y-2">
            {risk.factors.map((f) => (
              <div key={f.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{f.name.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${f.score >= 75 ? 'bg-red-400' : f.score >= 50 ? 'bg-yellow-400' : 'bg-green-400'}`}
                      style={{ width: `${f.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{f.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {release.status === 'pending_approval' && (
          <button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
          >
            {approveMutation.isPending ? 'Approving…' : 'Approve Release'}
          </button>
        )}

        {['completed', 'failed', 'in_progress'].includes(release.status) && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Rollback reason…"
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <button
              onClick={() => rollbackMutation.mutate()}
              disabled={!rollbackReason || rollbackMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              {rollbackMutation.isPending ? 'Rolling back…' : 'Rollback'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
