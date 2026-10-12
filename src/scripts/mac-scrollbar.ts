/**
 * A working 1984 scrollbar for the window. The native scrollbar is hidden in
 * CSS; this draws the thumb from the scroll target's metrics and maps arrows,
 * track clicks and thumb drags back onto `target.scrollTop`.
 *
 * The target is the pane, unless the current page marks a narrower element
 * with `[data-scroll]` (the blog does this so its list box stays put while the
 * document scrolls). `rebind()` picks the target up again after a swap.
 *
 * Inactive state (content fits): the track turns white and the thumb hides,
 * which is what System 1 did.
 */
const LINE = 20; // one arrow click, in px
const REPEAT_DELAY = 300;
const REPEAT_RATE = 50;
const MIN_THUMB = 16;

export type MacScrollbar = { refresh: () => void; rebind: () => void };

export function initMacScrollbar(): MacScrollbar | null {
  const win = document.querySelector<HTMLElement>('.window');
  const pane = win?.querySelector<HTMLElement>('[data-pane]');
  const bar = win?.querySelector<HTMLElement>('[data-vscroll]');
  if (!win || !pane || !bar) return null;
  if (bar.dataset.bound) return (win as any).__macScrollbar as MacScrollbar;
  bar.dataset.bound = '1';

  const track = bar.querySelector<HTMLElement>('[data-sb="track"]')!;
  const thumb = bar.querySelector<HTMLElement>('[data-sb="thumb"]')!;
  const up = bar.querySelector<HTMLElement>('[data-sb="up"]')!;
  const down = bar.querySelector<HTMLElement>('[data-sb="down"]')!;

  let target: HTMLElement = pane;
  const maxScroll = () => Math.max(0, target.scrollHeight - target.clientHeight);

  function refresh() {
    const max = maxScroll();
    if (max <= 0) {
      bar.setAttribute('data-inactive', '');
      return;
    }
    bar.removeAttribute('data-inactive');
    const trackH = track.clientHeight;
    const ratio = target.clientHeight / target.scrollHeight;
    const h = Math.max(MIN_THUMB, Math.round(trackH * ratio));
    const y = Math.round((target.scrollTop / max) * (trackH - h));
    thumb.style.height = `${h}px`;
    thumb.style.transform = `translateY(${y}px)`;
  }

  function scrollBy(delta: number) {
    target.scrollTop = Math.min(maxScroll(), Math.max(0, target.scrollTop + delta));
  }

  // listeners that belong to the current target; swapped out by rebind()
  const ro = new ResizeObserver(() => refresh());
  const mo = new MutationObserver(() => {
    requestAnimationFrame(refresh);
    for (const img of target.querySelectorAll('img')) img.addEventListener('load', refresh, { once: true });
  });
  function bind(el: HTMLElement) {
    target.removeEventListener('scroll', refresh);
    ro.disconnect();
    mo.disconnect();
    target = el;
    target.addEventListener('scroll', refresh, { passive: true });
    ro.observe(target);
    for (const child of Array.from(target.children)) ro.observe(child);
    mo.observe(target, { childList: true, subtree: true });
    for (const img of target.querySelectorAll('img')) img.addEventListener('load', refresh, { once: true });
    refresh();
  }
  function rebind() {
    bind(pane!.querySelector<HTMLElement>('[data-scroll]') ?? pane!);
  }

  // arrows: one line per click, auto-repeat while held
  function bindArrow(el: HTMLElement, dir: 1 | -1) {
    let timer = 0;
    const stop = () => {
      window.clearTimeout(timer);
      window.clearInterval(timer);
      timer = 0;
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      scrollBy(dir * LINE);
      timer = window.setTimeout(() => {
        timer = window.setInterval(() => scrollBy(dir * LINE), REPEAT_RATE);
      }, REPEAT_DELAY);
      const end = () => {
        stop();
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
      };
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    });
  }
  bindArrow(up, -1);
  bindArrow(down, 1);

  // track: page up / down depending on which side of the thumb was hit
  track.addEventListener('pointerdown', (e) => {
    if (e.target === thumb) return;
    const r = thumb.getBoundingClientRect();
    scrollBy(e.clientY < r.top ? -target.clientHeight : target.clientHeight);
  });

  // thumb: drag
  thumb.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    thumb.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const startTop = target.scrollTop;
    const trackH = track.clientHeight;
    const thumbH = thumb.offsetHeight;
    const room = Math.max(1, trackH - thumbH);
    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      target.scrollTop = startTop + (dy / room) * maxScroll();
    };
    const onUp = () => {
      thumb.removeEventListener('pointermove', onMove);
      thumb.removeEventListener('pointerup', onUp);
      thumb.removeEventListener('pointercancel', onUp);
    };
    thumb.addEventListener('pointermove', onMove);
    thumb.addEventListener('pointerup', onUp);
    thumb.addEventListener('pointercancel', onUp);
  });

  window.addEventListener('resize', refresh, { passive: true });
  document.fonts?.ready.then(refresh);
  rebind();

  const api: MacScrollbar = { refresh, rebind };
  (win as any).__macScrollbar = api;
  return api;
}
