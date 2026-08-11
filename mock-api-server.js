#!/usr/bin/env node
/**
 * Opsera Voyage — Local Mock API Server
 * Serves all frontend API endpoints with realistic mock data.
 * Run: node mock-api-server.js
 */

const http = require('http');
const PORT = 3008;

// ─── Mock data ────────────────────────────────────────────────────────────────
const releases = [
  { id: 'rel-001', name: 'checkout-service-v2.1', version: '2.1.0', status: 'completed', environment: 'production', gitRef: 'v2.1.0', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), approvedAt: new Date(Date.now() - 86400000).toISOString(), approvedBy: 'alice@opsera.io' },
  { id: 'rel-002', name: 'payment-service-v1.8', version: '1.8.3', status: 'in_progress', environment: 'staging', gitRef: 'v1.8.3', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'rel-003', name: 'auth-service-v3.0', version: '3.0.0', status: 'pending_approval', environment: 'production', gitRef: 'v3.0.0', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'rel-004', name: 'analytics-svc-v1.2', version: '1.2.1', status: 'failed', environment: 'staging', gitRef: 'v1.2.1', createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'rel-005', name: 'notification-v1.0', version: '1.0.0', status: 'draft', environment: 'development', gitRef: 'main', createdAt: new Date().toISOString() },
];

const auditRecords = [
  { id: 'a-001', event_type: 'release.created', actor_id: 'alice', resource_type: 'release', resource_id: 'rel-003', action: 'create', compliance_frameworks: ['SOX', 'SOC2'], event_timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 'a-002', event_type: 'release.approved', actor_id: 'bob', resource_type: 'release', resource_id: 'rel-001', action: 'approve', compliance_frameworks: ['SOX'], event_timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: 'a-003', event_type: 'policy.violated', actor_id: 'system', resource_type: 'policy', resource_id: 'p-001', action: 'evaluate', compliance_frameworks: ['PCI-DSS'], event_timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'a-004', event_type: 'user.login', actor_id: 'charlie', resource_type: 'user', resource_id: 'charlie', action: 'login', compliance_frameworks: ['SOC2'], event_timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 'a-005', event_type: 'release.deployed', actor_id: 'system', resource_type: 'release', resource_id: 'rel-001', action: 'deploy', compliance_frameworks: ['SOX', 'GDPR'], event_timestamp: new Date(Date.now() - 80000000).toISOString() },
];

const doraMetrics = {
  deploymentFrequency: 3.2,
  leadTimeHours: 4.5,
  changeFailureRate: 0.08,
  mttrHours: 1.2,
  level: 'high',
};

const riskTrends = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
  riskScore: Math.round(20 + Math.sin(i / 3) * 15 + Math.random() * 10),
  deploymentCount: Math.round(2 + Math.random() * 4),
}));

const doraTrends = Array.from({ length: 12 }, (_, i) => ({
  week: `W${(new Date()).getFullYear()}-${String(i + 1).padStart(2, '0')}`,
  deployments: Math.round(10 + Math.random() * 8),
  failures: Math.round(Math.random() * 3),
  avgLeadTimeHours: +(3 + Math.random() * 4).toFixed(1),
}));

const complianceRates = [
  { framework: 'SOX', rate: 0.96, passing: 96, total: 100 },
  { framework: 'SOC2', rate: 0.91, passing: 91, total: 100 },
  { framework: 'PCI-DSS', rate: 0.88, passing: 88, total: 100 },
  { framework: 'GDPR', rate: 0.94, passing: 94, total: 100 },
];

const teams = [
  { team: 'Platform', deploymentFrequency: 4.1, successRate: 0.95, avgRiskScore: 22 },
  { team: 'Checkout', deploymentFrequency: 2.8, successRate: 0.88, avgRiskScore: 38 },
  { team: 'Payments', deploymentFrequency: 1.2, successRate: 0.96, avgRiskScore: 18 },
  { team: 'Data', deploymentFrequency: 0.8, successRate: 0.98, avgRiskScore: 12 },
];

const users = [
  { id: 'u-001', email: 'alice@opsera.io', roles: ['admin', 'engineer'], active: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'u-002', email: 'bob@opsera.io', roles: ['auditor'], active: true, createdAt: '2024-02-01T00:00:00Z' },
  { id: 'u-003', email: 'charlie@opsera.io', roles: ['viewer'], active: true, createdAt: '2024-03-01T00:00:00Z' },
  { id: 'u-004', email: 'diana@opsera.io', roles: ['engineer'], active: false, createdAt: '2024-04-01T00:00:00Z' },
];

