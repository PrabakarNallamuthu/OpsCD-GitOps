/**
 * k6 Load Test — Staging Environment
 * WO-013: Approval Gate + Multi-Environment Deployment
 * Target: 200 VUs, p95 latency < 500ms, error rate < 1%
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const releaseCreateDuration = new Trend('release_create_duration');
const riskAnalysisDuration = new Trend('risk_analysis_duration');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // ramp up
    { duration: '3m', target: 200 },  // sustained load
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://bff-service:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'X-Correlation-ID': `k6-load-${Date.now()}`,
};

export default function () {
  // 60% — Release list (most common dashboard load)
  if (Math.random() < 0.6) {
    const res = http.get(`${BASE_URL}/api/v1/releases?page=1&limit=20`, { headers });
    check(res, { 'releases list 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  }
  // 20% — Create release
  else if (Math.random() < 0.2) {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/v1/releases`,
      JSON.stringify({ name: `Load Test ${Date.now()}`, target_environment: 'staging' }),
      { headers },
    );
    releaseCreateDuration.add(Date.now() - start);
    check(res, { 'create release 201': (r) => r.status === 201 });
    errorRate.add(res.status !== 201);
  }
  // 20% — Get specific release
  else {
    const res = http.get(`${BASE_URL}/api/v1/releases/00000000-0000-0000-0000-000000000001`, {
      headers,
    });
    check(res, { 'release detail 2xx': (r) => r.status >= 200 && r.status < 300 });
    errorRate.add(res.status >= 400);
  }

  sleep(0.5 + Math.random());
}
