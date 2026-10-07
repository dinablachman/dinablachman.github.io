/**
 * Bunny companion — every tunable in one place.
 * Sizes are CSS px, times are ms. Frame data mirrors bunny-line-art-assets/manifest.json.
 */
export const PET_CONFIG = {
  /** Source frames are 512 × 512 on 3 × 3 atlases; all share one floor line. */
  frame: { size: 512, floorY: 458, bodyTopY: 109 },

  /** Desktop (> 720px): seated on the card's top edge, right of centre. */
  desktop: {
    size: 280, // canvas width/height
    offsetFromCenter: 118, // canvas left edge, relative to the viewport centre (home card is 720 wide → body ends 40px from its right corner)
    seatOverlap: 14, // how far the feet sink past the card's top edge so it reads as resting
    homeCardHeight: 560, // .window[data-size='small'] height — the card + bunny are centred as one group
  },

  /** Mobile (≤ 720px): lower-left corner of the viewport, below the card (home only). */
  mobile: { size: 160, left: 8, bottom: 20, minViewportHeight: 760 },

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

  /**
   * Continuous "life" under the frame swaps (after feral-blob): everything is a
   * sub-pixel transform on the body, anchored at the feet. Off under reduced motion.
   */
  life: {
    breathe: true,
    breath: { period: 4600, scaleY: 0.008, scaleX: -0.004, lift: 1 }, // awake
    sleepBreath: { period: 5600, scaleY: 0.005, scaleX: -0.002, lift: 0.4 }, // asleep: slower, smaller
    fidget: true,
    fidgetEvery: [3000, 6500], // new random micro-pose this often…
    fidgetGlide: [1400, 2600], // …eased into over this long
    fidgetRotate: 0.8, // ± degrees, about the feet (kept small: a bitmap's thin lines crawl if it turns too far)
    fidgetLift: 1, // ± px
    crossfade: 220, // ms dissolve used only for the slow sleep/wake pose changes; everything else cuts
    hop: { ease: 'cubic-bezier(0.34, 1.35, 0.64, 1)', duration: 420, landSquash: 0.06 }, // overshoot + squash-and-pop on landing
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
    sleepAfter: 60000, // light theme: inactivity before falling asleep
    /* night theme: sleeping is the default; stirs awake now and then */
    nightSleepAfter: 20000, // after a click/keypress at night, doze off again sooner
    nightStir: [45000, 90000], // wake briefly on its own, then settle back down
    nightStirAwake: 3000,
  },
} as const;

/** Layout numbers derived from the config (shared by Base.astro and Pet.astro). */
export function petLayout() {
  const { size, seatOverlap } = PET_CONFIG.desktop;
  const { size: src, floorY, bodyTopY } = PET_CONFIG.frame;
  const lift = (floorY / src) * size - seatOverlap; // canvas top sits this far above the card's top edge
  const headroom = lift - (bodyTopY / src) * size; // visible bunny height above the card
  return { size, dx: PET_CONFIG.desktop.offsetFromCenter, lift: Math.round(lift), headroom: Math.round(headroom) };
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
 * One atlas for every frame (public/assets/bunny/bunny.png, 6 × 5 cells of 512px), quantised in a
 * single pass so colours are identical across frames, and decoded once so swaps never stutter.
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
