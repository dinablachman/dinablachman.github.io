/**
 * Edit Wallpaper (File menu). The dialog lists the files in
 * public/assets/wallpaper; picking one updates the preview, Apply paints it on
 * `body` in place of the checkerboard, Cancel (or the close box, or Escape)
 * leaves things alone. The choice lives in this module only: it survives
 * client-side navigations (the body is re-painted after each swap) and is gone
 * on reload.
 */
const DIR = '/assets/wallpaper/';

let current: string | null = null;
let bound = false;

const dialog = () => document.querySelector<HTMLElement>('[data-wallpaper-dialog]');

function paint() {
  document.body.style.background = current ? `var(--paper) url("${DIR}${current}") center / cover no-repeat` : '';
}

function select(dlg: HTMLElement, name: string) {
  for (const li of dlg.querySelectorAll<HTMLElement>('[data-wallpaper-item]')) {
    li.setAttribute('aria-selected', li.dataset.wallpaperItem === name ? 'true' : 'false');
  }
  const img = dlg.querySelector<HTMLImageElement>('[data-wallpaper-preview]');
  if (img) img.src = DIR + name;
  dlg.dataset.selected = name;
}

function close() {
  const dlg = dialog();
  if (dlg) dlg.hidden = true;
}

export function openWallpaperDialog() {
  const dlg = dialog();
  if (!dlg) return;
  bind();
  const first = dlg.querySelector<HTMLElement>('[data-wallpaper-item]')?.dataset.wallpaperItem;
  const name = current ?? first;
  if (name) select(dlg, name);
  dlg.hidden = false;
}

function bind() {
  if (bound) return;
  bound = true;

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const dlg = t.closest<HTMLElement>('[data-wallpaper-dialog]');
    if (!dlg) return;
    const item = t.closest<HTMLElement>('[data-wallpaper-item]');
    if (item) {
      select(dlg, item.dataset.wallpaperItem!);
      return;
    }
    if (t.closest('[data-wallpaper-apply]')) {
      current = dlg.dataset.selected ?? null;
      paint();
      close();
      return;
    }
    if (t.closest('[data-wallpaper-cancel]')) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // the body is replaced on navigation; the dialog in the new document is closed
  document.addEventListener('astro:after-swap', paint);
}
