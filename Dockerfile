FROM oven/bun:1 AS base

WORKDIR /app

FROM base AS deps
COPY package.json bun.lock bunfig.toml ./
COPY apps/storefront/package.json ./apps/storefront/
COPY apps/admin/package.json ./apps/admin/
COPY packages/ui/package.json ./packages/ui/
COPY packages/convex/package.json ./packages/convex/
COPY packages/lib/package.json ./packages/lib/
COPY packages/config/eslint/package.json ./packages/config/eslint/
COPY packages/config/tailwind/package.json ./packages/config/tailwind/
COPY packages/config/typescript/package.json ./packages/config/typescript/
RUN bun install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN bun run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/storefront/.next ./apps/storefront/.next
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/storefront/package.json ./apps/storefront/
COPY --from=builder /app/apps/admin/package.json ./apps/admin/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bunfig.toml ./bunfig.toml

EXPOSE 3000 3001

CMD ["sh", "-c", "bun run --cwd apps/storefront start & bun run --cwd apps/admin start & wait"]
