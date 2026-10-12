// The drink engine. One illustrated glass; everything inside it is drawn
// per frame on a canvas whose coordinate system is fixed at 700x1040.
//
// Geometry was measured from art/glass.png (467x764). The inner glass is a
// tapered cylinder seen slightly from above, so every horizontal slice is an
// ellipse with rx(y) shrinking toward the floor and ry = 0.34 * rx.

export const W = 700;
export const H = 1040;

const GX = 102;                 // glass image offset in canvas
const GY = 250;
const CX = GX + 248;            // glass axis
const FLOOR_Y = GY + 650;       // centre of inner floor ellipse
const FULL_Y = GY + 135;        // surface centre when t = 1
const RIM_Y = GY + 93;          // centre of outer rim ellipse
const RY_RATIO = 0.34;
const SPOUT_X = CX - 34;
const SPOUT_Y = GY - 130;
export const GLASS_FOOT = GY + 752;   // where the glass meets the counter

export function rx(y) { return 190 - 0.0933 * (y - (GY + 80)); }
export function ry(y) { return RY_RATIO * rx(y); }
export function surfaceY(t) { return FLOOR_Y - t * (FLOOR_Y - FULL_Y); }

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const c = a.map((v, i) => Math.round(lerp(v, b[i], t)));
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

// Path helpers -------------------------------------------------------------

// Region of liquid between two surface heights (canvas y). Bounded above by
// the front arc of the upper surface and below by the front arc of the lower
// surface, walls in between. In canvas angles the front (nearest, y-down)
// half of an ellipse is 0..pi.
function bodyPath(ctx, yLow, yHigh, wobble = 0) {
  ctx.beginPath();
  ctx.moveTo(CX - rx(yHigh), yHigh);
  ctx.ellipse(CX, yHigh, rx(yHigh), ry(yHigh) * (1 + wobble), 0, Math.PI, 0, true);
  ctx.lineTo(CX + rx(yLow), yLow);
  ctx.ellipse(CX, yLow, rx(yLow), ry(yLow), 0, 0, Math.PI, false);
  ctx.closePath();
}

function surfacePath(ctx, y, wobble = 0) {
  ctx.beginPath();
  ctx.ellipse(CX, y, rx(y), ry(y) * (1 + wobble), 0, 0, TAU);
}

// Engine ---------------------------------------------------------------------

export class Drink {
  constructor(canvas, art, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.art = art;                       // { glass, ice: [a,b,c], foam, petal }
    this.reduced = !!opts.reducedMotion;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * this.dpr;
    canvas.height = H * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.liquidCanvas = document.createElement('canvas');
    this.liquidCanvas.width = W * this.dpr;
    this.liquidCanvas.height = H * this.dpr;
    this.lctx = this.liquidCanvas.getContext('2d');
    this.lctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.foamCanvas = document.createElement('canvas');
    this.foamTinted = null;
    this.foamProfile = this._profile(art.foam);

    this.time = 0;
    this.reset();
  }

  reset() {
    this.layers = [];          // { color, top, height, target }
    this.pour = null;          // { color, top, x, t }
    this.agitation = 0;
    this.swirls = [];
    this.drops = [];
    this.ripples = [];
    this.ice = [];
    this.iceQueue = 0;
    this.iceTimer = 0;
    this.foam = null;          // { tint, amount, target }
    this.dust = [];            // settled dust { u, v, r, a } in foam-space
    this.dustFalling = [];
    this.petal = null;
    this.sparkle = false;
    this.presented = false;
    this.sipping = false;
    this.dustColor = null;
    this.dustResolve = null;
    this.hazeBaked = 0;
    this._totalTarget = 0;
  }

  // level in glass units (0..1)
  get level() { return this.layers.reduce((s, l) => s + l.height, 0); }
  get surface() { return surfaceY(this.level); }
  get isEmpty() {
    return this.level <= 0.002 && (!this.foam || this.foam.amount <= 0.02);
  }

  // Steps ------------------------------------------------------------------

  beginPour(step) {
    this.layers.push({ color: step.color, top: step.top, height: 0, target: step.amount, id: step.id });
    this.pour = { color: step.color, top: step.top, on: false, ms: step.holdMs };
  }

