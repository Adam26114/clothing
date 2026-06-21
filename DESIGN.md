# Design System

This project uses a **single unified design system** built on shadcn/ui preset `b2BVC6P2m` with a teal/emerald accent on a neutral base. The visual treatment is shared between the storefront and admin apps — what differs is the **UX density and component composition**, not the tokens.

**Source of truth:** `app/globals.css` (or `packages/ui/globals.css` in monorepo). All tokens are CSS variables bridged to Tailwind via `@theme inline`. Never redefine or hardcode these values.

---

## Init Command

```bash
bunx --bun shadcn@latest init --preset b2BVC6P2m --base base --template next --monorepo --rtl --pointer
```

| Flag | Effect |
| --- | --- |
| `--preset b2BVC6P2m` | Pins this exact design preset (teal/emerald, neutral base, medium radius) |
| `--base base` | No color preset applied — uses the preset's neutral foundation |
| `--template next` | Next.js App Router setup |
| `--monorepo` | Turborepo workspace with `apps/` and `packages/` |
| `--rtl` | RTL layout direction supported (Burmese/Arabic-ready) |
| `--pointer` | Use `cursor: pointer` on interactive elements (vs default browser cursor) |

---

## Stack

- **Framework:** Next.js App Router + React + TypeScript (strict)
- **Styling:** Tailwind CSS v4, bridged to design tokens in `globals.css` via `@theme inline`
- **Components:** shadcn/ui primitives in `packages/ui/src/components/`
- **Icons:** Lucide React (`lucide-react`)
- **Fonts:** Geist (UI), Geist Mono (code/technical labels)
- **Dark mode:** `next-themes`, class-based — light is default
- **RTL:** `dir="rtl"` or `dir="ltr"` set on `<html>` based on locale
- **Utilities:** `cn()` from `@workspace/lib`

---

## Tokens

All semantic tokens live in `:root` (light) and `.dark` (dark) blocks in `globals.css`. Reference them via Tailwind: `bg-background`, `text-foreground`, `border-border`, `ring-ring`, `bg-primary`, etc.

### Core Colors

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | Page canvas |
| `foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text |
| `card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Card surfaces |
| `card-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Text on cards |
| `popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Popovers, dropdowns |
| `popover-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Text in popovers |
| `primary` | `oklch(0.508 0.118 165.612)` | `oklch(0.432 0.095 166.913)` | **Teal/emerald brand accent** — CTAs, links, active states |
| `primary-foreground` | `oklch(0.979 0.021 166.113)` | `oklch(0.979 0.021 166.113)` | Text on primary surfaces |
| `secondary` | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` | Secondary surfaces, chips |
| `secondary-foreground` | `oklch(0.21 0.006 285.885)` | `oklch(0.985 0 0)` | Text on secondary |
| `muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Subtle backgrounds, disabled states |
| `muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Secondary text, captions |
| `accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Hover states, highlighted surfaces |
| `accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` | Text on accent |
| `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Errors, destructive actions |
| `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Hairline borders |
| `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | Form input borders |
| `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Focus rings |
| `radius` | `0.45rem` | `0.45rem` | Default border radius (~7.2px) |

### Chart Palette (teal/emerald family)

All charts use shades from the same green-cyan hue (165° in OKLCH). Use sequentially for ordered data; use `chart-1` through `chart-5` as defaults.

| Token | Value | Usage |
| --- | --- | --- |
| `chart-1` | `oklch(0.845 0.143 164.978)` | Lightest teal — primary series |
| `chart-2` | `oklch(0.696 0.17 162.48)` | Medium teal — secondary series |
| `chart-3` | `oklch(0.596 0.145 163.225)` | Mid teal — tertiary series |
| `chart-4` | `oklch(0.508 0.118 165.612)` | Deeper teal — quaternary series |
| `chart-5` | `oklch(0.432 0.095 166.913)` | Deepest teal — quinary series |

### Sidebar Tokens

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` | Sidebar background |
| `sidebar-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Sidebar text |
| `sidebar-primary` | `oklch(0.596 0.145 163.225)` | `oklch(0.696 0.17 162.48)` | Active nav item background |
| `sidebar-primary-foreground` | `oklch(0.979 0.021 166.113)` | `oklch(0.262 0.051 172.552)` | Active nav item text |
| `sidebar-accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Hover state on nav items |
| `sidebar-accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` | Hover state text |
| `sidebar-border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Sidebar dividers |
| `sidebar-ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Focus ring inside sidebar |

---

## Typography

| Token | Font | Usage |
| --- | --- | --- |
| `--font-sans` | Geist Sans | Body text, controls, forms |
| `--font-mono` | Geist Mono | Technical labels, code blocks, IDs |

Guidelines:

- Page titles: `text-2xl font-semibold tracking-tight` to `text-3xl font-semibold tracking-tight`
- Section headings: `text-lg font-semibold` or `text-xl font-semibold`
- Body copy: `text-sm` to `text-base`, `leading-6` to `leading-7`
- Captions / metadata: `text-xs text-muted-foreground`
- Numbers/counts in tables: `font-variant-numeric: tabular-nums` for proper alignment
- Code, SKUs, order numbers: `font-mono text-sm`

---

## Core Utilities

Defined in `globals.css`:

