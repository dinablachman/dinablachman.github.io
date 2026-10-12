/**
 * The camera roll: one row of photos that scrolls sideways. The native
 * scrollbar is hidden in CSS, so the affordance is a paper fade over whichever
 * edge still has photos behind it, and neither edge fades when the row fits.
 *
 * The state goes on the wrapper as data-more-start / data-more-end; the fades
 * themselves live in about.astro. Recomputed on scroll and whenever the row or
 * a tile is resized, which is what changes whether the photos overflow.
 */

/** sub-pixel slack, so a row scrolled to its end doesn't keep a fade lit */
const SLACK = 1;

export function initRoll(): () => void {
  const stops: Array<() => void> = [];

  for (const wrap of document.querySelectorAll<HTMLElement>('[data-roll]')) {
    const strip = wrap.querySelector<HTMLElement>('[data-roll-strip]');
    if (!strip) continue;

    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      const x = strip.scrollLeft;
      wrap.toggleAttribute('data-more-start', max > SLACK && x > SLACK);
      wrap.toggleAttribute('data-more-end', max > SLACK && x < max - SLACK);
    };

    const ro = new ResizeObserver(update);
    ro.observe(strip);
    for (const tile of Array.from(strip.children)) ro.observe(tile);
    strip.addEventListener('scroll', update, { passive: true });
    update();

    stops.push(() => {
      ro.disconnect();
      strip.removeEventListener('scroll', update);
    });
  }

  return () => stops.splice(0).forEach((stop) => stop());
}
