# Design System — Personal Learning Designer

This is a developer reference document only. It is **not** imported into the running app.
Every component in this codebase should be built to match the rules below. When in doubt,
match an existing component rather than inventing a new pattern.

## Colors

Theme tokens are CSS variables defined in `src/index.css` (`:root` = light theme, `.dark` =
dark theme) and exposed through `tailwind.config.js`, so use the Tailwind class names below
(`bg-surface`, `text-text-primary`, `border-accent`, etc.) rather than hardcoded hex or
arbitrary values in JSX. **Never use `bg-white/…`, `border-white/…`, or `text-slate-100`** —
those only work on a dark background; use `ink` and `strong` instead, which flip with the theme.

| Token | Dark value | Light value | Tailwind class examples |
|---|---|---|---|
| background | `#0f0f1a` | `#f4f6fb` | `bg-background` |
| surface | `#1a1a2e` | `#ffffff` | `bg-surface` |
| elevated | `#16213e` | `#e9eef8` | `bg-elevated` |
| border | `#0f3460` | `#cbd5e1` | `border-border` |
| text-primary | `#e2e8f0` | `#0f172a` | `text-text-primary` |
| text-muted | `#94a3b8` | `#475569` | `text-text-muted` |
| strong | `#f1f5f9` | `#0f172a` | `text-strong` (headings/text on glass) |
| ink | white | `#0f172a` | `bg-ink/5`, `border-ink/10` (glass surfaces) |

Fixed colors, identical in both themes:

| Token | Hex | Tailwind class examples |
|---|---|---|
| accent | `#3b82f6` | `bg-accent`, `text-accent`, `ring-accent` |
| acquisition | `#06b6d4` | `bg-acquisition`, `text-acquisition` |
| collaboration | `#eab308` | `bg-collaboration`, `text-collaboration` |
| discussion | `#3b82f6` | `bg-discussion`, `text-discussion` |
| inquiry | `#ef4444` | `bg-inquiry`, `text-inquiry` |
| practice | `#a855f7` | `bg-practice`, `text-practice` |
| production | `#22c55e` | `bg-production`, `text-production` |

Color is never the sole differentiator — every learning-type indicator pairs its color with
an icon and a text label.

## Typography

Inter variable font, imported via Google Fonts:
`https://fonts.googleapis.com/css2?family=Inter:slnt,wght@-10..0,300;-10..0,400;-10..0,500;-10..0,600;-10..0,700&display=swap`

- Headings: weight 600–700
- Body: weight 400
- Captions: weight 300, `text-text-muted` color

## Motion Rules

**Entrance:** fade + slide up 8px, 250ms ease-out.

**Click feedback** ("haptic-style" — visual only, no `navigator.vibrate`, no device haptics):
```js
whileTap={{ scale: 0.98 }}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

**Hover feedback:** `whileHover={{ scale: 1.02 }}`, 150ms ease.

**Stagger lists** — use this exact variant shape everywhere (`staggerChildren` /
`delayChildren` are numeric properties inside `transition`, not a `stagger()` helper):
```js
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }
```
Parent: `<motion.div variants={container} initial="hidden" animate="show">`.
Children: `<motion.div variants={item}>`.

**Reduced motion:** every animated surface must respect `prefers-reduced-motion` via Framer
Motion's `useReducedMotion` hook. When `true`, skip transforms/scale/slide and fall back to an
opacity-only fade. Use the shared `useMotionVariants` helper in
`src/components/shared/motion.ts` rather than reimplementing this check per component.

## Elevation / Glass

```
bg-ink/5 backdrop-blur-lg border border-ink/10 rounded-2xl shadow-xl
```
Applied to: TLA columns, design cards, AI Assistant panel, metadata header card, all modals.
`ink` is white in dark mode and near-black in light mode, so the same recipe reads correctly
in both themes. Use `bg-ink/5` (not `/10`) to avoid muddiness.

Foreground text on glass must use `text-strong` — `#f1f5f9` in dark mode, `#0f172a` in light
mode, both verified to meet the 4.5:1 contrast minimum against their backgrounds.

## Favicon

Simple colored hexagon, fill `#3b82f6`, as an SVG (`public/favicon.svg`).

## Accessibility

- All inputs labeled (visible `<label>` or `aria-label`)
- Color never the sole differentiator — pair with icon + text
- Full keyboard navigation, logical tab order
- ARIA labels on all icon-only buttons
- Minimum 4.5:1 contrast, including on glass surfaces
- dnd-kit: `KeyboardSensor` alongside `PointerSensor`, visible focus rings (`ring-2 ring-accent`)
  on drag handles, `role="button"`, `aria-label="Reorder [item]"`

## Responsive Breakpoint

`768px` (Tailwind's `md:`) is the single breakpoint used throughout the app.
