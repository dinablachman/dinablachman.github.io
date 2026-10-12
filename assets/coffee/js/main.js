import { RECIPES } from './recipes.js';
import { Drink, H, GLASS_FOOT } from './drink.js';
import { Dialog } from './dialog.js';

const root = document.getElementById('coffee');
const ART = root.dataset.art;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const el = {
  menu: document.getElementById('menu'),
  menuList: document.getElementById('menu-list'),
  counter: document.getElementById('counter'),
  stage: document.getElementById('stage'),
  canvas: document.getElementById('scene'),
  dialog: document.getElementById('dialog'),
  hold: document.getElementById('hold'),
  holdLabel: document.getElementById('hold-label'),
  holdRing: document.querySelector('.hold__ring'),
  again: document.getElementById('again')
};

const dialog = new Dialog(el.dialog, { reducedMotion });
const sleep = ms => new Promise(r => setTimeout(r, reducedMotion ? Math.min(ms, 120) : ms));

// ---------------------------------------------------------------- menu

function buildMenu() {
  el.menuList.innerHTML = '';
  for (const r of RECIPES) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'menu__item';
    b.dataset.id = r.id;
    b.innerHTML = `
      <span class="menu__swatch" style="--swatch:${r.swatch}" aria-hidden="true"></span>
      <span>
        <span class="menu__name">${r.name}</span>
        <span class="menu__desc">${r.blurb}</span>
      </span>
      <span class="menu__star" aria-hidden="true">★</span>`;
    b.addEventListener('click', () => order(r));
    li.appendChild(b);
    el.menuList.appendChild(li);
  }
}

// ---------------------------------------------------------------- art

function loadImage(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('failed to load ' + name));
    img.src = ART + name;
  });
}

let artPromise = null;
function loadArt() {
  if (!artPromise) {
    artPromise = Promise.all([
      loadImage('glass.png'), loadImage('ice-a.png'), loadImage('ice-b.png'),
      loadImage('ice-c.png'), loadImage('foam.png'), loadImage('petal.png')
    ]).then(([glass, a, b, c, foam, petal]) => ({ glass, ice: [a, b, c], foam, petal }));
  }
  return artPromise;
}

// ---------------------------------------------------------------- stage fit

let baseScale = 1;
let availH = 600;
let stagePose = 'counter';   // counter | present | sip

function fitStage() {
  const hud = parseFloat(getComputedStyle(root).getPropertyValue('--hud-h')) || 168;
  availH = window.innerHeight - hud - 8;
  const availW = window.innerWidth;
  baseScale = Math.min(availH / H, availW / 520);
  applyPose(true);
}

// transform-origin is the stage centre. Pin the glass foot (canvas y = GLASS_FOOT)
// to a screen line so scaling toward the viewer never pushes it under the HUD.
function pose(scale, footY, rot) {
  const ty = footY - H / 2 - (GLASS_FOOT - H / 2) * scale;
  return `translate(-50%, ${ty.toFixed(1)}px) rotate(${rot}deg) scale(${scale.toFixed(4)})`;
}

function applyPose(instant = false) {
  const s = baseScale;
  let t;
  if (stagePose === 'present') t = pose(s * 1.14, availH + availH * 0.015, 0);
  else if (stagePose === 'sip') t = pose(s * 1.18, availH - availH * 0.02, -4);
  else t = pose(s, availH - 4, 0);
  if (instant) el.stage.classList.add('is-instant');
  el.stage.style.transform = t;
  if (instant) requestAnimationFrame(() => el.stage.classList.remove('is-instant'));
}

window.addEventListener('resize', fitStage);

// ---------------------------------------------------------------- hold input

const hold = { down: false, enabled: false };

// The button is never truly `disabled`: a disabled control swallows the
// pointerup that ends a hold, which can leave state stuck. Instead we flag it
// off and ignore input.
function setHold(enabled, label) {
  hold.enabled = enabled;
  el.hold.classList.toggle('is-off', !enabled);
  el.hold.setAttribute('aria-disabled', String(!enabled));
  if (label) el.holdLabel.textContent = label;
  if (!enabled) { hold.down = false; el.hold.classList.remove('is-holding'); }
  setRing(0);
}
function setRing(p) { el.holdRing.style.setProperty('--p', p.toFixed(3)); }

