# Backup and export

- **Status:** Active runbook
- **Phase:** 4e (production hardening)
- **Source:** PRD §11 (error handling), `phase-4-plan.md` §3.4e.4
- **Owner:** Release captain

---

This document is the runbook for backing up and restoring Convex data. The full export/restore implementation is a **Phase 5 follow-up** — this runbook describes the approach, the targets, and a stub for the dump action so the contract is fixed.

## What's backed up

The full Convex schema lives in `packages/convex/schema.ts`. Every table is in scope:

| Table           | Source          | Notes                                                                                                                                                                 |
| --------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`         | `schema.ts:26`  | Includes role, isActive, email, phone, createdAt.                                                                                                                     |
| `categories`    | `schema.ts:41`  | Tree; export preserves `parentId` and `sortOrder`.                                                                                                                    |
| `products`      | `schema.ts:55`  | Includes the embedded `colorVariants[]` array.                                                                                                                        |
| `cartItems`     | `schema.ts:75`  | Live carts; not critical to restore but cheap to include.                                                                                                             |
| `wishlistItems` | `schema.ts:87`  | Live wishlists.                                                                                                                                                       |
| `orders`        | `schema.ts:95`  | Snapshot items; the most important table to back up.                                                                                                                  |
| `storeSettings` | `schema.ts:138` | Singleton; only one row.                                                                                                                                              |
| `stockAudit`    | `schema.ts:161` | Audit log; not critical to restore.                                                                                                                                   |
| BA `user`, `session`, `account`, `verification`, `twoFactor`, `jwks`, `rateLimit` | BA component | Better Auth's internal tables, owned by the `@convex-dev/better-auth` component. **Not defined in `packages/convex/schema.ts`** — they live in the BA component's own schema and are not dumped manually. The parent app's `users` table carries `betterAuthUserId` as the join key to BA's `user` table; restore the parent app first, then re-issue sessions from the BA side. |

## What's NOT backed up

- **`_storage` files** (product images, hero image) — these are stored in Convex's managed file storage and are not part of the table dump. Convex's managed backup tier (paid plan) covers storage with the same RPO/RTO as the database.
- **Convex Auth internal tables** — see note above. (Legacy reference; the project now uses Better Auth. See the Better Auth row above.)
- **Vercel build artifacts and CDN cache** — Vercel manages these; the deploy is reproducible from the git SHA pinned in the release.

The RPO (recovery point objective) and RTO (recovery time objective) for the **managed Convex backup** (paid plan) are:

| Tier              | RPO  | RTO     |
| ----------------- | ---- | ------- |
| Convex Team       | 24 h | hours   |
| Convex Enterprise | 1 h  | minutes |

The exact numbers are in the Convex contract; the values above are the order of magnitude. If you need stronger guarantees, run a manual export on the cadence below.

## Frequency

- **Daily** — Convex managed backup (automatic on the paid plan).
- **Weekly** — manual `dump` action output stored in S3 (or a GitHub repo's `backups/` directory for the first pass).
- **On every schema migration** — manual dump before the deploy so we can roll the data back alongside the schema.

## Retention

- **Daily** backups: 30 days.
- **Weekly** exports: 1 year.
- **Pre-migration** snapshots: keep the two most recent for the active production deployment; archive older ones to cold storage.

## Export

### Target contract

The dump is a JSON object keyed by table name. Each value is an array of documents. `_id` and `createdAt` are preserved so a restore can (best-effort) keep stable IDs.

```jsonc
{
  "exportedAt": 1748000000000,
  "convexDeployment": "prod:khit",
  "tables": {
    "users": [
      {
        "_id": "...",
        "email": "...",
        "role": "admin",
        "isActive": true,
        "createdAt": 1747000000000,
      },
    ],
    "categories": [{ "_id": "...", "slug": "men", "parentId": null, "sortOrder": 10 }],
    "products": [
      {
        "_id": "...",
        "slug": "oxford-classic-white",
        "colorVariants": [
          /* embedded */
        ],
      },
    ],
    "orders": [
      /* snapshot items intact */
    ],
    "storeSettings": [{ "_id": "...", "heroTitle": "..." }],
    "cartItems": [],
    "wishlistItems": [],
    "stockAudit": [],
  },
}
```

### Stub: `packages/convex/scripts/dump.ts`

The implementation lands in Phase 5. The action shape is fixed below — copy this into `packages/convex/scripts/dump.ts` when the work starts.

```ts
import { v } from 'convex/values';
import { action } from '../_generated/server';
import { internal } from '../_generated/api';