  // advance the pour while held; returns progress 0..1
  advancePour(dt, holding) {
    const layer = this.layers[this.layers.length - 1];
    if (!layer || !this.pour) return 1;
    this.pour.on = holding;
    if (holding) {
      const rate = layer.target / (this.reduced ? this.pour.ms / 3 : this.pour.ms);
      layer.height = Math.min(layer.target, layer.height + rate * dt * 1000);
      this.agitation = Math.min(1, this.agitation + dt * 4);
      if (!this.reduced && Math.random() < dt * 22) this._spawnSwirl(layer);
      if (Math.random() < dt * 30) this._spawnDrop(SPOUT_X, this.surface - 4, layer.top);
    }
    return layer.height / layer.target;
  }

  endPour() { this.pour = null; }

  beginIce(step) { this.iceQueue = step.count; this.iceTotal = step.count; this.iceTimer = 0; }

  advanceIce(dt, holding) {
    if (holding && this.iceQueue > 0) {
      this.iceTimer -= dt;
      if (this.iceTimer <= 0) {
        this._dropCube();
        this.iceQueue--;
        this.iceTimer = this.reduced ? 0.12 : 0.42;
      }
    }
    return (this.iceTotal - this.iceQueue) / this.iceTotal;
  }

  beginFoam(step) {
    this.foam = { tint: step.tint, amount: 0, target: 1, ms: this.reduced ? 500 : 1500 };
    this.foamTinted = this._tintFoam(step.tint);
  }

  advanceFoam(dt, holding) {
    if (!this.foam) return 1;
    if (holding) this.foam.amount = Math.min(1, this.foam.amount + (dt * 1000) / this.foam.ms);
    return this.foam.amount;
  }

  // garnish runs on its own timer; returns a promise resolved when settled
  garnish(id) {
    return new Promise(res => {
      // never let a garnish stall the flow
      let done = false;
      const resolve = () => { if (!done) { done = true; clearTimeout(guard); res(); } };
      const guard = setTimeout(resolve, 5000);
      if (id === 'petal') {
        const fw = this._foamBox().w;
        this.petal = { x: CX + fw * 0.12, y: -140, vy: 0, rot: -0.6, vr: 1.4, landed: false, onLiquid: false, resolve };
      } else {
        const n = this.reduced ? 60 : 140;
        this.dustColor = id === 'cocoa' ? '#4a2a17' : '#8a4b1e';
        for (let i = 0; i < n; i++) {
          // bias toward the middle of the dome, like a sieve held over it
          const u = (Math.random() + Math.random() - 1) * 0.4;
          this.dustFalling.push({
            x: CX + u * this._foamBox().w,
            y: SPOUT_Y + rand(-200, 40),
            vy: rand(160, 260), r: rand(1, 2.2), a: rand(0.35, 0.8),
            sink: rand(6, 46)      // how far below the top edge it comes to rest
          });
        }
        this.dustResolve = resolve;
      }
    });
  }

  present() { this.presented = true; this.sparkle = true; }

  // Drink-down. Returns fraction remaining 0..1.
  sip(dt, holding) {
    if (!holding) { this.sipping = false; return this._remaining(); }
    this.sipping = true;
    // foam first
    if (this.foam && this.foam.amount > 0) {
      this.foam.amount = Math.max(0, this.foam.amount - dt * 0.55);
      if (this.foam.amount === 0 && this.petal && !this.petal.onLiquid) {
        this.petal.onLiquid = true; this.petal.vy = 0; this.petal.landed = false;
      }
      return this._remaining();
    }
    let take = dt * 0.16;  // glass units per second
    while (take > 0 && this.layers.length) {
      const top = this.layers[this.layers.length - 1];
      const d = Math.min(take, top.height);
      top.height -= d; take -= d;
      if (top.height <= 0.0005) this.layers.pop();
    }
    this.agitation = Math.min(1, this.agitation + dt * 2);
    return this._remaining();
  }

  _remaining() {
    const liquid = this.layers.reduce((s, l) => s + l.height, 0);
    const total = this._totalTarget || 1;
    const foamPart = this.foam ? this.foam.amount * 0.12 : 0;
    return clamp((liquid + foamPart) / (total + 0.12), 0, 1);
  }

  lockTotals() { this._totalTarget = this.layers.reduce((s, l) => s + l.target, 0); }

  // Internals ---------------------------------------------------------------

