import { NextResponse } from 'next/server';

const SENTRY_PROJECT_IDS = (process.env.SENTRY_PROJECT_IDS ?? '').split(',').filter(Boolean);

export async function POST(request: Request): Promise<Response> {
  try {
    const envelope = await request.text();
    const piece = envelope.split('\n')[0];
    if (!piece) {
      return NextResponse.json({ error: 'empty envelope' }, { status: 400 });
    }
    const header = JSON.parse(piece) as { dsn?: string };
    const dsn = header.dsn;
    if (!dsn) {
      return NextResponse.json({ error: 'missing dsn' }, { status: 400 });
    }
    if (SENTRY_PROJECT_IDS.length > 0) {
      let projectId: string | null = null;
      try {
        const parsed = new URL(dsn);
        projectId = parsed.pathname.replace(/^\//, '').split('/')[0] ?? null;
      } catch {
        projectId = null;
      }
      if (!projectId || !SENTRY_PROJECT_IDS.includes(projectId)) {
        return NextResponse.json({ error: 'project not allowed' }, { status: 403 });
      }
    }
    const url = `${dsn.endsWith('/') ? dsn : `${dsn}/`}envelope/?sentry_key=${process.env.SENTRY_PUBLIC_KEY ?? ''}&sentry_version=7`;
    const upstream = await fetch(url, {
      method: 'POST',
      body: envelope,
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
    });
    return new Response(null, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: 'tunnel failure' }, { status: 500 });
  }
}
