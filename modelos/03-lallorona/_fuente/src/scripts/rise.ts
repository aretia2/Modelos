/**
 * Fotos que salen en vertical: cada [data-rise] recibe --r (0 → 1) según cuánto ha entrado en pantalla
 * y --py para el paralaje de la foto. Con movimiento reducido no se activa y todo se ve quieto.
 */
const items = [...document.querySelectorAll<HTMLElement>('[data-rise]')];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

if (items.length && !reduced.matches) {
  const state = items.map(() => ({ cur: 0, tgt: 0 }));
  let raf = 0;

  const measure = () => {
    const vh = window.innerHeight;
    items.forEach((li, i) => {
      if (li.hidden) return;
      const r = li.getBoundingClientRect();
      // 0 cuando el borde superior asoma por abajo; 1 cuando ha subido el 60 % de la pantalla.
      state[i].tgt = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.6)));
      li.style.setProperty('--py', `${((r.top + r.height / 2 - vh / 2) * -0.08).toFixed(1)}px`);
    });
  };

  const render = () => {
    let moving = false;
    items.forEach((li, i) => {
      const s = state[i];
      s.cur += (s.tgt - s.cur) * 0.12;
      if (Math.abs(s.tgt - s.cur) < 0.001) s.cur = s.tgt;
      else moving = true;
      li.style.setProperty('--r', s.cur.toFixed(4));
    });
    raf = moving ? requestAnimationFrame(render) : 0;
  };

  const kick = () => {
    measure();
    if (!raf) raf = requestAnimationFrame(render);
  };

  document.documentElement.classList.add('rise-on');
  items.forEach((li) => li.style.setProperty('--r', '0'));
  kick();
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  // Los filtros ocultan piezas y mueven las demás.
  document.querySelector('[data-filters]')?.addEventListener('click', () => requestAnimationFrame(kick));

  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    document.documentElement.classList.remove('rise-on');
    window.removeEventListener('scroll', kick);
  });
}