  _spawnSwirl(layer) {
    const y = this.surface;
    this.swirls.push({
      x: SPOUT_X + rand(-10, 10), y: y + rand(0, 10),
      r: rand(6, 12), vr: rand(28, 48), vy: rand(50, 110), vx: rand(-40, 40),
      a: 0.55, color: layer.top, life: 0
    });
  }

  _spawnDrop(x, y, color) {
    this.drops.push({ x: x + rand(-8, 8), y, vx: rand(-90, 90), vy: rand(-220, -80), r: rand(1.5, 3.2), color, life: 0 });
  }

  _dropCube() {
    const imgs = this.art.ice;
    const n = this.ice.length;
    const depth = [-0.55, 0.45, -0.1, 0.7, -0.75, 0.2][n % 6];
    const lane = [-0.45, 0.4, 0.05, -0.15, 0.55, -0.6][n % 6];
    const scale = 0.5 + (depth < 0 ? -0.06 : 0.04) + rand(-0.02, 0.02);
    const img = imgs[n % imgs.length];
    this.ice.push({
      img, scale, depth, lane,
      x: CX + lane * rx(this.surface) * 0.75,
      y: SPOUT_Y - rand(0, 60), vy: rand(0, 120),
      rot: rand(-0.4, 0.4), vr: rand(-2.2, 2.2), restRot: rand(-0.14, 0.14),
      phase: rand(0, TAU), settled: false, splashed: false
    });
    this.ripples.length = 0;
  }

  _foamBox() {
    const yTop = this.surface;                    // liquid surface centre
    const wAvail = 2 * rx(Math.max(yTop, RIM_Y + 60)) * 1.02;
    const s = wAvail / this.art.foam.width;
    return { w: wAvail, h: this.art.foam.height * s, s, bottom: yTop + 14 };
  }

