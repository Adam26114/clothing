# CRITICAL RULES - MUST FOLLOW

## RESPONSES

- Keep responses concise and to the point - unless the user asks otherwise
- When you make a non-trivial change, briefly state what you did and why before moving on

## PLANNING MODE

- Always ask clarifying questions before implementing
- Never assume design, tech stack, or features - read @PRD.md and @DESIGN.md first
- Use deep-dive sub-agents to assist with research
- Use deep-dive sub-agents to review the different aspects of your plan before presenting to the user

## CHANGE / EDIT MODE

- Never implement features yourself when possible - use sub-agents!
- Identify changes from the plan that can be implemented in parallel, and use sub-agents to implement the features efficiently
- When using sub-agents to implement features, act as a coordinator only
- Use the best model for the task - premium models for complex tasks (like coding) and mid-tier models for simpler tasks, like documentation
- After completing features (large or small), always run commands like lint, type check and next build to check code quality

## DATABASE SCHEMA CHANGES

- Whenever you make changes to the Convex schema, ALWAYS regenerate the codegen and run `bunx convex dev` to apply
- NEVER edit `convex/_generated/*` manually - it is auto-generated
- NEVER split product variants into separate tables - use the embedded `colorVariants` array pattern (see §Schema in @PRD.md)

## TESTING

- Use any testing tools, libraries available to the project for testing your changes
- Never assume your changes simply work, always test!
- If the project does not have any testing tools, scripts, MCP tools, skills, etc. available for testing, ask the user whether testing should be skipped

## UI DESIGN

- Always follow the UI design system when creating or reviewing components or pages
- Design System: @DESIGN.md
- Use the design tokens from `@DESIGN.md` - never hardcode hex values, oklch values, or font stacks

## TECH STACK - LOCKED

- Package manager: **Bun only** - use `bun install`, `bun add`, `bun x` (NEVER `npm`, `yarn`, `pnpm`)
- Framework: Next.js 14+ App Router + TypeScript strict mode (monorepo via Turborepo)
- UI: shadcn/ui preset `b2BVC6P2m` - install via `bunx --bun shadcn@latest add ...`
- Project init: `bunx --bun shadcn@latest init --preset b2BVC6P2m --base base --template next --monorepo --rtl --pointer`
- Admin template: `dashboard-01` (`bunx shadcn@latest add dashboard-01`)
- Backend: Convex with embedded-variant pattern
- Auth: Convex + Better Auth (`@convex-dev/better-auth` + `better-auth`) with `customer`, `admin`, and `super-admin` roles
- Monitoring: Sentry (`@sentry/nextjs`)
- Icons: Lucide React only
- Styling: Tailwind CSS + `prettier-plugin-tailwindcss`
- RTL: Full right-to-left support required (Burmese + Arabic-ready)
- Cursor: Use `pointer` style on interactive elements (per `--pointer` flag)
- Currency: All money in MMK (Ks) - never hardcode symbols, use `formatMMK()`
- i18n: English at launch, Burmese-ready - all user-facing strings via `t('key')`

## MONOREPO STRUCTURE

```
/
├── apps/
│   ├── storefront/        # Customer-facing Next.js app (port 3000)
│   └── admin/             # Admin panel Next.js app (port 3001)
├── packages/
│   ├── ui/                # Shared shadcn/ui components (the design system)
│   ├── convex/            # Shared Convex backend
│   ├── lib/               # Shared utilities (cn, formatMMK, etc.)
│   └── config/            # Shared ESLint, Tailwind, TypeScript configs
├── package.json
├── turbo.json
├── bunfig.toml
└── bun.lockb
```

- Apps import from `@workspace/ui`, `@workspace/convex`, `@workspace/lib`
- NEVER duplicate components between apps - add to `packages/ui` and import
- NEVER install dependencies directly in apps - add to the relevant `packages/*` first
- Convex schema lives in `packages/convex/schema.ts` - both apps deploy against the same backend

## WORKFLOW

- Branch from `develop`: `feature/<issue>-<slug>` or `fix/<issue>-<slug>`
- Commit format: `<type>: #<issue> — <summary>` (Conventional Commits)
- PR targets `develop`; release/hotfix targets `main`
- `bun.lockb` MUST be committed
- Before claiming "done": `bun run lint && bun run build && bun run format:check` all pass

## NEVER DO

1. Never edit `components/ui/*` directly - customize by composition in app-specific component folders. The one exception is `packages/ui/src/components/button.tsx`, which has a custom `nativeButton={render ? false : undefined}` shim layered on top of the shadcn-generated code — preserve that shim if you regenerate the file (e.g. via `bunx shadcn@latest add button --overwrite`).
2. Never use `npm`, `yarn`, or `pnpm` - Bun only
3. Never normalize product variants into separate Convex tables - embedded only
4. Never hardcode user-facing strings - use the `t()` function
5. Never hardcode currency symbols - use `formatMMK()`
6. Never hardcode hex values, oklch values, or font stacks in JSX - use the design tokens from @DESIGN.md
7. Never use `any` in TypeScript - use `unknown` + type guards
8. Never bypass the admin auth guard on `/admin/*` routes
9. Never store PII (passwords, card numbers) in Convex - Better Auth owns identity
10. Never use decorative animations - 150ms ease transitions only
11. Never add a dependency without explaining why in the PR body
12. Never merge without CodeRabbit passing (no critical-severity issues)
13. Never call Convex from client code without going through the typed hooks in `convex/_generated`
14. Never duplicate components between apps - promote to `packages/ui` and share

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
