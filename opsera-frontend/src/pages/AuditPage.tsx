import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../auth/api-client.js';

interface AuditRecord {
  id: string;
  event_type: string;
  actor_id: string;
  resource_type: string;
  action: string;
  event_timestamp: string;
  compliance_frameworks: string[];
}

export default function AuditPage() {
  const { data: records = [], isLoading } = useQuery<AuditRecord[]>({
    queryKey: ['audit-records'],
    queryFn: () => apiClient.get('/audit').then((r) => r.data),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">Immutable SHA-256 chained audit trail</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Event', 'Actor', 'Resource', 'Action', 'Frameworks', 'Timestamp'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-xs font-mono text-blue-700">{r.event_type}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 font-mono truncate max-w-32">{r.actor_id}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{r.resource_type}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">{r.action}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {r.compliance_frameworks.map((f) => (
                        <span key={f} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{f}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-400">
                    {new Date(r.event_timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
