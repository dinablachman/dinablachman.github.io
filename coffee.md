---
layout: coffee
title: the counter
description: make yourself an iced coffee. purely for the sake of it.
permalink: /coffee/
sitemap: false
---

<div id="coffee" class="coffee" data-art="{{ '/assets/coffee/art/' | relative_url }}">

  <section id="menu" class="menu" aria-label="menu">
    <div class="menu__paper">
      <header class="menu__head">
        <p class="menu__eyebrow">the counter</p>
        <h1 class="menu__title">iced, specialty</h1>
        <p class="menu__note">pick one. i'll walk you through it.</p>
      </header>
      <ul class="menu__list" id="menu-list" role="list"></ul>
      <p class="menu__foot">all drinks: same glass, same ice, same pour.</p>
    </div>
  </section>

  <section id="counter" class="counter" aria-label="coffee counter" hidden>
    <div class="stage" id="stage">
      <canvas id="scene" class="scene" width="700" height="1040" aria-label="your drink being assembled"></canvas>
    </div>

    <div class="hud">
      <div class="dialog" id="dialog" role="status" aria-live="polite">
        <span class="dialog__tag" id="dialog-tag">barista</span>
        <p class="dialog__text" id="dialog-text"></p>
      </div>
      <button class="hold" id="hold" type="button" aria-describedby="dialog-text">
        <span class="hold__ring" aria-hidden="true"><span class="hold__fill" id="hold-fill"></span></span>
        <span class="hold__label" id="hold-label">hold to pour</span>
      </button>
      <button class="ghost" id="again" type="button" hidden>back to the menu</button>
    </div>
  </section>

</div>
