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

The site is a Macintosh System 1 (1984) interface: a 1-bit window on the grey checkerboard desktop. The UI is black on white; photos, gifs, videos and the optional desktop wallpaper (File > Edit Wallpaper…) keep their color.

- `src/layouts/Base.astro` — the page shell: dither desktop on `body`, `<MenuBar />`, `.desktop[data-size]` holding one `<MacWindow>`. Pages pass `title`, `current` (nav) and `size` (`small` on home, `large` elsewhere). The window title is always "welcome to my website!" and the info bar always shows New York time and temperature. The window is `transition:persist`; Base's script swaps pane children from the incoming page, rebinds the scrollbar, and zooms the frame when the size changes.
- `src/components/` — `MenuBar.astro` (Apple, File, Edit, View, Special; menus open and close; items carry `data-action`, dispatched in `src/scripts/menubar.ts`, where only Edit Wallpaper and Open Résumé are wired), `MacWindow.astro` (striped title bar, close box, info bar, pane, drawn scrollbars, size box), `NavButtons.astro` (Now, About, Projects, Blog as rounded buttons), `TwoPane.astro` (blog list box + document), `PostDocument.astro` / `ProjectDocument.astro` (ruler, title, meta, markdown body), `Ruler.astro`. `Pet.astro` and `src/lib/pet-config.ts` are the bunny companion: a 1-bit sprite from `public/assets/bunny/bunny.png` (6 × 5 atlas of 192px cells, drawn at 1.25× with `image-rendering: pixelated`), mounted only on the Now page inside `.intro`, which reserves a 226px column on its right (`padding-right`) where the body floats centered both ways between the two rules. The pane swap tears it down and reboots it; hidden under 720px. The home window (`--win-h-small`) is sized to fit its content exactly; the vertical rhythm is 14px between a button row and its rule and 28px between a rule and the intro text. The menu bar's corner glyph and `public/favicon.svg` (plus `favicon-32.png` for Safari) are the "peek" bunny mark, drawn on the same 16px grid.
- `src/scripts/` — `mac-scrollbar.ts` (the vertical scrollbar is real: arrows with auto-repeat, track paging, draggable thumb; turns white and thumbless when content fits; scrolls the pane, or a `[data-scroll]` element inside it when a page has one, which is how the blog keeps its list box and ruler fixed while the document scrolls), `window-zoom.ts` (the frame animates from the old size to the new one with a strong ease-out; the pane is frozen at its final width for the duration so content never re-wraps mid-animation), `clock-temp.ts` (Intl clock, Open-Meteo temperature cached 10 min), `menubar.ts`.
- `src/lib/entries.ts` — the blog list groups (essays, then project write-ups with `detail: true`), the default post for `/blog`, and the short/long date formats used in the list and documents.
- `src/styles/tokens.css` — `@font-face` for the self-hosted fonts and the few tokens (ink, paper, dither, type scale, window sizes). `global.css` holds every shared component style, mirrored from the Paper boards.
- `src/content/blog/*.md` and `src/content/projects/*.md` — content collections (schemas in `src/content.config.ts`). **Adding a post = adding a markdown file.** Projects render in the gallery at `/projects` and as write-ups at `/projects/[slug]` (shown in the blog's two-pane view, and listed there when `detail: true`).
- `public/assets/fonts/mac/` — ChicagoFLF (public domain) for titles, menus, buttons, headings; Pixel Operator, Pixel Operator Mono and Pixel Operator 8 (CC0) for body, code and small labels. Licenses and sources in `LICENSES.md` there. `public/assets/mac/dither.png` (1px cells) is used inside the UI wherever 1984 would have drawn 50% grey; `desktop-dither.png` (2px cells) is the desktop, since 1px cells blur to flat grey on dense screens.
- `public/assets/` — static media (gifs, videos, pdfs, `wallpaper/`, and `bunny/bunny.png`, the pet's only sprite atlas). `public/CNAME` sets the custom domain.

### Non-obvious notes

- Pixel Operator is a bitmap-grid font: it is crisp at 16px (code, info bar) and 8px (small labels). Body text runs at 18px on purpose (a little soft, chosen for size against the Chicago headings); do not introduce further sizes. ChicagoFLF is an outline and scales freely.
- There is no night mode and no theme script in v2. The only motion is the window zoom; `prefers-reduced-motion` skips it.
- The page never scrolls; the window's `.pane` does. The native scrollbar is hidden and `mac-scrollbar.ts` draws the 1984 one. Call `refresh()` on it after changing pane content outside the normal navigation flow.
- Paths in markdown are plain absolute (`/assets/...`); no Liquid. Media referenced from frontmatter is only rendered if the file exists in `public/` (checked at build time).
- Shiki syntax colors are overridden to black in `.prose pre`; a 1-bit screen has no syntax highlighting.
- There is **no lint config and no automated test suite**. Validation = `npm run build` succeeds + manual browser checks of `/`, `/about`, `/projects`, `/blog`, a post, a project write-up, the home-to-blog resize, the scrollbar on a long post, a menu opening and closing, and a 390px-wide viewport (mobile layout is provisional until a mobile mock is chosen).
- Design source of truth is the Paper file "dina portfolio — v2 paper + window", boards "CHOSEN · home" and "CHOSEN · blog". The v1 file ("dina portfolio — v1 mockups") is the previous glass-card design and no longer applies.