- `.bg-background`, `.bg-card`, `.bg-popover`, `.bg-muted`, `.bg-accent`, `.bg-primary`, `.bg-secondary`, `.bg-destructive`
- `.text-foreground`, `.text-muted-foreground`, `.text-primary`, `.text-primary-foreground`
- `.border-border`, `.border-input`, `.ring-ring`
- `rounded-{sm|md|lg|xl}` — derived from `--radius: 0.45rem`

---

## Components

### Cards

Use shadcn `<Card>` primitives. Default radius is `var(--radius)` (~7.2px).

```tsx
<Card>
  <CardHeader>
    <CardTitle>...</CardTitle>
    <CardDescription>...</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

Avoid heavy shadows. Use `border-border` for definition instead of `shadow-lg`.

### Buttons

- Primary: `bg-primary text-primary-foreground` (teal CTA)
- Secondary: `bg-secondary text-secondary-foreground`
- Outline: `border border-input bg-background`
- Ghost: `hover:bg-accent hover:text-accent-foreground`
- Destructive: `bg-destructive text-white`

All buttons: `rounded-md` (from `--radius`), focus-visible ring, `cursor-pointer` (per `--pointer` flag).

### Inputs

Use shadcn `<Input>`, `<Textarea>`, `<Select>`, `<Checkbox>`, `<RadioGroup>`. Defaults apply: `border-input`, `ring-ring` on focus, `rounded-md`.

### Badges

Use shadcn `<Badge variant="default | secondary | outline | destructive">`. For domain-specific status meanings, wrap in `<StatusBadge>` in app components.

### Tables (admin)

Use the shared `<DataTable>` from `packages/ui`. Features required: sortable, searchable, filterable, paginated, selectable, column visibility, row actions, bulk actions, empty state, loading skeleton.

### Charts

Use Recharts (or shadcn chart wrapper) with `chart-1` through `chart-5` as the default palette. Always pair with a legend and accessible text alternatives.

---

## Layout

### Apps use a single layout language

```tsx
<div className="min-h-screen bg-background text-foreground">
  <main className="container mx-auto max-w-7xl px-4 py-8 lg:py-12">
    {children}
  </main>
</div>
```

### Storefront (`apps/storefront`)

- Top nav: 64px sticky header with logo center, primary nav left, bag/account right
- Container: `max-w-7xl`, generous vertical rhythm (`py-16 md:py-24 lg:py-32`)
- Grid gaps: `gap-4` mobile, `gap-6` desktop
- Mobile-first responsive at 375px → 768px → 1280px+

### Admin (`apps/admin`)

- Layout from shadcn dashboard-01: 240px sidebar + 56px top bar + content area
- Container: `max-w-7xl mx-auto`, content padding `p-6` desktop / `p-4` mobile
- Two-column main: sticky left rail (`minmax(0, 0.85fr)`) + wider right workspace (`minmax(0, 1.35fr)`)
- Sidebar uses `sidebar-*` tokens

---

## Interaction

- Hover: subtle background change via `bg-accent`, no dramatic lift
- Focus: `focus-visible:ring-ring/50 focus-visible:ring-[3px]` on every interactive element
- Disabled: `disabled:pointer-events-none disabled:opacity-50`
- Motion: 150ms ease (`transition-colors duration-150 ease-in-out`) — never decorative loops
- Cursor: `cursor-pointer` on all interactive surfaces (per `--pointer` flag)
- Loading: skeleton placeholders matching real layout — never spinner-only
- Empty: illustration + helpful message + primary CTA

---

## RTL Support

- Always use logical CSS properties: `ms-*`, `me-*`, `ps-*`, `pe-*` instead of `ml-*`, `mr-*`, `pl-*`, `pr-*`
- Use `start`/`end` for flexbox alignment, never `left`/`right`
- Icons that imply direction (chevrons, arrows) must be mirrored via `rtl:rotate-180` or directional Lucide icons (`ChevronRight` → `ChevronLeft` in RTL)
- Test layouts in both `dir="ltr"` and `dir="rtl"` before merging
- Set `dir` on `<html>` based on locale — never per-component

---

## Accessibility

- WCAG 2.1 AA minimum
- Visible focus rings on all interactive elements (`focus-visible:ring-ring/50`)
- High text contrast — never go below 4.5:1
- Keyboard reachable: every action available without a mouse
- Images: meaningful `alt` text or `alt=""` if decorative
- Forms: labels associated with inputs; errors via `aria-describedby`
- Provide text alternatives for charts and graphs
- Skip-to-content link for keyboard users
- Controls must remain usable on mobile (375px minimum)

---

## Definition of Done — Visual

- [ ] No hardcoded hex/oklch values in JSX — only token classes (`bg-primary`, `text-foreground`, etc.)
- [ ] No hardcoded font families — only Geist tokens
- [ ] No `shadow-lg` / `shadow-xl` for card definition — use `border-border`
- [ ] All interactive elements have `cursor-pointer` and visible focus rings
- [ ] All animations are 150ms ease — no decorative motion
- [ ] Tested in both light and dark modes
- [ ] Tested in both `dir="ltr"` and `dir="rtl"`
- [ ] Tested at 375px, 768px, 1280px+
- [ ] Lighthouse Accessibility ≥ 95