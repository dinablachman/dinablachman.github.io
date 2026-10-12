/**
 * New York time and temperature for the info header.
 * Time: Intl, ticks every 30s. Temperature: Open-Meteo (free, no key),
 * cached 10 minutes per tab. Writes into `[data-ny-time]` and `[data-ny-temp]`
 * in the window's info header (the window persists across navigations, so the
 * spans do too).
 */
const TEMP_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.006&current=temperature_2m&temperature_unit=fahrenheit';

const nyClock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

let temp: number | null = null;

export function paintClock() {
  const t = nyClock.format(new Date()); // "10:19 AM"
  for (const el of document.querySelectorAll<HTMLElement>('[data-ny-time]')) {
    el.textContent = `New York  ${t}`;
  }
}

export function paintTemp() {
  if (temp == null) return;
  for (const el of document.querySelectorAll<HTMLElement>('[data-ny-temp]')) {
    el.textContent = `${temp}°F outside`;
  }
}

async function fetchTemp() {
  try {
    const cached = JSON.parse(sessionStorage.getItem('ny-temp') || 'null');
    let f: number | null = cached && Date.now() - cached.t < 600_000 ? cached.f : null;
    if (f == null) {
      const res = await fetch(TEMP_URL);
      if (!res.ok) return;
      f = Math.round((await res.json()).current.temperature_2m);
      sessionStorage.setItem('ny-temp', JSON.stringify({ f, t: Date.now() }));
    }
    temp = f;
    paintTemp();
  } catch {}
}

export function initClockTemp() {
  if ((window as any).__clockTemp) return;
  (window as any).__clockTemp = true;
  paintClock();
  setInterval(paintClock, 30_000);
  fetchTemp();
  setInterval(fetchTemp, 600_000);
}
