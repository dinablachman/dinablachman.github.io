import { openWallpaperDialog } from './wallpaper';

/**
 * Menu bar behavior: click a title to open its menu, click elsewhere or press
 * Escape to close, move the pointer across titles while one is open to switch.
 * Items are mostly inert; `runAction` at the bottom of this file dispatches
 * the ones that do something.
 *
 * Bound once at module load with event delegation, so the persisted menu bar
 * keeps working across client-side navigations.
 */
export function initMenuBar() {
  const bar = document.querySelector<HTMLElement>('[data-menubar]');
  if (!bar || bar.dataset.bound) return;
  bar.dataset.bound = '1';

  const items = () => Array.from(bar.querySelectorAll<HTMLLIElement>('li[data-menu]'));
  const openItem = () => bar.querySelector<HTMLLIElement>('li[data-menu][data-open]');

  function setOpen(li: HTMLLIElement | null) {
    for (const it of items()) {
      const on = it === li;
      it.toggleAttribute('data-open', on);
      it.querySelector('[data-menu-title]')?.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
  }

  // click a title: toggle; click an item: run its action (if any) and close
  bar.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const title = t.closest<HTMLElement>('[data-menu-title]');
    if (title) {
      const li = title.closest<HTMLLIElement>('li[data-menu]')!;
      setOpen(li.hasAttribute('data-open') ? null : li);
      return;
    }
    const item = t.closest<HTMLElement>('.menu-item');
    if (item) {
      if (item.getAttribute('aria-disabled') !== 'true') runAction(item.dataset.action);
      setOpen(null);
    }
  });

  // hover-switch while a menu is open (System 1 tracked the mouse across titles)
  bar.addEventListener('pointerover', (e) => {
    if (!openItem()) return;
    const title = (e.target as HTMLElement).closest<HTMLElement>('[data-menu-title]');
    if (!title) return;
    const li = title.closest<HTMLLIElement>('li[data-menu]')!;
    if (!li.hasAttribute('data-open')) setOpen(li);
  });

  document.addEventListener('pointerdown', (e) => {
    if (openItem() && !bar.contains(e.target as Node)) setOpen(null);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openItem()) setOpen(null);
  });
  // a navigation closes whatever is open
  document.addEventListener('astro:before-swap', () => setOpen(null));
}

/**
 * Switch on `action` here (values are set in MenuBar.astro: 'about-site',
 * 'email', 'resume', 'wallpaper', 'go:/about', ...). Only 'wallpaper' and
 * 'resume' are wired; the rest are still inert.
 */
function runAction(action: string | undefined) {
  if (action === 'wallpaper') openWallpaperDialog();
  else if (action === 'resume') window.open('/assets/cv.pdf', '_blank', 'noopener');
}