const TABLES = [
  'users',
  'categories',
  'products',
  'cartItems',
  'wishlistItems',
  'orders',
  'storeSettings',
  'stockAudit',
] as const;

export const dump = action({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Guard: only allow if the caller passes the same SHARED_DUMP_TOKEN
    // configured in the production env. The token is checked out-of-band
    // (curl -H "Authorization: Bearer $DUMP_TOKEN" ...).
    if (args.token !== process.env.DUMP_TOKEN) {
      throw new Error('Unauthorized');
    }

    const tables: Record<string, unknown[]> = {};
    for (const table of TABLES) {
      // Use ctx.runQuery over a single internal query that takes the table
      // name as an arg. (Convex actions cannot call ctx.db directly.)
      tables[table] = await ctx.runQuery(internal.dumpInternal.collectTable, { table });
    }

    return {
      exportedAt: Date.now(),
      convexDeployment: process.env.CONVEX_DEPLOYMENT ?? 'unknown',
      tables,
    };
  },
});
```

The matching `dumpInternal.collectTable` is a single internal query that does `ctx.db.query(table).collect()`. **This is the only place in the codebase that should accept a table name as an argument** — guard it carefully and keep the function internal (not callable from a public mutation).

### Run the dump

```bash
# Local
bunx convex run scripts/dump --token "$DUMP_TOKEN" > backups/$(date -u +%Y%m%d).json

# Production
CONVEX_DEPLOY_KEY=... bunx convex run scripts/dump --token "$DUMP_TOKEN" \
  --deployment prod:khit > backups/$(date -u +%Y%m%d).json
```

Upload the resulting file to S3 / GitHub with the date in the path:

```
s3://khit-backups/convex/weekly/2026-W25.json
```

## Restore

Restore is the inverse of dump. The same `_id` is used; if the table already has a document with that `_id`, the restore skips it (idempotent).

### Stub: `packages/convex/scripts/restore.ts`

```ts
import { v } from 'convex/values';
import { action } from '../_generated/server';
import { internal } from '../_generated/api';

const TABLES = [
  'categories',
  'products',
  'cartItems',
  'wishlistItems',
  'orders',
  'storeSettings',
  'stockAudit',
  'users',
] as const;

export const restore = action({
  args: { token: v.string(), dump: v.any() },
  handler: async (ctx, args) => {
    if (args.token !== process.env.DUMP_TOKEN) {
      throw new Error('Unauthorized');
    }

    const tables = (args.dump.tables ?? {}) as Record<string, unknown[]>;
    for (const table of TABLES) {
      const rows = tables[table] ?? [];
      await ctx.runMutation(internal.restoreInternal.insertTable, { table, rows });
    }

    return { restoredAt: Date.now() };
  },
});
```

### Known limitations

Convex's `ctx.db.insert` returns a new `_id`; the original `_id` cannot be set directly. The stub above inserts each row with a new ID and copies the original `_id` and `createdAt` into a `_legacyId` and `_legacyCreatedAt` field. Foreign keys (`categoryId`, `userId`, `orderId`, etc.) are not auto-rewired.

For **true point-in-time recovery** with stable IDs, the recommended path is to use the **Convex shadow table** feature (when available) or to restore into a fresh deployment and swap DNS. Treat manual restore as a best-effort recovery, not a transactional one. For most incidents, the managed Convex backup + a Vercel rollback is faster and safer.

## Test restore

**Quarterly** — pick a recent weekly export, spin up a fresh Convex deployment (free tier is fine), restore into it, and confirm:

1. The eight sample products are present (or the last published catalog if you ran the seed before).
2. The most recent 10 orders appear with their snapshot items intact.
3. The `storeSettings` singleton is restored (hero, sale banner, contact, pickup).

Schedule the test for the first Monday of each quarter; block 1 hour. Log results in the `#ops` channel.

## Open items (Phase 5)

- Implement the `dump` and `restore` actions.
- Add the `DUMP_TOKEN` env var to `.env.example` (and to the Vercel env list).
- Wire an S3 client (or equivalent) for the weekly push.
- Decide on the Better Auth tables policy. The BA `user`, `session`, `account`, `verification`, `twoFactor`, `jwks`, and `rateLimit` tables live in the BA component and are not directly queryable from the parent app. Recommended policy: **do not restore; rely on Better Auth's own password-reset flow to re-issue sessions after a restore**. The parent app's `users` table (with `betterAuthUserId`) is restored; the BA `user` row is created on first sign-in if missing.

## Related

- `docs/operations/production-deploy.md`
- `docs/operations/production-admin-seed.md`
- `packages/convex/schema.ts`
- `packages/convex/seed.ts`
- PRD §11