// ─── Router ───────────────────────────────────────────────────────────────────
function route(method, path, body) {
  // Auth
  if (path === '/api/v1/auth/me') return { id: 'user-local-001', sub: 'user-local-001', email: 'dev@opsera.io', name: 'Dev User', roles: ['Admin', 'Developer'], orgId: 'org-local' };
  if (path === '/api/v1/auth/token') return { access_token: 'mock-jwt-local', expires_in: 900 };

  // BFF Dashboard
  if (path === '/api/v1/bff/dashboard') return {
    totalReleases: releases.length,
    successRate: 0.87,
    avgRiskScore: 32,
    pendingApprovals: releases.filter(r => r.status === 'pending_approval').length,
    recentActivity: auditRecords.slice(0, 3).map(r => ({ type: r.event_type, description: `${r.action} on ${r.resource_type}`, timestamp: r.event_timestamp })),
    doraMetrics,
  };

  // Releases
  if (path === '/api/v1/releases' && method === 'GET') return releases;
  if (path.startsWith('/api/v1/releases/') && method === 'GET') {
    const id = path.split('/')[4];
    return releases.find(r => r.id === id) || null;
  }
  if (path === '/api/v1/releases' && method === 'POST') {
    const r = { id: `rel-${Date.now()}`, status: 'draft', createdAt: new Date().toISOString(), ...body };
    releases.push(r); return r;
  }
  if (path.includes('/approve')) return { approved: true, approversCount: 1, required: 1 };
  if (path.includes('/rollback')) return { success: true, releaseId: path.split('/')[4] };

  // Risk
  if (path.startsWith('/api/v1/risk/assess/')) return {
    releaseId: path.split('/')[5],
    overallScore: Math.round(20 + Math.random() * 60),
    riskLevel: 'medium',
    recommendation: 'review',
    factors: [
      { name: 'change_volume', weight: 0.2, score: 35, evidence: '350 lines changed' },
      { name: 'blast_radius', weight: 0.25, score: 24, evidence: '2 services affected' },
      { name: 'test_health', weight: 0.25, score: 0, evidence: 'All tests passing' },
      { name: 'historical_failure_rate', weight: 0.2, score: 10, evidence: '10% recent failure rate' },
      { name: 'deployment_timing', weight: 0.1, score: 0, evidence: 'Within deployment window' },
    ],
    assessedAt: new Date().toISOString(),
  };
  if (path === '/api/v1/risk/trends') return riskTrends;

  // Analytics
  if (path === '/api/v1/analytics/dora') return doraMetrics;
  if (path === '/api/v1/analytics/dora/trends') return doraTrends;
  if (path === '/api/v1/analytics/risk-trends') return riskTrends;
  if (path === '/api/v1/analytics/compliance-rates') return complianceRates;
  if (path === '/api/v1/analytics/teams') return teams;

  // Audit
  if (path === '/api/v1/audit') return auditRecords;

  // Policies
  if (path === '/api/v1/policies') return [
    { id: 'p-001', name: 'Block prod without tests', ruleType: 'block_production_without_tests', action: 'block', active: true },
    { id: 'p-002', name: 'Require approval', ruleType: 'require_approval', action: 'block', active: true },
    { id: 'p-003', name: 'Coverage > 80%', ruleType: 'require_minimum_coverage', conditions: { threshold: 80 }, action: 'warn', active: true },
  ];
  if (path === '/api/v1/policies/evaluate') return { releaseId: body?.releaseId, passed: true, violations: [], blocked: false, warnings: 0, evaluatedAt: new Date().toISOString() };

  // Users (admin)
  if (path === '/api/v1/users' && method === 'GET') return users;

  // Notifications
  if (path === '/api/v1/notifications/templates') return [
    { id: 'release-approved', eventType: 'release.approved', channel: 'slack' },
    { id: 'risk-critical', eventType: 'risk.critical', channel: 'pagerduty' },
  ];

  // Health
  if (path === '/api/v1/health' || path === '/health') return { status: 'ok', timestamp: new Date().toISOString() };

  return null;
}

// ─── Server ───────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    let parsedBody = {};
    try { if (body) parsedBody = JSON.parse(body); } catch {}

    const result = route(req.method, url.pathname, parsedBody);
    if (result !== null) {
      res.writeHead(result === null ? 404 : (req.method === 'POST' ? 201 : 200), { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ statusCode: 404, message: `Route not found: ${req.method} ${url.pathname}` }));
    }
    console.log(`${req.method} ${url.pathname} → ${result !== null ? 200 : 404}`);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Opsera Mock API Server running at http://localhost:${PORT}\n`);
  console.log('  Endpoints available:');
  console.log('  GET  /api/v1/health');
  console.log('  GET  /api/v1/releases');
  console.log('  GET  /api/v1/analytics/dora');
  console.log('  GET  /api/v1/analytics/compliance-rates');
  console.log('  GET  /api/v1/analytics/teams');
  console.log('  GET  /api/v1/audit');
  console.log('  GET  /api/v1/policies');
  console.log('  POST /api/v1/policies/evaluate');
  console.log('  GET  /api/v1/users');
  console.log('  GET  /api/v1/risk/trends');
  console.log('  POST /api/v1/risk/assess/:id\n');
});
