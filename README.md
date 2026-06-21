# Khit E-Commerce Platform

A Myanmar local brand shirt e-commerce platform built as a Turborepo monorepo with Bun.

## Apps

- `apps/storefront` — customer-facing Next.js app (port `3000`)
- `apps/admin` — admin panel Next.js app (port `3001`)

## Shared packages

- `packages/ui` — shadcn/ui components and design tokens
- `packages/convex` — shared Convex backend
- `packages/lib` — shared utilities (cn, formatMMK, i18n, constants, Sentry stub)
- `packages/config` — shared ESLint, Tailwind, and TypeScript configs

## Local development

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local`:

- Convex deployment URL and auth keys
- Sentry DSN / auth token (optional for local dev)
- `SEED_ADMIN_PASSWORD` for the seed admin user

### 3. Start the dev servers

```bash
bun run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3001

## Available commands

```bash
bun run build        # Build all apps and packages
bun run lint         # Lint all apps and packages
bun run format       # Format all files with Prettier
bun run format:check # Check formatting (used in CI)
bun run typecheck    # Type-check all apps and packages
```

## Docker

```bash
# Development with hot reload
docker-compose up

# Production build
docker build -t khit:latest .
```

## CI

The GitHub Actions workflow runs:

```bash
bun install --frozen-lockfile
bun run lint
bun run build
bun run format:check
```
