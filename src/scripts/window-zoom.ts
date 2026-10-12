/**
 * Window zoom: when the window changes size (home ↔ other tabs), its frame
 * animates from the old size to the new one and the desktop padding carries it
 * to its new vertical position. The incoming page is laid out at its final
 * width before the frame starts moving, so nothing re-wraps mid-animation: the
 * frame reveals (or crops) content that is already in place, the way a window
 * zooms on a Mac. The scrollbar rides the moving right edge.
 *
 * Usage: call `zoomWindow(win, desk, from, padFrom)` right after the swap,
 * once the window has its new size. Base.astro does this.
 */
const DURATION = 250;
const EASING = 'cubic-bezier(0.23, 1, 0.32, 1)'; // strong ease-out: moves at once, settles

let active = 0;

/** Resolves when the frame has settled at the new size. */
export function zoomWindow(win: HTMLElement, desk: HTMLElement, from: DOMRect, padFrom: string): Promise<void> {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
  const to = win.getBoundingClientRect();
  if (Math.abs(from.width - to.width) < 1 && Math.abs(from.height - to.height) < 1) return Promise.resolve();

  const id = ++active;

  // freeze the pane at its final width so content does not reflow per frame
  const pane = win.querySelector<HTMLElement>('[data-pane]');
  const row = pane?.parentElement;
  if (pane && row) {
    pane.style.width = `${pane.getBoundingClientRect().width}px`;
    pane.style.flex = 'none';
    row.style.justifyContent = 'space-between';
  }

  const opts: KeyframeAnimationOptions = { duration: DURATION, easing: EASING };
  const frame = win.animate(
    [
      { width: `${from.width}px`, height: `${from.height}px` },
      { width: `${to.width}px`, height: `${to.height}px` },
    ],
    opts,
  );
  const pad = desk.animate([{ paddingTop: padFrom }, { paddingTop: getComputedStyle(desk).paddingTop }], opts);

  return Promise.allSettled([frame.finished, pad.finished]).then(() => {
    // a newer zoom may have started mid-flight; leave the pane to it
    if (id !== active || !pane || !row) return;
    pane.style.width = '';
    pane.style.flex = '';
    row.style.justifyContent = '';
  });
}