  _profile(img) {
    // first opaque row for each column, in image pixels
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, img.width, img.height).data;
    const prof = new Float32Array(img.width);
    for (let col = 0; col < img.width; col++) {
      let row = 0;
      for (; row < img.height; row++) if (d[(row * img.width + col) * 4 + 3] > 120) break;
      prof[col] = row;
    }
    return prof;
  }

  // Bake the foam sprite: neutral base * recipe tint, plus (once garnished) a
  // haze of dust over the upper dome. Masked to the foam's own alpha so nothing
  // leaks onto the wall behind it.
  _tintFoam(tint, haze = 0) {
    const img = this.art.foam;
    const c = this.foamCanvas;
    const w = img.width, h = img.height;
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.clearRect(0, 0, w, h);
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = tint;
    x.fillRect(0, 0, w, h);
    if (haze > 0) {
      const dc = this.dustColor || '#4a2a17';
      const g = x.createRadialGradient(w * 0.52, h * 0.3, 8, w * 0.5, h * 0.38, w * 0.5);
      g.addColorStop(0, mix(dc, '#ffffff', 1 - 0.85 * haze));
      g.addColorStop(0.65, mix(dc, '#ffffff', 1 - 0.45 * haze));
      g.addColorStop(1, '#ffffff');
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
    }
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-over';
    this.hazeBaked = haze;
    return c;
  }

  // Update -------------------------------------------------------------------

  update(dt) {
    this.time += dt;
    this.agitation = Math.max(0, this.agitation - dt * 0.9);
    const surf = this.surface;

    // swirls (marbling inside the liquid)
    for (const s of this.swirls) {
      s.life += dt; s.r += s.vr * dt; s.y += s.vy * dt; s.x += s.vx * dt;
      s.vy *= 0.97; s.a -= dt * 0.55;
    }
    this.swirls = this.swirls.filter(s => s.a > 0);

    // droplets
    for (const d of this.drops) {
      d.life += dt; d.vy += 1500 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
    }
    this.drops = this.drops.filter(d => d.life < 0.6 && d.y < surf + 40);

    // ripples
    for (const r of this.ripples) { r.t += dt * 1.6; }
    this.ripples = this.ripples.filter(r => r.t < 1);

    // ice
    for (const c of this.ice) {
      const size = c.img.width * c.scale;
      const half = size / 2;
      const hasLiquid = this.level > 0.02;
      const floatY = surf + c.depth * ry(surf) * 0.7 + half * 0.22;
      const floorY = FLOOR_Y + c.depth * ry(FLOOR_Y) * 0.7 - half * 0.62;
      const target = hasLiquid ? Math.min(floatY, floorY) : floorY;
      c.floating = hasLiquid && floatY < floorY;
      c.x = CX + c.lane * rx(target) * 0.72;
      const gap = target - c.y;
      if (gap > 14 || c.vy < -60) {
        // free fall (or bouncing back up)
        c.vy += 1700 * dt;
        c.y += c.vy * dt;
        c.rot += c.vr * dt;
        c.settled = false;
        if (c.y >= target) {
          c.y = target;
          if (!c.splashed && hasLiquid) {
            c.splashed = true;
            this.ripples.push({ x: c.x, y: surf, t: 0 });
            const topColor = this.layers.length ? this.layers[this.layers.length - 1].top : '#ffffff';
            for (let i = 0; i < 10; i++) this._spawnDrop(c.x, surf, topColor);
            this.agitation = 1;
          }
          c.vy = Math.abs(c.vy) > 160 ? -c.vy * 0.28 : 0;
        }
      } else {
        // resting: buoyancy, or riding a surface that is being drunk down
        c.y += gap * Math.min(1, 9 * dt);
        c.vy = 0; c.settled = true;
        c.rot += (c.restRot - c.rot) * Math.min(1, 3 * dt);
      }
    }

    // dust falling onto foam
    if (this.dustFalling.length) {
      const fb = this._foamBox();
      for (const p of this.dustFalling) {
        p.vy += 500 * dt; p.y += p.vy * dt;
        const col = clamp(Math.round((p.x - (CX - fb.w / 2)) / fb.s), 0, this.foamProfile.length - 1);
        const landY = fb.bottom - fb.h + this.foamProfile[col] * fb.s + p.sink * fb.s;
        if (p.y >= landY) {
          this.dust.push({ u: (p.x - CX) / fb.w, v: (landY - (fb.bottom - fb.h)) / fb.h, r: p.r, a: p.a });
          p.done = true;
        }
      }
      this.dustFalling = this.dustFalling.filter(p => !p.done);
      const haze = Math.min(1, this.dust.length / 90);
      if (this.foam && Math.abs(haze - (this.hazeBaked || 0)) > 0.06) this.foamTinted = this._tintFoam(this.foam.tint, haze);
      if (!this.dustFalling.length && this.dustResolve) {
        this.foamTinted = this._tintFoam(this.foam.tint, 1);
        this.dustResolve(); this.dustResolve = null;
      }
    }

    // petal
    if (this.petal) {
      const p = this.petal;
      const fb = this._foamBox();
      const foamAlive = this.foam && this.foam.amount > 0.05;
      let landY;
      if (foamAlive && !p.onLiquid) {
        const col = clamp(Math.round((p.x - (CX - fb.w / 2)) / fb.s), 0, this.foamProfile.length - 1);
        const top = fb.bottom - fb.h * this.foam.amount;
        landY = top + this.foamProfile[col] * fb.s * this.foam.amount - 6;
      } else {
        p.onLiquid = true;
        landY = (this.level > 0.02 ? surf : FLOOR_Y) + ry(surf) * 0.25;
      }
      if (p.y < landY - 1 && !p.landed) {
        p.vy += 520 * dt; p.y += Math.min(p.vy, 380) * dt; p.rot += p.vr * dt;
        p.x += Math.sin(this.time * 6) * 30 * dt;
        if (p.y >= landY) { p.y = landY; p.landed = true; }
      } else {
        p.landed = true;
        p.y += (landY - p.y) * Math.min(1, 8 * dt);
        p.rot += (0.25 - p.rot) * Math.min(1, 2 * dt);
      }
      if (p.landed && p.resolve) { p.resolve(); p.resolve = null; }
    }
  }

  // Draw --------------------------------------------------------------------

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    const level = this.level;
    const surf = this.surface;
    const wob = this.reduced ? 0 : Math.sin(this.time * 7) * 0.05 * this.agitation;

    // 1. liquid layers into the offscreen liquid canvas
    const l = this.lctx;
    l.clearRect(0, 0, W, H);
    if (level > 0.001) {
      let acc = 0;
      for (const layer of this.layers) {
        if (layer.height <= 0) continue;
        const yLow = surfaceY(acc), yHigh = surfaceY(acc + layer.height);
        bodyPath(l, yLow, yHigh, wob);
        const g = l.createLinearGradient(0, yLow, 0, yHigh);
        g.addColorStop(0, layer.color);
        g.addColorStop(1, mix(layer.color, layer.top, 0.35));
        l.fillStyle = g;
        l.fill();
        acc += layer.height;
      }
      // soft mixing bands at each interface
      acc = 0;
      for (let i = 0; i < this.layers.length - 1; i++) {
        acc += this.layers[i].height;
        const upper = this.layers[i + 1];
        if (upper.height <= 0.005) continue;
        const y = surfaceY(acc);
        const band = 26 + 30 * Math.min(1, upper.height / 0.15);
        bodyPath(l, Math.min(y + band, surfaceY(acc - this.layers[i].height)), Math.max(y - band, surfaceY(acc + upper.height)), wob);
        const g = l.createLinearGradient(0, y + band, 0, y - band);
        g.addColorStop(0, rgba(this.layers[i].color, 0));
        g.addColorStop(0.45, rgba(mix(this.layers[i].top, upper.color, 0.5), 0.85));
        g.addColorStop(1, rgba(upper.color, 0));
        l.fillStyle = g;
        l.fill();
      }
      // marbling swirls, clipped to the liquid
      if (this.swirls.length) {
        l.save();
        bodyPath(l, FLOOR_Y, surf, wob);
        l.clip();
        for (const s of this.swirls) {
          const g = l.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
          g.addColorStop(0, rgba(s.color, s.a));
          g.addColorStop(1, rgba(s.color, 0));
          l.fillStyle = g;
          l.beginPath(); l.ellipse(s.x, s.y, s.r, s.r * 0.7, 0, 0, TAU); l.fill();
        }
        l.restore();
      }
      // side shading + a light band, clipped to the whole body
      l.save();
      bodyPath(l, FLOOR_Y, surf, wob);
      l.clip();
      const left = CX - rx(surf), right = CX + rx(surf);
      const sh = l.createLinearGradient(left, 0, right, 0);
      sh.addColorStop(0, 'rgba(60,25,10,.28)');
      sh.addColorStop(0.16, 'rgba(60,25,10,0)');
      sh.addColorStop(0.24, 'rgba(255,255,255,.14)');
      sh.addColorStop(0.36, 'rgba(255,255,255,0)');
      sh.addColorStop(0.8, 'rgba(60,25,10,0)');
      sh.addColorStop(1, 'rgba(60,25,10,.32)');
      l.fillStyle = sh;
      l.fillRect(0, 0, W, H);
      l.restore();
    }

    // 2. composite liquid, then surface disc
    ctx.drawImage(this.liquidCanvas, 0, 0, W, H);
    if (level > 0.001) {
      const top = this.layers[this.layers.length - 1];
      surfacePath(ctx, surf, wob);
      const g = ctx.createRadialGradient(CX - rx(surf) * 0.3, surf - ry(surf) * 0.3, 10, CX, surf, rx(surf));
      g.addColorStop(0, mix(top.top, '#ffffff', 0.22));
      g.addColorStop(1, mix(top.top, top.color, 0.25));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(CX, surf, rx(surf) - 4, ry(surf) * (1 + wob) - 3, 0, Math.PI * 1.1, Math.PI * 1.75);
      ctx.stroke();
      // ripples
      for (const r of this.ripples) {
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - r.t)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 12 + 60 * r.t, (12 + 60 * r.t) * RY_RATIO, 0, 0, TAU);
        ctx.stroke();
      }
    }

    // 3. ice, back to front, then re-submerge with translucent liquid
    const cubes = [...this.ice].sort((a, b) => a.depth - b.depth);
    for (const c of cubes) this._drawCube(ctx, c);
    if (level > 0.001 && cubes.length) {
      ctx.save();
      bodyPath(ctx, FLOOR_Y, surf, wob);
      ctx.clip();
      ctx.globalAlpha = 0.55;
      ctx.drawImage(this.liquidCanvas, 0, 0, W, H);
      ctx.restore();
    }

    // 4. foam + garnish
    if (this.foam && this.foam.amount > 0.001) {
      const fb = this._foamBox();
      const a = this.foam.amount;
      const eased = a < 1 ? a * (1 + 0.12 * Math.sin(a * Math.PI)) : 1;
      const h = fb.h * eased;
      ctx.drawImage(this.foamTinted, CX - fb.w / 2, fb.bottom - h, fb.w, h);
      if (this.dust.length) {
        ctx.fillStyle = this.dustColor || '#4a2a17';
        for (const d of this.dust) {
          ctx.globalAlpha = d.a * Math.min(1, a * 1.5);
          ctx.beginPath();
          ctx.arc(CX + d.u * fb.w, fb.bottom - h + d.v * h, d.r, 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
    if (this.dustFalling.length) {
      ctx.fillStyle = this.dustColor || '#4a2a17';
      for (const p of this.dustFalling) {
        ctx.globalAlpha = p.a;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (this.petal) this._drawPetal(ctx, this.petal);

    // 5. the glass itself, over everything inside it
    ctx.drawImage(this.art.glass, GX, GY);

    // 6. pour stream + droplets, above the glass
    if (this.pour && this.pour.on) this._drawStream(ctx, surf);
    for (const d of this.drops) {
      ctx.fillStyle = rgba(d.color, 0.9 * (1 - d.life / 0.6));
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill();
    }

    // 7. sparkles once the drink is presented
    if (this.sparkle && !this.reduced) this._drawSparkles(ctx);
  }

  _drawCube(ctx, c) {
    const size = c.img.width * c.scale;
    ctx.save();
    ctx.translate(c.x, c.y + (c.floating && c.settled ? Math.sin(this.time * 2.2 + c.phase) * 2.5 : 0));
    ctx.rotate(c.rot);
    ctx.globalAlpha = c.depth < 0 ? 0.9 : 1;
    ctx.drawImage(c.img, -size / 2, -size / 2, size, size * (c.img.height / c.img.width));
    ctx.restore();
  }

  _drawPetal(ctx, p) {
    const img = this.art.petal;
    const s = 0.5;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, 0.72);
    ctx.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s);
    ctx.restore();
  }

  _drawStream(ctx, surf) {
    const t = this.time;
    const y0 = SPOUT_Y, y1 = surf + ry(surf) * 0.15;
    const segs = 18;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const f = i / segs;
      const y = lerp(y0, y1, f);
      const sway = this.reduced ? 0 : Math.sin(f * 9 - t * 14) * 3.2 * f + Math.sin(t * 3) * 1.5;
      pts.push([SPOUT_X + sway, y, lerp(15, 7, f)]);
    }
    // outer ribbon
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.pour.color;
    for (let i = 0; i < segs; i++) {
      ctx.lineWidth = pts[i][2];
      ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
    }
    // light core
    ctx.strokeStyle = rgba(this.pour.top, 0.75);
    for (let i = 0; i < segs; i++) {
      ctx.lineWidth = pts[i][2] * 0.38;
      ctx.beginPath(); ctx.moveTo(pts[i][0] - 2, pts[i][1]); ctx.lineTo(pts[i + 1][0] - 2, pts[i + 1][1]); ctx.stroke();
    }
    // splash pool at impact
    ctx.fillStyle = rgba(this.pour.top, 0.55);
    ctx.beginPath();
    ctx.ellipse(SPOUT_X, y1, 22 + Math.sin(t * 20) * 3, 8, 0, 0, TAU);
    ctx.fill();
  }

  _drawSparkles(ctx) {
    const spots = [
      [CX + rx(RIM_Y) - 12, RIM_Y - 30, 0], [CX - rx(RIM_Y + 200) + 22, RIM_Y + 210, 2.1],
      [CX + rx(RIM_Y + 380) - 26, RIM_Y + 400, 4.2], [CX - 20, RIM_Y - 58, 1.2]
    ];
    for (const [x, y, ph] of spots) {
      const a = Math.pow(Math.max(0, Math.sin(this.time * 1.6 + ph)), 3);
      if (a < 0.02) continue;
      const r = 5 + 7 * a;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = `rgba(255,255,255,${0.9 * a})`;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const ang = i * Math.PI / 2;
        ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        ctx.lineTo(Math.cos(ang + Math.PI / 4) * r * 0.28, Math.sin(ang + Math.PI / 4) * r * 0.28);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
