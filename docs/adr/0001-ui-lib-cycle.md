# ADR-0001 — Resolving the `@workspace/ui` ↔ `@workspace/lib` dependency cycle

- **Status:** Accepted
- **Date:** June 2026
- **Phase:** 4a (Foundations)
- **Deciders:** Implementation planning pass
- **Source:** Phase 3g (PR #3) hotfix, `.agents/plan/phase-3-plan.md` §7, `phase-4-plan.md` §2.1

---

## Context

Both `apps/admin` and `apps/storefront` import:

- `cn` from `@workspace/lib` (used for `clsx` + `twMerge`)
- i18n `t()` and `<StatusBadge>` (a status-aware badge with translations baked in) from `@workspace/ui`

To keep the design tokens and i18n strings shared between both apps, the packages were originally structured as:

```
@workspace/lib  ──imports cn()──▶  @workspace/ui
@workspace/ui   ──imports t()──▶  @workspace/lib
```

That produces a circular workspace dependency. Bun + Turborepo happened to resolve it at runtime (the resolvers tolerate cycles via in-memory caches), but the cycle is fragile:

- It blocks hoisting optimizations.
- It allows the ui package to "reach through" lib for translation strings, blurring the boundary between the design system and the app utilities.
- It silently broke in CI on a recent build (`phase-3` PR #3) where one half of the cycle was emitted as a TypeScript type import and the other half as a value import, producing a `tsc` error that did not surface locally.

We need a clean break.

## Decision

We split the i18n concern out of the design system:

- **`<StatusBadge>` no longer calls `t()`** — the admin layer passes a `label` prop with the already-resolved string. This is the minimum-blast-radius change.
- The `t()` helper, locale files, and locale registry stay in `@workspace/lib/i18n`.
- The shared `cn()` re-export from `@workspace/lib` → `@workspace/ui` is preserved (it is value-only, runs at app compile time, and the cycle direction is now one-way: `lib → ui`).

After the change, the dependency graph is:

```
@workspace/ui          (design system, no app-domain knowledge)
@workspace/lib  ──────▶ @workspace/ui   (cn re-export)
@workspace/lib  ◀──────  apps/*          (t, formatMMK, auth)
@workspace/ui   ◀──────  apps/*          (components)
@workspace/convex ─────▶ @workspace/lib  (auth, constants)
@workspace/convex ◀───── apps/*
```

The `lib → ui` edge is the only cycle-precursor dependency, and it is value-only and safe.

## Consequences

### Positive

- The graph is now a strict DAG. `tsc` and ESLint both validate it cleanly.
- `<StatusBadge>` is reusable in any app — it does not require the i18n bundle.
- Each app owns its own translation key → label mapping (`apps/admin/lib/order-status-label.ts` is the first such adapter). Adding a new status only touches that adapter and the `en.json` keys.

### Negative

- The badge is no longer a drop-in label-less component. Every call site must pass `label={orderStatusLabel(status)}` (or equivalent). This is a small ergonomic tax.
- The `cn` re-export at `packages/lib/src/cn.ts` keeps a one-way `lib → ui` edge. We considered inlining `cn` into `lib` (it is only `clsx + twMerge`) but the design system owns the token contract; a separate `cn` would need a parallel `twMerge` and token agreement.

### Trade-offs explicitly accepted

- **Two translation registries** (admin via `t('admin.*')`, storefront via `t('pdp.*')`) remain in the single `en.json` file. Keeping a single locale file is intentional: it makes the Phase 5 Burmese (`my.json`) drop-in trivial.

## Alternatives considered

- **Option B — move all i18n to `@workspace/ui`.** Rejected: the design system should not know about app domains (`admin.*`, `pdp.*`). It would force every other consumer of `ui` to ship a translation bundle, even the docs site.
- **Option C — inline `<StatusBadge>` in each app.** Rejected: it duplicates the badge between admin and storefront, which is one of the explicit "NEVER DO" rules in `AGENTS.md`.
- **Option D — extract i18n to a fourth package `@workspace/i18n`.** Rejected for the launch: it adds a workspace for one helper and ~6 keys. We can revisit if a third consumer appears.

## Exit path

If `<StatusBadge>` ever needs to call `t()` again (e.g. when a design-system demo page ships in the marketing site):

1. Extract `<StatusBadge>` into a new package `@workspace/ui-admin` (or similar) that depends on both `ui` and `lib`.
2. The storefront keeps `<StatusBadge>` from the new package only where it needs labels.
3. Re-evaluate whether to split i18n into a `@workspace/i18n` package at that point.

## Related

- Commit `210a9b9` — "fix(admin): #phase-3 — break @workspace/lib ↔ @workspace/ui cycle"
- `AGENTS.md` §"NEVER DO" rule #1 and §"MONOREPO STRUCTURE"
- `PRD.md` §3 (single unified design system)
- `phase-4-plan.md` §2.1
