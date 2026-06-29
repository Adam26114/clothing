import { action } from './_generated/server';
import { api } from './_generated/api';
import {} from './authHelpers';

const SENTRY_API_BASE = 'https://sentry.io/api/0';

export interface SentryStats {
  configured: boolean;
  issuesLast24h: number | null;
  errorRate: number | null;
  unresolvedIssues: number | null;
  fetchedAt: number;
}

interface SentryIssue {
  id: string;
  count?: string | number;
  lastSeen?: string;
}

interface SentryStatsResponse {
  issues?: SentryIssue[];
  total?: number;
}

export const sentryStats = action({
  args: {},
  handler: async (ctx): Promise<SentryStats> => {
    const user = await ctx.runQuery(api.users.getMe, {});
    if (!user) {
      throw new Error('Not authenticated');
    }
    if (user.role !== 'admin' && user.role !== 'super-admin') {
      throw new Error('Forbidden: admin role required');
    }

    const authToken = process.env.SENTRY_AUTH_TOKEN;
    const org = process.env.SENTRY_ORG;
    const project = process.env.SENTRY_PROJECT;

    if (!authToken || !org || !project) {
      return {
        configured: false,
        issuesLast24h: null,
        errorRate: null,
        unresolvedIssues: null,
        fetchedAt: Date.now(),
      };
    }

    const headers = {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    } as const;

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const url24h = `${SENTRY_API_BASE}/projects/${org}/${project}/issues/?query=firstSeen:%3E${encodeURIComponent(
      since24h
    )}&limit=100`;

    const issuesRes = await fetch(url24h, { headers });
    if (!issuesRes.ok) {
      throw new Error(`Sentry API ${issuesRes.status}: ${await issuesRes.text()}`);
    }
    const issuesBody = (await issuesRes.json()) as SentryIssue[] | SentryStatsResponse;
    const issues: SentryIssue[] = Array.isArray(issuesBody)
      ? issuesBody
      : (issuesBody.issues ?? []);
    const issuesLast24h = issues.length;

    const unresolvedRes = await fetch(
      `${SENTRY_API_BASE}/projects/${org}/${project}/issues/?query=is:unresolved&limit=1`,
      { headers }
    );
    let unresolvedIssues: number | null = null;
    if (unresolvedRes.ok) {
      const body = (await unresolvedRes.json()) as SentryIssue[] | SentryStatsResponse;
      unresolvedIssues = Array.isArray(body)
        ? body.length
        : (body.total ?? body.issues?.length ?? null);
    }

    const statsRes = await fetch(
      `${SENTRY_API_BASE}/projects/${org}/${project}/stats/?stat=received&since=${Math.floor(
        (Date.now() - 24 * 60 * 60 * 1000) / 1000
      )}&until=${Math.floor(Date.now() / 1000)}&resolution=1h`,
      { headers }
    );
    let errorRate: number | null = null;
    if (statsRes.ok) {
      const buckets = (await statsRes.json()) as Array<[number, number]>;
      errorRate = buckets.reduce((sum, [, count]) => sum + (count ?? 0), 0);
    }

    return {
      configured: true,
      issuesLast24h,
      errorRate,
      unresolvedIssues: typeof unresolvedIssues === 'number' ? unresolvedIssues : null,
      fetchedAt: Date.now(),
    };
  },
});