function onDown(e) {
  if (!hold.enabled) return;
  if (e && e.preventDefault) e.preventDefault();
  hold.down = true;
  el.hold.classList.add('is-holding');
}
function onUp() {
  if (!hold.down) return;
  hold.down = false;
  el.hold.classList.remove('is-holding');
}
el.hold.addEventListener('pointerdown', onDown);
// release anywhere ends the hold, so dragging off the button is safe
window.addEventListener('pointerup', onUp);
window.addEventListener('pointercancel', onUp);
window.addEventListener('blur', onUp);
document.addEventListener('visibilitychange', () => { if (document.hidden) onUp(); });
el.hold.addEventListener('keydown', e => {
  if ((e.key === ' ' || e.key === 'Enter') && hold.enabled) { e.preventDefault(); if (!hold.down) onDown(); }
});
el.hold.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') onUp(); });
el.hold.addEventListener('contextmenu', e => e.preventDefault());

// ---------------------------------------------------------------- loop

let drink = null;
let stepFn = null;         // (dt, holding) => progress
let stepDone = null;       // resolve when progress hits 1
let last = performance.now();
let running = false;

function frame(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (stepFn) {
    const p = stepFn(dt, hold.down);
    setRing(p);
    if (p >= 1 && stepDone) { const d = stepDone; stepDone = null; stepFn = null; d(); }
  }
  drink.update(dt);
  drink.draw();
  requestAnimationFrame(frame);
}

function runHoldStep(label, fn) {
  return new Promise(resolve => {
    setHold(true, label);
    stepFn = fn;
    stepDone = () => { setHold(false); resolve(); };
  });
}

// ---------------------------------------------------------------- flow

async function order(recipe) {
  el.menu.classList.add('is-leaving');
  const art = await loadArt();
  await sleep(450);
  el.menu.hidden = true;
  el.counter.hidden = false;
  requestAnimationFrame(() => el.counter.classList.add('is-live'));

  if (!drink) drink = new Drink(el.canvas, art, { reducedMotion });
  else drink.reset();
  stagePose = 'counter';
  fitStage();
  setHold(false, 'hold to pour');
  el.again.hidden = true;
  running = true; last = performance.now();
  requestAnimationFrame(frame);

  await sleep(500);
  await dialog.say(recipe.intro, { tag: 'barista' });

  for (const step of recipe.steps) {
    if (step.kind === 'pour') {
      dialog.prompt(step.label);
      drink.beginPour(step);
      await runHoldStep(step.label, (dt, h) => drink.advancePour(dt, h));
      drink.endPour();
    } else if (step.kind === 'ice') {
      dialog.prompt(step.label);
      drink.beginIce(step);
      await runHoldStep(step.label, (dt, h) => drink.advanceIce(dt, h));
      await sleep(900);
    } else if (step.kind === 'foam') {
      dialog.prompt(step.label);
      drink.beginFoam(step);
      await runHoldStep(step.label, (dt, h) => drink.advanceFoam(dt, h));
    } else if (step.kind === 'garnish') {
      dialog.prompt('one more thing.');
      await drink.garnish(step.id);
      await sleep(400);
    }
    await sleep(250);
    await dialog.say(step.say);
  }

  // handoff
  drink.lockTotals();
  drink.present();
  stagePose = 'present';
  applyPose();
  await sleep(reducedMotion ? 200 : 900);
  await dialog.say(recipe.handoff, { tag: recipe.name });

  // drink
  dialog.prompt('hold to drink. take as long as you like.', recipe.name);
  await new Promise(resolve => {
    setHold(true, 'hold to drink');
    let wasDown = false;
    stepFn = (dt, holding) => {
      if (holding !== wasDown) {
        wasDown = holding;
        stagePose = holding ? 'sip' : 'present';
        applyPose();
      }
      const remaining = drink.sip(dt, holding);
      return drink.isEmpty ? 1 : 1 - remaining;
    };
    stepDone = () => { setHold(false); resolve(); };
  });
  stagePose = 'present';
  applyPose();
  await sleep(600);
  await dialog.say(recipe.empty, { tag: recipe.name, hold: 300 });
  el.hold.hidden = true;
  el.again.hidden = false;
}

el.again.addEventListener('click', () => {
  running = false;
  el.counter.classList.remove('is-live');
  el.again.hidden = true;
  el.hold.hidden = false;
  dialog.hide();
  setTimeout(() => {
    el.counter.hidden = true;
    el.menu.hidden = false;
    el.menu.classList.remove('is-leaving');
  }, reducedMotion ? 0 : 500);
});

buildMenu();
loadArt().catch(err => console.error(err));
