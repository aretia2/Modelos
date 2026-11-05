/* Olivar · modelo 04 — recorrido 3D ligado al scroll, secciones fijadas y calendario de reservas. */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (x) => x * x * (3 - 2 * x);
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (REDUCED) document.documentElement.classList.add('rm');

  /* =====================================================================
     1 · Scroll suave (Lenis) + ScrollTrigger
     ===================================================================== */
  let lenis = null;
  if (HAS_GSAP) gsap.registerPlugin(ScrollTrigger);
  if (!REDUCED && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 3.2) });
    if (HAS_GSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function goTo(sel) {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.6 });
    else el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-goto]');
    if (!a) return;
    e.preventDefault();
    closeMenu();
    goTo(a.getAttribute('data-goto'));
  });

  /* =====================================================================
     2 · Navegación: tema claro/oscuro, enlace activo, menú móvil
     ===================================================================== */
  const nav = $('.nav');
  const burger = $('.nav__burger');
  function closeMenu() { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });

  function updateNav() {
    const probe = 36;
    let theme = 'dark', active = 'casa';
    $$('[data-theme]').forEach((sec) => {
      if (sec === nav) return;
      const r = sec.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) {
        theme = sec.dataset.theme;
        if (sec.dataset.navSection) active = sec.dataset.navSection;
      }
    });
    if (nav.dataset.theme !== theme) nav.dataset.theme = theme;
    $$('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === active));
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* =====================================================================
     3 · Escena 3D y recorrido de cámara
     ===================================================================== */
  // Estados de cámara serializados: t ∈ [0,1] del contenedor #casa
  const STATES = [
    { t: 0.00, room: 'La casa',    pos: [-19, 1.7, 23],     look: [1.5, 3.3, 0],    fov: 34 },
    { t: 0.15, room: 'El jardín',  pos: [-13.5, 1.6, 10.5], look: [-4, 1.6, 2],     fov: 44 },
    { t: 0.29, room: 'El jardín',  pos: [-6.8, 1.75, 8.2],  look: [-6, 1.3, 0],     fov: 50 },
    { t: 0.43, room: 'Dormitorio', pos: [-6.1, 2.0, 2.9],   look: [-6, 0.75, -4],   fov: 56 },
    { t: 0.56, room: 'Dormitorio', pos: [-4.0, 2.0, 2.9],   look: [-0.5, 1.2, -1],  fov: 56 },
    { t: 0.70, room: 'Salón',      pos: [0.3, 2.0, -2.9],   look: [-0.6, 1.0, 4.5], fov: 56 },
    { t: 0.84, room: 'Salón',      pos: [2.3, 2.0, 2.6],    look: [6, 1.3, -1],     fov: 55 },
    { t: 1.00, room: 'Comedor',    pos: [3.1, 1.95, 3.3],   look: [7.6, 1.1, -2.6], fov: 52 },
  ];
  const ROOMS = [
    { from: 0.0, name: 'La casa' }, { from: 0.1, name: 'El jardín' }, { from: 0.37, name: 'Dormitorio' },
    { from: 0.63, name: 'Salón' }, { from: 0.9, name: 'Comedor' },
  ];
  // Vistas fijas que se renderizan como «fotos» para tarjetas y galería
  const SHOTS = {
    salon:      { pos: [1.3, 1.85, -3.3],   look: [-1.5, 0.75, 2.4], fov: 62, w: 720, h: 900 },
    dormitorio: { pos: [-6.25, 2.0, 3.5],   look: [-6, 0.75, -3.6],  fov: 58, w: 720, h: 900 },
    comedor:    { pos: [3.3, 1.95, 3.45],   look: [7.4, 1.0, -2.4],  fov: 56, w: 900, h: 1000 },
    cocina:     { pos: [8.5, 1.9, 1.3],     look: [4.6, 1.15, -2.7], fov: 58, w: 900, h: 1000 },
    salon2:     { pos: [-2.1, 1.95, -3.1],  look: [1.6, 1.0, 4.6],   fov: 60, w: 900, h: 1000 },
    terraza:    { pos: [10.2, 1.55, 9.6],   look: [-2, 2.0, 4],      fov: 50, w: 900, h: 1000 },
  };

  const stage = $('.tour__sticky');
  const canvas = $('#webgl');
  const heroEl = $('.hero');
  const titleEl = $('.tour__title');
  const hintEl = $('.tour__hint');
  const roomEl = $('.room');
  const roomName = $('[data-room]');
  const roomBar = $('.room__bar i');

  let three = null;          // { renderer, camera, scene }
  let tTarget = 0, tCur = 0, dirty = true, inView = true;
  const pointer = { x: 0, y: 0, cx: 0, cy: 0 };

  function initThree() {
    if (typeof window.THREE === 'undefined' || !window.OlivarScene) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) { return null; }
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // escena estática: el mapa de sombras se calcula una vez y se reutiliza en todos los fotogramas
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;

    const { scene } = window.OlivarScene.build(renderer);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);

    const curvePos = new THREE.CatmullRomCurve3(STATES.map((s) => new THREE.Vector3(...s.pos)), false, 'centripetal');
    const curveLook = new THREE.CatmullRomCurve3(STATES.map((s) => new THREE.Vector3(...s.look)), false, 'centripetal');
    return { renderer, scene, camera, curvePos, curveLook };
  }

  // Fondo de cielo para las «fotos» (en el recorrido el cielo es CSS, detrás del canvas)
  function skyTexture() {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, '#93b2cc'); grd.addColorStop(0.55, '#d9dccf'); grd.addColorStop(1, '#efe0c2');
    g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function takeShots() {
    const { renderer, scene, camera } = three;
    const urls = {};
    const prevBg = scene.background;
    scene.background = skyTexture();
    renderer.setPixelRatio(1);
    renderer.toneMappingExposure = 0.88;
    Object.keys(SHOTS).forEach((k) => {
      const v = SHOTS[k];
      renderer.setSize(v.w, v.h, false);
      camera.aspect = v.w / v.h; camera.fov = v.fov; camera.updateProjectionMatrix();
      camera.position.set(...v.pos); camera.lookAt(...v.look);
      renderer.render(scene, camera);
      urls[k] = renderer.domElement.toDataURL('image/jpeg', 0.86);
    });
    renderer.toneMappingExposure = 1.05;
    scene.background.dispose();
    scene.background = prevBg;
    $$('img[data-shot]').forEach((img) => {
      const u = urls[img.dataset.shot];
      if (u) { img.src = u; img.closest('figure') && img.closest('figure').classList.add('has-shot'); }
    });
    resize();
  }

  function resize() {
    if (!three) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    three.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    three.renderer.setSize(w, h, false);
    three.camera.aspect = w / h;
    dirty = true;
  }

  function stateAt(t) {
    // segmento + suavizado local: la cámara «se detiene» brevemente en cada estancia
    let i = 0;
    while (i < STATES.length - 2 && t > STATES[i + 1].t) i++;
    const a = STATES[i], b = STATES[i + 1];
    const local = smooth(clamp((t - a.t) / (b.t - a.t), 0, 1));
    const u = (i + local) / (STATES.length - 1);
    return { u, fov: a.fov + (b.fov - a.fov) * local };
  }

  const tmpLook = { x: 0, y: 0, z: 0 };
  function renderTour() {
    const { renderer, scene, camera, curvePos, curveLook } = three;
    const s = stateAt(tCur);
    const p = curvePos.getPoint(s.u);
    const l = curveLook.getPoint(s.u);
    camera.position.copy(p);
    tmpLook.x = l.x + pointer.cx * 0.9;
    tmpLook.y = l.y - pointer.cy * 0.4;
    tmpLook.z = l.z;
    // en pantallas verticales se abre el ángulo para conservar el encuadre horizontal
    const portrait = camera.aspect < 1 ? (1 - camera.aspect) * 0.75 : 0;
    camera.fov = s.fov * (1 + portrait);
    camera.updateProjectionMatrix();
    camera.lookAt(tmpLook.x, tmpLook.y, tmpLook.z);
    renderer.render(scene, camera);
  }

  function updateOverlay(t) {
    const heroK = clamp(1 - t / 0.07, 0, 1);
    heroEl.style.opacity = heroK;
    heroEl.style.transform = `translateY(${(1 - heroK) * 30}px)`;
    heroEl.style.pointerEvents = heroK < 0.2 ? 'none' : '';
    hintEl.style.opacity = clamp(1 - t / 0.03, 0, 1);
    const titleK = clamp(t / 0.12, 0, 1);
    titleEl.style.opacity = 1 - titleK;
    titleEl.style.transform = `translate3d(0, ${-titleK * 18}vh, 0) scale(${1 + titleK * 0.15})`;
    roomEl.classList.toggle('is-on', t > 0.08);
    let name = ROOMS[0].name;
    ROOMS.forEach((r) => { if (t >= r.from) name = r.name; });
    if (roomName.textContent !== name) {
      roomName.textContent = name;
      roomName.classList.remove('flip'); void roomName.offsetWidth; roomName.classList.add('flip');
    }
    roomBar.style.transform = `scaleX(${clamp((t - 0.08) / 0.92, 0, 1)})`;
  }

  function tourProgress() {
    const sec = $('#casa');
    const r = sec.getBoundingClientRect();
    const total = sec.offsetHeight - window.innerHeight;
    return clamp(-r.top / total, 0, 1);
  }

  function loop() {
    requestAnimationFrame(loop);
    tTarget = tourProgress();
    const k = REDUCED ? 1 : 0.085;
    const dt = tTarget - tCur;
    if (Math.abs(dt) > 0.00002) { tCur += dt * k; dirty = true; } else if (tCur !== tTarget) { tCur = tTarget; dirty = true; }
    const px = pointer.x - pointer.cx, py = pointer.y - pointer.cy;
    if (Math.abs(px) + Math.abs(py) > 0.0005) { pointer.cx += px * 0.06; pointer.cy += py * 0.06; dirty = true; }
    if (!dirty || !inView) return;
    dirty = false;
    updateOverlay(tCur);
    if (three) renderTour();
  }

  three = initThree();
  if (three) {
    takeShots();
    window.addEventListener('resize', resize);
    resize();
  } else {
    document.documentElement.classList.add('no-webgl');
  }
  if (!REDUCED && window.matchMedia('(pointer: fine)').matches) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width - 0.5);
      pointer.y = ((e.clientY - r.top) / r.height - 0.5);
    });
    stage.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; });
  }
  new IntersectionObserver((ent) => { inView = ent[0].isIntersecting; dirty = true; }).observe($('#casa'));
  requestAnimationFrame(loop);

  /* =====================================================================
     4 · Olivos en SVG (boceto «Dos pisos» y árbol de «Vive entre olivos»)
     ===================================================================== */
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function oliveSVG(g, o) {
    const R = rng(o.seed);
    const NS = 'http://www.w3.org/2000/svg';
    const branches = [], leaves = [];
    function grow(x, y, ang, len, w, depth) {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      const bend = (R() - 0.5) * len * 0.5;
      const cx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend, cy = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend;
      branches.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, w });
      if (depth <= 0 || len < 8) {
        for (let i = 0; i < o.leaves; i++) {
          leaves.push({ x: x2 + (R() - 0.5) * o.spread, y: y2 + (R() - 0.5) * o.spread * 0.7, r: R() * 180, s: 0.6 + R() * 0.7, c: R() });
        }
        return;
      }
      const n = depth > 2 ? 2 : 2 + (R() > 0.6 ? 1 : 0);
      for (let i = 0; i < n; i++) grow(x2, y2, ang + (R() - 0.5) * 1.3 + (i - (n - 1) / 2) * 0.55, len * (0.64 + R() * 0.15), w * 0.62, depth - 1);
    }
    grow(o.x, o.y, -Math.PI / 2 + (R() - 0.5) * 0.2, o.len, o.w, o.depth);
    const gb = document.createElementNS(NS, 'g'); gb.setAttribute('class', 'tree__wood');
    branches.forEach((b) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', b.d); p.setAttribute('stroke-width', b.w.toFixed(2));
      gb.appendChild(p);
    });
    const gl = document.createElementNS(NS, 'g'); gl.setAttribute('class', 'tree__leaves');
    leaves.forEach((l) => {
      const e = document.createElementNS(NS, 'ellipse');
      e.setAttribute('rx', (o.leaf * l.s).toFixed(1)); e.setAttribute('ry', (o.leaf * 0.32 * l.s).toFixed(1));
      e.setAttribute('transform', `translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.r.toFixed(0)})`);
      e.setAttribute('class', l.c > 0.66 ? 'lf lf--a' : l.c > 0.33 ? 'lf lf--b' : 'lf lf--c');
      gl.appendChild(e);
    });
    g.appendChild(gb); g.appendChild(gl);
  }
  oliveSVG($('.sketch__tree'), { seed: 5, x: 470, y: 300, len: 70, w: 16, depth: 5, leaves: 7, spread: 34, leaf: 10 });
  oliveSVG($('.olivos__tree'), { seed: 21, x: 150, y: 420, len: 110, w: 18, depth: 5, leaves: 6, spread: 26, leaf: 11 });
  // hojas de la maceta
  (function () {
    const g = $('.pot__leaves'); const NS = 'http://www.w3.org/2000/svg'; const R = rng(3);
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI / 2 + (i / 10 - 0.5) * 2.6;
      const L = 40 + R() * 38;
      const x2 = 80 + Math.cos(a) * L, y2 = 104 + Math.sin(a) * L;
      const stem = document.createElementNS(NS, 'path');
      stem.setAttribute('d', `M80 104Q${80 + Math.cos(a) * L * 0.4} ${104 + Math.sin(a) * L * 0.7} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
      stem.setAttribute('class', 'pot__stem'); g.appendChild(stem);
      const leaf = document.createElementNS(NS, 'path');
      const s = 13 + R() * 9;
      leaf.setAttribute('d', `M0 0C${s * 0.6} ${-s * 0.5} ${s * 1.4} ${-s * 0.3} ${s * 1.8} 0C${s * 1.4} ${s * 0.3} ${s * 0.6} ${s * 0.5} 0 0Z`);
      leaf.setAttribute('transform', `translate(${x2.toFixed(1)} ${y2.toFixed(1)}) rotate(${(a * 180 / Math.PI + (R() - 0.5) * 50).toFixed(0)})`);
      leaf.setAttribute('class', R() > 0.5 ? 'pot__leaf' : 'pot__leaf pot__leaf--b'); g.appendChild(leaf);
    }
  })();

  /* =====================================================================
     5 · Animaciones de secciones (GSAP ScrollTrigger)
     ===================================================================== */
  // revelados simples
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.18 });
  $$('[data-reveal]').forEach((el) => io.observe(el));

  const galImgs = $$('.planta__media img');
  const galCaps = ['Comedor', 'Cocina', 'Salón', 'Terraza'];
  let galIdx = 0;
  function setGallery(i) {
    if (i === galIdx) return;
    galIdx = i;
    galImgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
    $('[data-gal-i]').textContent = String(i + 1).padStart(2, '0');
    $('[data-gal-cap]').textContent = galCaps[i];
  }

  if (HAS_GSAP && !REDUCED) {
    // Dos pisos: el boceto se asienta y el titular entra
    gsap.timeline({ scrollTrigger: { trigger: '.pisos__intro', start: 'top 80%', end: 'bottom bottom', scrub: true } })
      .fromTo('.sketch', { scale: 1.18, opacity: 0, yPercent: 8 }, { scale: 1, opacity: 1, yPercent: 0, ease: 'none' }, 0)
      .fromTo('.pisos__title span', { yPercent: 110 }, { yPercent: 0, ease: 'power2.out', duration: 0.5 }, 0.3)
      .fromTo('.pisos__title em', { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'power2.out', duration: 0.5 }, 0.42);

    // Vive entre olivos
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.olivos', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
    tl.fromTo('.olivos__kicker', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.12 }, 0.02)
      .fromTo('.w--1', { xPercent: -120, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out' }, 0)
      .fromTo('.w--2', { xPercent: 120, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out' }, 0.03)
      .fromTo('.w--3', { yPercent: 80, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out' }, 0.1)
      .fromTo('.olivos__lamp', { yPercent: -120 }, { yPercent: 0, duration: 0.3, ease: 'power2.out' }, 0.08)
      .fromTo('.olivos__glow', { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.3)
      .fromTo('.olivos__tree', { scale: 0.3, opacity: 0, transformOrigin: '50% 100%' }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.16)
      .fromTo('.olivos__pot', { y: '45vh', rotate: -16, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.2)
      .to('.olivos__title', { '--ext': 1, duration: 0.2 }, 0.58)
      .to('.olivos__title', { y: '-14vh', scale: 0.86, duration: 0.3 }, 0.62)
      .to('.olivos__tree', { y: '-10vh', opacity: 0.25, duration: 0.3 }, 0.62)
      .to('.olivos__pot', { y: '-30vh', rotate: 8, duration: 0.3 }, 0.62)
      .fromTo('.olivos__aside', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.15 }, 0.66)
      .to('.olivos__kicker', { opacity: 0, duration: 0.1 }, 0.66)
      .to({}, { duration: 0.08 }, 0.92);

    // Una sola planta: galería que avanza con el scroll + rótulo gigante
    ScrollTrigger.create({
      trigger: '.planta', start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => setGallery(Math.min(galImgs.length - 1, Math.floor(self.progress * galImgs.length * 0.999))),
    });
    gsap.fromTo('.planta__ghost span', { xPercent: 0 }, { xPercent: -33.333, ease: 'none', scrollTrigger: { trigger: '.planta', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.planta__media', { clipPath: 'inset(18% 12% 18% 12% round 6px)' }, { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'none', scrollTrigger: { trigger: '.planta', start: 'top bottom', end: 'top top', scrub: true } });
  } else {
    // sin animación: la galería cambia por posición
    window.addEventListener('scroll', () => {
      const sec = $('.planta'); const r = sec.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, sec.offsetHeight - innerHeight), 0, 1);
      setGallery(Math.min(galImgs.length - 1, Math.floor(p * galImgs.length * 0.999)));
    }, { passive: true });
  }

  /* =====================================================================
     6 · Calendario de disponibilidad y presupuesto
     ===================================================================== */
  const PISOS = [
    { name: 'Primer piso · El jardín', price: 145, max: 4, sub: 'Hasta 4 huéspedes · 145 € la noche' },
    { name: 'Segundo piso · Las copas', price: 165, max: 2, sub: 'Hasta 2 huéspedes · 165 € la noche' },
  ];
  const CLEANING = 35;
  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cal = {
    piso: 0, guests: 2, offset: 0, checkIn: null, checkOut: null, hover: null,
  };
  const monthsEl = $('[data-months]');
  const key = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const fmt = (d) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()} ${d.getFullYear()}`;

  function isBusy(d, piso) {
    // ocupación ficticia determinista (bloques de 2-4 noches)
    const n = Math.floor(d.getTime() / 864e5);
    const block = Math.floor((n + piso * 3) / 3);
    const h = Math.sin(block * 12.9898 + piso * 78.233) * 43758.5453;
    return (h - Math.floor(h)) < 0.3;
  }
  function isPast(d) { return d < today; }
  function rangeFree(a, b, piso) {
    const d = new Date(a);
    while (d < b) { if (isBusy(d, piso)) return false; d.setDate(d.getDate() + 1); }
    return true;
  }

  function monthsVisible() { return window.innerWidth < 760 ? 1 : 2; }

  function renderCal() {
    const n = monthsVisible();
    const base = new Date(today.getFullYear(), today.getMonth() + cal.offset, 1);
    let html = '';
    for (let m = 0; m < n; m++) {
      const first = new Date(base.getFullYear(), base.getMonth() + m, 1);
      const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      const lead = (first.getDay() + 6) % 7;
      html += `<div class="month"><h4>${MONTHS[first.getMonth()]} de ${first.getFullYear()}</h4><div class="month__grid">`;
      html += DOW.map((d) => `<span class="dow">${d}</span>`).join('');
      for (let i = 0; i < lead; i++) html += '<span></span>';
      for (let d = 1; d <= days; d++) {
        const date = new Date(first.getFullYear(), first.getMonth(), d);
        const k = key(date);
        const past = isPast(date), busy = !past && isBusy(date, cal.piso);
        let cls = 'day';
        if (past) cls += ' day--past'; else if (busy) cls += ' day--busy'; else cls += ' day--free';
        const end = cal.checkOut || (cal.checkIn && cal.hover && cal.hover > cal.checkIn ? cal.hover : null);
        if (cal.checkIn && k === key(cal.checkIn)) cls += ' day--in';
        if (cal.checkOut && k === key(cal.checkOut)) cls += ' day--out';
        if (cal.checkIn && end && date > cal.checkIn && date < end) cls += ' day--range';
        if (!cal.checkOut && end && k === key(end)) cls += ' day--preview';
        if (k === key(today)) cls += ' day--today';
        const dis = past || (busy && !(cal.checkIn && !cal.checkOut && date > cal.checkIn));
        html += `<button type="button" class="${cls}" data-day="${k}" ${dis ? 'disabled' : ''} aria-label="${fmt(date)}${busy ? ', no disponible' : ''}">${d}</button>`;
      }
      html += '</div></div>';
    }
    monthsEl.innerHTML = html;
    $('[data-cal="-1"]').disabled = cal.offset <= 0;
    renderQuote();
  }

  function fromKey(k) { return new Date(Math.floor(k / 10000), Math.floor(k / 100) % 100 - 1, k % 100); }

  monthsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-day]');
    if (!b || b.disabled) return;
    const d = fromKey(+b.dataset.day);
    const msg = $('[data-q-msg]');
    if (!cal.checkIn || cal.checkOut || d <= cal.checkIn) {
      if (isBusy(d, cal.piso)) return;
      cal.checkIn = d; cal.checkOut = null;
    } else {
      const nights = Math.round((d - cal.checkIn) / 864e5);
      if (!rangeFree(cal.checkIn, d, cal.piso)) { msg.textContent = 'Hay noches ocupadas en medio. Prueba otro rango.'; msg.classList.add('is-warn'); return; }
      if (nights < 2) { msg.textContent = 'La estancia mínima es de 2 noches.'; msg.classList.add('is-warn'); return; }
      cal.checkOut = d;
    }
    renderCal();
  });
  monthsEl.addEventListener('pointerover', (e) => {
    if (!cal.checkIn || cal.checkOut) return;
    const b = e.target.closest('[data-day]');
    const h = b ? fromKey(+b.dataset.day) : null;
    if ((h && cal.hover && +h === +cal.hover) || (!h && !cal.hover)) return;
    cal.hover = h; renderCal();
  });
  $$('[data-cal]').forEach((b) => b.addEventListener('click', () => {
    cal.offset = clamp(cal.offset + +b.dataset.cal, 0, 11); renderCal();
  }));
  $$('[data-piso]').forEach((b) => b.addEventListener('click', () => setPiso(+b.dataset.piso)));

  function setPiso(p) {
    cal.piso = p;
    cal.checkIn = cal.checkOut = cal.hover = null;
    cal.guests = Math.min(cal.guests, PISOS[p].max);
    $$('[data-piso]').forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.piso === p)));
    renderCal();
  }

  function renderQuote() {
    const P = PISOS[cal.piso];
    $('[data-q-title]').textContent = P.name;
    $('[data-q-sub]').textContent = P.sub;
    $('[data-q-in]').textContent = cal.checkIn ? fmt(cal.checkIn) : 'Elige fecha';
    $('[data-q-out]').textContent = cal.checkOut ? fmt(cal.checkOut) : 'Elige fecha';
    $('[data-q-guests]').textContent = cal.guests;
    $('[data-q-gsub]').textContent = `Máximo ${P.max}`;
    const msg = $('[data-q-msg]');
    msg.classList.remove('is-warn');
    const go = $('[data-q-go]');
    if (cal.checkIn && cal.checkOut) {
      const n = Math.round((cal.checkOut - cal.checkIn) / 864e5);
      const sub = n * P.price;
      msg.innerHTML = `<span>${n} noches × ${P.price} €</span><b>${sub} €</b><span>Limpieza</span><b>${CLEANING} €</b><span class="tot">Total</span><b class="tot">${sub + CLEANING} €</b>`;
      msg.classList.add('is-sum');
      go.disabled = false;
    } else {
      msg.classList.remove('is-sum');
      msg.textContent = cal.checkIn ? 'Ahora elige el día de salida.' : 'Pulsa en dos fechas para marcar la estancia.';
      go.disabled = true;
    }
  }
  $$('[data-qstep]').forEach((b) => b.addEventListener('click', () => {
    cal.guests = clamp(cal.guests + +b.dataset.qstep, 1, PISOS[cal.piso].max); renderQuote();
  }));
  $('[data-q-go]').addEventListener('click', () => {
    if (!cal.checkIn || !cal.checkOut) return;
    toast(`Solicitud de demostración: ${PISOS[cal.piso].name}, del ${fmt(cal.checkIn)} al ${fmt(cal.checkOut)}, ${cal.guests} huésped${cal.guests > 1 ? 'es' : ''}. No se ha enviado nada.`);
  });
  let lastCols = monthsVisible();
  window.addEventListener('resize', () => { if (monthsVisible() !== lastCols) { lastCols = monthsVisible(); renderCal(); } });
  renderCal();

  // buscador de la portada → calendario
  const booker = $('[data-booker]');
  const bGuests = booker.querySelector('output');
  booker.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    const max = PISOS[+booker.piso.value].max;
    bGuests.textContent = clamp(+bGuests.textContent + +b.dataset.step, 1, max);
  }));
  booker.piso.addEventListener('change', () => {
    bGuests.textContent = Math.min(+bGuests.textContent, PISOS[+booker.piso.value].max);
  });
  booker.addEventListener('submit', (e) => {
    e.preventDefault();
    setPiso(+booker.piso.value);
    cal.guests = +bGuests.textContent;
    renderQuote();
    goTo('#disponibilidad');
  });

  /* =====================================================================
     7 · Panel del propietario + aviso
     ===================================================================== */
  const owner = $('.owner');
  let lastFocus = null;
  function openOwner() {
    lastFocus = document.activeElement;
    owner.hidden = false;
    requestAnimationFrame(() => owner.classList.add('is-open'));
    if (lenis) lenis.stop();
    $('.owner__close').focus();
  }
  function closeOwner() {
    owner.classList.remove('is-open');
    setTimeout(() => { owner.hidden = true; }, REDUCED ? 0 : 350);
    if (lenis) lenis.start();
    if (lastFocus) lastFocus.focus();
  }
  $('[data-owner]').addEventListener('click', () => { closeMenu(); openOwner(); });
  $('.owner__close').addEventListener('click', closeOwner);
  owner.addEventListener('click', (e) => { if (e.target === owner) closeOwner(); });
  $('.owner__new').addEventListener('click', () => toast('Demo: aquí se daría de alta un nuevo espacio.'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!owner.hidden) closeOwner(); closeMenu(); }
  });

  let toastTimer = 0;
  function toast(text) {
    const t = $('.toast');
    t.textContent = text;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 4200);
  }

  requestAnimationFrame(() => document.body.classList.add('is-ready'));
})();
