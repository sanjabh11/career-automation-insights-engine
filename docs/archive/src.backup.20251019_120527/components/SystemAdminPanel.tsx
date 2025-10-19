
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemHealthMonitor } from './SystemHealthMonitor';
import { RateLimitDisplay } from './RateLimitDisplay';
import { useSession } from '@/hooks/useSession';
import { searchRateLimiter, apoRateLimiter, exportRateLimiter, checkRateLimit } from '@/utils/rateLimiting';

// New: Show missing API key/secret health reminder
const requiredSecrets = [
  { name: 'ONET_API_KEY', label: 'O*NET API Key' },
  { name: 'GOOGLE_AI_API_KEY', label: 'Google AI Key' },
  { name: 'SERPAPI_KEY', label: 'SERP API Key' }
];

// We don't have a way to fetch secrets directly in the frontend, so prompt user
function SecretsHealthReminder() {
  // We'll just always show the reminder for audit purposes; in reality, backend would check.
  return (
    <div className="mb-2 p-2 border rounded bg-yellow-50 text-yellow-800">
      <strong>Deployment Reminder:</strong> Please make sure the following secrets are set in Supabase:
      <ul className="pl-5 list-disc">
        {requiredSecrets.map(secret =>
          <li key={secret.name}>{secret.label} (<code>{secret.name}</code>)</li>
        )}
      </ul>
      Missing secrets will break some API integrations. 
    </div>
  );
}

export function SystemAdminPanel() {
  const { user } = useSession();

  if (!user) return null;

  const searchStatus = checkRateLimit(searchRateLimiter, user.id);
  const apoStatus = checkRateLimit(apoRateLimiter, user.id);
  const exportStatus = checkRateLimit(exportRateLimiter, user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">System Monitoring</h2>
        <p className="text-gray-600">Monitor system health and rate limits</p>
      </div>

      <SecretsHealthReminder />

      <SystemHealthMonitor />

      <Card>
        <CardHeader>
          <CardTitle>Rate Limits Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RateLimitDisplay
            remaining={searchStatus.remaining}
            total={20}
            resetTime={searchStatus.resetTime}
            timeUntilReset={searchStatus.timeUntilReset}
            label="Search Requests"
            variant="search"
          />
          
          <RateLimitDisplay
            remaining={apoStatus.remaining}
            total={5}
            resetTime={apoStatus.resetTime}
            timeUntilReset={apoStatus.timeUntilReset}
            label="APO Analyses"
            variant="analysis"
          />
          
          <RateLimitDisplay
            remaining={exportStatus.remaining}
            total={10}
            resetTime={exportStatus.resetTime}
            timeUntilReset={exportStatus.timeUntilReset}
            label="Export Operations"
            variant="export"
          />
        </CardContent>
      </Card>
    </div>
  );
}
