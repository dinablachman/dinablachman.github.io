# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single **Astro static site** (personal portfolio, dinablachman.com). No backend, no database, no framework runtime shipped to the client.

### Services

- **Astro dev server** is the only runtime service:
  `npm run dev -- --host 0.0.0.0 --port 4321`
  Serves at `http://127.0.0.1:4321/`. HMR is on.

### Commands

- Install: `npm install`
- Build (matches CI in `.github/workflows/deploy.yml`, which uses `withastro/action`): `npm run build` → output in `dist/` (gitignored).
- Preview the production build: `npm run preview`

### Structure

- `src/layouts/Base.astro` — the single page shell: fixed animated `Sky`, centered glass `.window` (header + nav + paper `.pane`), `<ClientRouter />` for view transitions, theme toggle script. Every page passes `width` (720 | 800 | 880) and `header` (`full` | `compact` | `strip`).
- `src/components/` — `Sky.astro` (CSS-only clouds + grain + stars, `transition:persist`), `Nav.astro`, `ThemeToggle.astro`, `Pet.astro` (the bunny companion: sprite layers + state controller; every tunable — size, placement, movement bounds, timings, sleep delay, fades — lives in `src/lib/pet-config.ts`; atlases in `public/assets/bunny/`).
- `src/styles/tokens.css` — design tokens, mirrored from the Paper design file. `:root[data-theme='night']` overrides for dark mode. `global.css` holds all shared component styles.
- `src/content/blog/*.md` and `src/content/projects/*.md` — content collections (schemas in `src/content.config.ts`). **Adding a post = adding a markdown file.** Projects also render as write-ups at `/projects/[slug]` and appear in the blog list when `detail: true`.
- `public/assets/` — static media (gifs, videos, pdfs, `bunny/` sprite atlases for the pet; `deer-pet/` is a retired earlier pet pack). `public/CNAME` sets the custom domain.

### Non-obvious notes

- Theme is stored in `localStorage('theme')` and applied in an inline `<head>` script before paint; `astro:before-swap` re-applies it across client-side navigations.
- Paths in markdown are plain absolute (`/assets/...`); no Liquid. Media referenced from frontmatter is only rendered if the file exists in `public/` (checked at build time).
- There is **no lint config and no automated test suite**. Validation = `npm run build` succeeds + manual browser checks of `/`, `/about`, `/projects`, `/blog`, a post, a project write-up, the theme toggle, and a 390px-wide viewport.
- Design source of truth is the Paper file "dina portfolio — v1 mockups" (v3-a…e desktop boards, m3-a…e mobile boards).
