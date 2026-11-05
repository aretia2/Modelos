/* Orquestación: scroll suave (Lenis), estados del reloj por sección, revelados de texto y UI */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LIGHT = { bg: '#e8e8e6', ink: '#111214', pc: [0.12, 0.12, 0.13] };
  const DARK = { bg: '#050506', ink: '#f2f2f0', pc: [0.92, 0.92, 0.92] };
  const HALF_PI = Math.PI / 2;

  // Pose del reloj en cada sección (x, y, escala, rotaciones, despiece, brazalete desplegado,
  // fila de acabados, mezcla/opacidad de partículas y colores de fondo/tinta)
  const STATES = {
    hero:     { x: 0,     y: -0.05, s: 1,    rx: 0.16,  ry: -0.32, rz: 0.06, e: 0, u: 0, row: 0, pm: 0,   po: 0.28, ...LIGHT },
    chrono:   { x: 1.05,  y: 0,     s: 1.05, rx: -0.18, ry: 2.6,   rz: -0.3, e: 0, u: 0, row: 0, pm: 0.15, po: 0.22, ...LIGHT },
    profile:  { x: -0.55, y: 0.05,  s: 0.95, rx: 0.04,  ry: -HALF_PI, rz: 0, e: 0, u: 0, row: 0, pm: 0.3, po: 0.25, ...LIGHT },
    heart:    { x: 0.5,   y: -0.05, s: 0.82, rx: 0.24,  ry: -1.12, rz: 0.04, e: 1, u: 0, row: 0, pm: 1,   po: 0.85, ...DARK },
    bracelet: { x: 0,     y: -0.2,  s: 0.95, rx: -0.6,  ry: 0,     rz: HALF_PI, e: 0, u: 1, row: 0, pm: 0.2, po: 0.2, ...LIGHT },
    steel:    { x: -0.15, y: -0.1,  s: 1.2,  rx: 0.38,  ry: -0.6,  rz: 0.45, e: 0, u: 0, row: 0, pm: 0.6, po: 0.3, ...LIGHT },
    colors:   { x: 0,     y: 0,     s: 0,    rx: 0.1,   ry: -0.3,  rz: 0,    e: 0, u: 0, row: 1, pm: 0.3, po: 0.2, ...LIGHT },
    finale:   { x: 1.0,   y: -0.05, s: 1.05, rx: 0.26,  ry: -0.48, rz: -0.12, e: 0, u: 0, row: 0, pm: 0.7, po: 0.32, ...LIGHT },
  };
  const NUM_KEYS = ['x', 'y', 's', 'rx', 'ry', 'rz', 'e', 'u', 'row', 'pm', 'po'];

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixHex = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
  };

  function lerpState(a, b, t) {
    const o = {};
    NUM_KEYS.forEach((k) => { o[k] = a[k] + (b[k] - a[k]) * t; });
    o.pc = a.pc.map((v, i) => v + (b.pc[i] - v) * t);
    o.bg = mixHex(a.bg, b.bg, t);
    o.ink = mixHex(a.ink, b.ink, t);
    return o;
  }

  /* ---------- texto partido en caracteres ---------- */
  $$('[data-split]').forEach((el) => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text].map((ch, i) =>
      `<span class="ch" aria-hidden="true" style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  });

  /* ---------- escena ---------- */
  const canvas = $('#webgl');
  let world = null;
  try { world = WatchScene(canvas); } catch (err) { console.error(err); document.body.classList.add('no-webgl'); }

  /* ---------- scroll suave ---------- */
  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target) => (lenis ? lenis.scrollTo(target, { duration: 1.6 }) : $(target).scrollIntoView({ behavior: 'smooth' }));
  $$('[data-goto]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollTo(a.getAttribute('data-goto')); }));

  /* ---------- tramos de scroll: cada sección mantiene su pose en la parte central de su recorrido sticky ---------- */
  const sections = $$('[data-state]');
  let zones = [];
  function measure() {
    const vh = window.innerHeight;
    zones = sections.map((sec) => {
      const top = sec.offsetTop, len = Math.max(sec.offsetHeight - vh, 0);
      return { a: top + len * 0.3, b: top + len * 0.7, st: STATES[sec.dataset.state] };
    });
  }
  measure();

  function stateAt(y) {
    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      if (y <= z.b) {
        if (y >= z.a || i === 0) return { st: lerpState(z.st, z.st, 0), idx: i };
        const prev = zones[i - 1];
        const t = ease(clamp((y - prev.b) / (z.a - prev.b), 0, 1));
        return { st: lerpState(prev.st, z.st, t), idx: t > 0.5 ? i : i - 1 };
      }
    }
    const last = zones[zones.length - 1];
    return { st: lerpState(last.st, last.st, 0), idx: zones.length - 1 };
  }

  /* ---------- ratón ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  });

  /* ---------- bucle ---------- */
  const root = document.documentElement;
  const counterEl = $('.hud__index');
  const bar = $('.hud__bar i');
  let lastIdx = -1;
  const t0 = performance.now();

  gsap.ticker.add(() => {
    const y = window.scrollY;
    const { st, idx } = stateAt(y);
    root.style.setProperty('--bg', st.bg);
    root.style.setProperty('--ink', st.ink);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleY(${max > 0 ? y / max : 0})`;
    if (idx !== lastIdx) {
      lastIdx = idx;
      counterEl.textContent = String(idx + 1).padStart(2, '0');
      $$('.nav__links a').forEach((a) => a.classList.toggle('is-active', a.dataset.goto === `#${sections[idx].id}`));
    }

    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    if (world) {
      world.apply(st, reduced ? { x: 0, y: 0 } : mouse, (performance.now() - t0) / 1000);
      world.render();
    }
  });

  window.addEventListener('resize', () => {
    if (world) world.resize();
    measure();
    ScrollTrigger.refresh();
  });

  /* ---------- revelados por sección ---------- */
  sections.forEach((sec) => {
    if (sec.id === 'hero') return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 45%', end: 'bottom 55%',
      toggleClass: { targets: sec, className: 'is-in' },
    });
  });

  const counter = $('.jewels__num');
  const jewels = { v: 0 };
  ScrollTrigger.create({
    trigger: '#heart', start: 'top 40%',
    onEnter: () => gsap.to(jewels, {
      v: 27, duration: 1.8, ease: 'power3.out',
      onUpdate: () => { counter.textContent = Math.round(jewels.v); },
    }),
  });

  /* ---------- acabados ---------- */
  const finishName = $('.finish__name');
  $$('[data-finish]').forEach((btn) => btn.addEventListener('click', () => {
    $$('[data-finish]').forEach((b) => b.classList.toggle('is-active', b === btn));
    if (world) world.select(btn.dataset.finish);
    finishName.textContent = HXWatch.FINISHES[btn.dataset.finish].label;
  }));

  /* ---------- precarga ---------- */
  const loader = $('.loader');
  const loadNum = $('.loader__num');
  const prog = { v: 0 };
  if (lenis) lenis.stop();
  gsap.timeline()
    .to(prog, {
      v: 100, duration: reduced ? 0.2 : 1.4, ease: 'power2.inOut',
      onUpdate: () => { loadNum.textContent = Math.round(prog.v); },
    })
    .to(loader, { yPercent: -100, duration: reduced ? 0.2 : 1.1, ease: 'expo.inOut' })
    .add(() => {
      loader.remove();
      $('#hero').classList.add('is-in');
      if (lenis) lenis.start();
      measure();
    }, '-=0.6');
})();
