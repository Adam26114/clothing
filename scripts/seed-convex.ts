#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../packages/convex/_generated/api.js';

function loadEnvFile(path: string): void {
  try {
    const content = readFileSync(path, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }
      const eq = line.indexOf('=');
      if (eq === -1) {
        continue;
      }
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore missing or unreadable file
  }
}

const here = dirname(new URL(import.meta.url).pathname);
const repoRoot = join(here, '..');
loadEnvFile(join(repoRoot, '.env'));
loadEnvFile(join(repoRoot, '.env.local'));
loadEnvFile(join(repoRoot, 'packages', 'convex', '.env'));
loadEnvFile(join(repoRoot, 'packages', 'convex', '.env.local'));

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
if (!convexUrl) {
  console.error('Missing NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL). Set it in .env or .env.local.');
  process.exit(1);
}

if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
  console.warn('SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set — admin seed will be skipped.');
}

const force = process.argv.includes('--force');
const resetPassword = process.argv.includes('--reset-password');

const client = new ConvexHttpClient(convexUrl);

try {
  if (resetPassword) {
    const result = await client.action(api.seed.resetAdminPassword, {});
    console.log('Password reset:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  const result = await client.action(api.seed.run, { force });
  console.log('Seed complete:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Seed failed:', error);
  process.exit(1);
}
