/**
 * Bunny companion — every tunable in one place.
 * Sizes are CSS px, times are ms.
 */
export const PET_CONFIG = {
  /** Pixel frames are 192 × 192 on a 6 × 5 atlas. The idle body spans rows bodyTopY to floorY (exclusive). */
  frame: { size: 192, bodyTopY: 42, floorY: 172 },

  /**
   * Now page: floating in the column the intro reserves to the right of its text
   * (`.intro` padding-right in index.astro), the body centred in it both ways.
   * scale is CSS px per sprite px. 1 and 1.5 land every sprite pixel on whole device
   * pixels of a 2× display; 1.25 alternates 2 and 3 device pixels per sprite pixel.
   */
  seat: {
    scale: 1.25,
    column: 226, // width of the bunny's column; the body (84 sprite px wide) is centred in it
  },

  /** Reposition hop: one bounded shift, never drifting past ±bounds from home. */
  move: { step: [8, 16], bounds: 16 },

  /**
   * Poke: the only interactive part. A hit area the size of the silhouette (not the whole
   * canvas, so the card under its feet stays clickable) reacts to a click, or to the cursor
   * crossing it repeatedly, with one "look around" — then a cooldown.
   */
  poke: {
    hit: { left: 28, top: 21, width: 44, height: 68 }, // % of the canvas — the idle silhouette's bounds
    hoverCount: 3, // cursor enters within…
    hoverWindow: 4000, // …this many ms count as pestering
    cooldown: 8000,
  },

  /** Nothing moves between frame swaps: fractional transforms would resample the 1-bit sprite into grey. */
  life: {
    crossfade: 0, // ms dissolve for the slow sleep/wake pose changes; 0 = hard cuts, like every other frame
    hop: { ease: 'step-start', duration: 0 }, // the container jumps whole pixels on the airborne frame
  },

  timing: {
    blink: [6000, 12000], // the most common motion
    blinkDouble: 0.2, // share of blinks that are quick double-blinks
    blinkSlow: 0.12, // share that are slow, heavy-lidded
    blinkWink: 0.08, // share that are a one-eyed wink
    nose: [8000, 20000], // nose twitch — the second most common motion
    gesture: [25000, 50000], // one head tilt, ear twitch, or ears perking up
    groom: [180000, 360000], // rare: a quick face wash
    reposition: [90000, 180000], // one hop
    sleepAfter: 60000, // inactivity before falling asleep
  },
} as const;

/** Layout numbers derived from the config (used by Pet.astro). All in CSS px. */
export function petLayout() {
  const { scale, column } = PET_CONFIG.seat;
  const { size: src, bodyTopY, floorY } = PET_CONFIG.frame;
  const size = src * scale; // canvas width/height
  const mid = Math.round(((bodyTopY + floorY) / 2) * scale); // the body's vertical centre, from the canvas top
  const overhang = (size - column) / 2; // the canvas is wider than its column; it sticks out this far on each side
  return { size, mid, overhang };
}

export type FrameName =
  | 'idle' | 'blink-half' | 'blink-closed' | 'tilt-left' | 'tilt-right' | 'ear-twitch'
  | 'hop-ready' | 'hop-air' | 'hop-land'
  | 'sleep-drowsy' | 'sleep-nod' | 'sleep-curl' | 'sleep-rest'
  | 'wake-eyes' | 'wake-lift' | 'wake-upright'
  | 'nose-twitch-a' | 'nose-twitch-b' | 'ear-perk' | 'ear-back' | 'yawn'
  | 'wink-left' | 'hop-squash' | 'groom-a' | 'groom-b'
  | 'look-left' | 'look-right' | 'look-up' | 'look-up-left' | 'look-up-right';

/**
 * One atlas for every frame (public/assets/bunny/bunny.png, 6 × 5 cells of 192px), using only
 * opaque black, opaque white and transparency, and decoded once so swaps never stutter.
 * Unused pack frames (the down-looks, loaf, sleep-flop, stretch) are left out.
 */
export const SHEET = { cols: 6, rows: 5 } as const;
export const ATLAS: Record<FrameName, [col: number, row: number]> = {
  'idle': [0, 0], 'blink-half': [1, 0], 'blink-closed': [2, 0], 'tilt-left': [3, 0], 'tilt-right': [4, 0], 'ear-twitch': [5, 0],
  'hop-ready': [0, 1], 'hop-air': [1, 1], 'hop-land': [2, 1], 'sleep-drowsy': [3, 1], 'sleep-nod': [4, 1], 'sleep-curl': [5, 1],
  'sleep-rest': [0, 2], 'wake-eyes': [1, 2], 'wake-lift': [2, 2], 'wake-upright': [3, 2], 'nose-twitch-a': [4, 2], 'nose-twitch-b': [5, 2],
  'ear-perk': [0, 3], 'ear-back': [1, 3], 'yawn': [2, 3], 'wink-left': [3, 3], 'hop-squash': [4, 3], 'groom-a': [5, 3],
  'groom-b': [0, 4], 'look-left': [1, 4], 'look-right': [2, 4], 'look-up': [3, 4], 'look-up-left': [4, 4], 'look-up-right': [5, 4],
};

export type ClipStep = [frame: FrameName, ms: number];

/** Single-play clips from the manifest. The last step holds (0 ms = endpoint, not a loop). */
export const CLIPS = {
  // Frames are hard cuts, so each pose needs time to register — nothing shorter than ~150 ms.
  blink: [['blink-half', 160], ['blink-closed', 200], ['blink-half', 180]],
  // lids close a touch faster than they open (feral-blob's 0.42 dip); the slow one is heavy-lidded
  blinkDouble: [['blink-half', 110], ['blink-closed', 150], ['blink-half', 130], ['idle', 180], ['blink-half', 110], ['blink-closed', 150], ['blink-half', 130]],
  blinkSlow: [['blink-half', 300], ['blink-closed', 440], ['blink-half', 340]],
  wink: [['wink-left', 340]],
  noseTwitch: [['nose-twitch-a', 200], ['nose-twitch-b', 200], ['nose-twitch-a', 200]],
  tiltLeft: [['tilt-left', 900]],
  tiltRight: [['tilt-right', 900]],
  earTwitch: [['ear-twitch', 320]],
  earPerk: [['ear-perk', 1200]], // heard something
  groom: [['groom-a', 520], ['groom-b', 460], ['groom-a', 420], ['groom-b', 460], ['groom-a', 520]],
  hop: [['hop-ready', 240], ['hop-air', 200], ['hop-squash', 150], ['hop-land', 280]],
  // ears relax → yawn → eyes droop → head lowers → curl → rest
  fallAsleep: [['ear-back', 900], ['yawn', 1000], ['sleep-drowsy', 900], ['sleep-nod', 600], ['sleep-curl', 600], ['sleep-rest', 0]],
  // eyes → lift → upright → ears perk → idle
  wake: [['wake-eyes', 320], ['wake-lift', 380], ['wake-upright', 400], ['ear-perk', 600]],
  // poked: ears up, then glance left, right, and up — always passing through centre between turns
  lookAround: [['ear-perk', 400], ['idle', 220], ['look-left', 650], ['idle', 240], ['look-right', 650], ['idle', 240], ['look-up-right', 520], ['look-up', 420], ['look-up-left', 520], ['idle', 200]],
} satisfies Record<string, ClipStep[]>;
