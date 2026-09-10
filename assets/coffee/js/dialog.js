// Stardew-style dialog: one box, typewriter text, click to hurry.

export class Dialog {
  constructor(root, opts = {}) {
    this.root = root;
    this.tagEl = root.querySelector('#dialog-tag');
    this.textEl = root.querySelector('#dialog-text');
    this.speed = opts.reducedMotion ? 0 : 26;
    this._timer = null;
    this._skip = null;
    root.addEventListener('pointerdown', () => { if (this._skip) this._skip(); });
  }

  // Types `text` and resolves once fully shown (plus a short beat).
  say(text, { tag = 'barista', hold = 700 } = {}) {
    this.cancel();
    this.tagEl.textContent = tag;
    this.root.classList.add('is-on');
    this.root.classList.remove('is-done');
    this.textEl.textContent = '';
    return new Promise(resolve => {
      let i = 0;
      const finish = () => {
        this.cancel();
        this.textEl.textContent = text;
        this.root.classList.add('is-done');
        this._skip = null;
        setTimeout(resolve, hold);
      };
      this._skip = finish;
      if (this.speed === 0) { finish(); return; }
      this._timer = setInterval(() => {
        i++;
        this.textEl.textContent = text.slice(0, i);
        if (i >= text.length) finish();
      }, this.speed);
    });
  }

  // Sets a persistent prompt without the typing beat.
  prompt(text, tag = 'barista') {
    this.cancel();
    this.tagEl.textContent = tag;
    this.textEl.textContent = text;
    this.root.classList.add('is-on');
    this.root.classList.remove('is-done');
  }

  cancel() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  hide() { this.cancel(); this.root.classList.remove('is-on', 'is-done'); }
}
