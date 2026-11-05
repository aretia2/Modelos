/* Orquestación del modelo 02: pins de GSAP, secuencias de fotos ligadas al scroll, carrusel, menú y reproductor */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (v) => { const x = clamp(v, 0, 1); return x * x * (3 - 2 * x); };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- scroll suave ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const goTo = (sel) => {
    const el = $(sel);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.8 }); else el.scrollIntoView({ behavior: 'smooth' });
  };

  /* ---------- cabecera ---------- */
  const header = $('.header');
  const promoH = $('.promo').offsetHeight;
  const heroEl = $('.hero');

  /* ---------- 01 portada: mosaico fijado que se oscurece ---------- */
  gsap.timeline({
    scrollTrigger: { trigger: heroEl, start: 'top top', end: '+=180%', scrub: true, pin: true },
  })
    .to('.mosaic', { scale: 1.28, ease: 'none', duration: 1 }, 0)
    .to('.hero__shade', { opacity: 0.9, ease: 'power1.in', duration: 0.55 }, 0)
    .to('.logo:not(.logo--small)', { scale: 0.82, autoAlpha: 0, ease: 'power2.in', duration: 0.4 }, 0.05)
    .to('.hero__hint', { autoAlpha: 0, duration: 0.1 }, 0)
    .fromTo('.release', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.25 }, 0.45)
    .to('.release', { autoAlpha: 0, y: -50, duration: 0.2 }, 0.85)
    .to('.hero__shade', { opacity: 1, duration: 0.2 }, 0.85);

  /* ---------- 02 vídeo principal: se ilumina, se mantiene y se apaga ---------- */
  gsap.timeline({
    scrollTrigger: { trigger: '.trailer', start: 'top top', end: '+=160%', scrub: true, pin: true },
  })
    .fromTo('.trailer__shade', { opacity: 1 }, { opacity: 0.15, duration: 0.35, ease: 'none' }, 0)
    .fromTo('.trailer__art', { scale: 1.25 }, { scale: 1, duration: 0.7, ease: 'none' }, 0)
    .fromTo('.trailer__title', { letterSpacing: '.6em', opacity: 0 }, { letterSpacing: window.innerWidth < 860 ? '.08em' : '.2em', opacity: 1, duration: 0.4 }, 0.05)
    .fromTo('.trailer .eyebrow', { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.2)
    .fromTo('.play--big', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'back.out(2)' }, 0.3)
    .to('.trailer__shade', { opacity: 0.65, duration: 0.25, ease: 'none' }, 0.75);

  /* ---------- 04/05 escenas sticky: el progreso funde/acerca las fotos y oscurece al llegar el contenido ---------- */
  const stageSetup = [
    { el: '#stadium', run: 1.4, shadeFrom: 1.3, shadeTo: 1.75, shadeMax: 0.6 },
    { el: '#city', run: 1.7, shadeFrom: 1.15, shadeTo: 1.6, shadeMax: 0.82 },
  ];
  stageSetup.forEach((cfg) => {
    const stage = $(cfg.el), shade = $('.stage__shade', stage);
    const frames = $$('[data-seq] img', stage), pan = $('.stage__seq--pan', stage);
    const render = (t) => {
      if (pan) {
        frames[0].style.transform = `scale(${1.45 - 0.35 * t}) translateX(${(0.5 - t) * 8}%)`;
        return;
      }
      // fundido encadenado entre fotogramas + acercamiento continuo
      const seg = t * (frames.length - 1);
      frames.forEach((img, i) => {
        img.style.opacity = i === 0 ? 1 : smooth(seg - (i - 1));
        img.style.transform = `scale(${1.18 - 0.18 * clamp(seg - i + 1, 0, 2) / 2})`;
      });
    };
    render(0);
    ScrollTrigger.create({
      trigger: stage, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => {
        const vh = window.innerHeight, y = window.scrollY - self.start;
        render(clamp(y / (cfg.run * vh), 0, 1));
        shade.style.opacity = smooth((y / vh - cfg.shadeFrom) / (cfg.shadeTo - cfg.shadeFrom)) * cfg.shadeMax;
      },
    });
  });

  /* ---------- historia palabra a palabra ---------- */
  const syn = $('.synopsis');
  syn.innerHTML = syn.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
  if (!reduced) {
    gsap.to('.synopsis .w', {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: syn, start: 'top 80%', end: 'bottom 50%', scrub: true },
    });
  }

  /* ---------- revelados y parallax interior ---------- */
  if (!reduced) {
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, stagger: 0.12, duration: 1.3, ease: 'expo.out' }),
    });
    $$('.feature').forEach((card) => {
      gsap.fromTo($('img', card), { yPercent: -6 }, {
        yPercent: 6, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ---------- carrusel ---------- */
  const track = $('.videos__track'), dots = $$('.dots i');
  track.addEventListener('scroll', () => {
    const card = track.children[0];
    const idx = Math.round(track.scrollLeft / (card.offsetWidth + 16));
    dots.forEach((d, i) => d.classList.toggle('is-on', i === clamp(idx, 0, dots.length - 1)));
  }, { passive: true });

  /* ---------- menú ---------- */
  const burger = $('.burger'), menu = $('#menu');
  $$('a', menu).forEach((a, i) => a.style.setProperty('--i', i));
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar el menú de navegación' : 'Abrir el menú de navegación');
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  $$('[data-goto]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    setMenu(false);
    goTo(a.getAttribute('data-goto'));
  }));

  /* ---------- newsletter (sin envío: plantilla) ---------- */
  $('.newsletter').addEventListener('submit', (e) => {
    e.preventDefault();
    $('.newsletter__ok').textContent = '¡Gracias! (Plantilla local: no se ha enviado nada).';
  });

  /* ---------- reproductor: vídeos oficiales de YouTube ---------- */
  const player = $('.player'), frameBox = $('.player__frame'), ytLink = $('.player__note');
  function openPlayer(id) {
    frameBox.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="Vídeo oficial del Real Madrid" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    ytLink.href = `https://www.youtube.com/watch?v=${id}`;
    player.showModal();
    if (lenis) lenis.stop();
  }
  const closePlayer = () => { if (player.open) player.close(); };
  $$('[data-video]').forEach((b) => b.addEventListener('click', () => openPlayer(b.dataset.video)));
  $('.player__close').addEventListener('click', closePlayer);
  player.addEventListener('close', () => { frameBox.innerHTML = ''; if (lenis) lenis.start(); });
  player.addEventListener('click', (e) => { if (e.target === player) closePlayer(); });

  /* ---------- bucle ---------- */
  gsap.ticker.add(() => {
    const y = window.scrollY;
    header.style.top = `${Math.max(0, promoH - y)}px`;
    header.classList.toggle('is-solid', y > heroEl.offsetHeight * 0.5 + promoH);
  });

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => ScrollTrigger.refresh(), 200);
  });
})();
