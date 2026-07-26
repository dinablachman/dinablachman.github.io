# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single **Jekyll static site** (personal portfolio) using the `jekyll-bear-theme`. There is no backend, database, or Node/npm tooling.

### Services

- **Jekyll dev server** is the only runtime service. Start it with:
  `bundle exec jekyll serve --host 0.0.0.0 --port 4000`
  Serves at `http://127.0.0.1:4000/`. Auto-regeneration is on, so content edits rebuild automatically.

### Non-obvious notes

- Gems are installed into a **local** `vendor/bundle` (configured via `bundle config set --local path vendor/bundle`, stored in `.bundle/config`). Always run Jekyll commands through `bundle exec`.
- Ruby is the system Ruby 3.2 (apt). `Gemfile.lock` records `ruby 3.2.2p53`, but 3.2.3 works fine — do not "fix" this.
- Build (matches CI in `.github/workflows/jekyll.yml`): `bundle exec jekyll build`. Output goes to `_site/` (gitignored).
- There is **no lint config and no automated test suite**. Validation = build succeeds + manual browser checks of `/`, `/projects/`, `/blog/`, `/about/`, and the header dark/light theme toggle.
- `_projects/` holds portfolio content pages describing external apps; those apps are not implemented in this repo.
