/**
 * Secuencia a pantalla completa (como la del estadio en el modelo 02), en pantallas de tres fotos: el marco se
 * fija y el progreso del scroll funde cada trío sobre el anterior —sus paneles entran escalonados— mientras
 * las fotos se alejan despacio. Al final la escena se oscurece.
 */
const seq = document.querySelector<HTMLElement>('[data-seq]');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};

// Recorrido, en pantallas: cuánto scroll dura cada cambio de trío y cuánto se queda el último antes de soltar.
const PER_FRAME = 1;
const HOLD = 0.6;
// Retraso entre los paneles de un mismo trío al entrar (en fracción del cambio).
const STAGGER = 0.18;

if (seq && !reduced.matches) {
  const sticky = seq.querySelector<HTMLElement>('[data-seq-sticky]')!;
  const frames = [...seq.querySelectorAll<HTMLElement>('[data-frame]')];
  const panels = frames.map((li) => [...li.querySelectorAll<HTMLElement>('[data-panel]')]);
  const count = seq.querySelector<HTMLElement>('[data-seq-count]');
  const bar = seq.querySelector<HTMLElement>('[data-seq-bar]');
  const shade = seq.querySelector<HTMLElement>('[data-seq-shade]');
  const total = seq.dataset.total ?? '';

  let start = 0;
  let run = 1;
  let vh = window.innerHeight;
  let target = 0;
  let current = 0;
  let raf = 0;

  const measure = () => {
    vh = window.innerHeight;
    run = Math.max(1, (frames.length - 1) * PER_FRAME * vh);
    seq.style.height = `${vh + run + HOLD * vh}px`;
    start = seq.getBoundingClientRect().top + window.scrollY;
  };

  const scrolled = () => window.scrollY - start;

  const render = () => {
    current += (target - current) * 0.14;
    if (Math.abs(target - current) < 0.5) current = target;

    const t = frames.length > 1 ? clamp(current / run) : 1;
    const seg = t * (frames.length - 1);
    const ops = frames.map((_, i) => (i === 0 ? 1 : smooth(seg - (i - 1))));
    let active = 0;
    let best = -1;

    frames.forEach((li, i) => {
      // Acercamiento que se va relajando (1.18 → 1), como en el estadio.
      const scale = 1.18 - (0.18 * clamp(seg - i + 1, 0, 2)) / 2;
      panels[i].forEach((panel, j) => {
        // Cada panel del trío entra un poco después que el anterior.
        const o = i === 0 ? 1 : smooth((seg - (i - 1) - j * STAGGER) / (1 - 2 * STAGGER));
        panel.style.setProperty('--o', o.toFixed(3));
        panel.style.setProperty('--s', scale.toFixed(4));
      });
      const weight = ops[i] * (1 - (ops[i + 1] ?? 0));
      li.style.setProperty('--w', smooth(weight * 2.5 - 1.2).toFixed(3));
      if (weight > best) {
        best = weight;
        active = i;
      }
    });
    frames.forEach((li, i) => li.classList.toggle('is-active', i === active));
    seq.classList.toggle('is-last', active === frames.length - 1);

    if (count) count.textContent = `${frames[active].dataset.range} / ${total}`;
    bar?.style.setProperty('--p', t.toFixed(4));
    // El oscurecido empieza cuando el último trío ya se ha asentado y acaba al soltar el marco.
    shade?.style.setProperty('--shade', (smooth((current - run - HOLD * vh * 0.3) / (HOLD * vh * 0.7)) * 0.75).toFixed(3));

    raf = current === target ? 0 : requestAnimationFrame(render);
  };

  const kick = () => {
    target = clamp(scrolled(), 0, run + HOLD * vh);
    if (!raf) raf = requestAnimationFrame(render);
  };

  document.documentElement.classList.add('seq-on');
  measure();
  target = current = clamp(scrolled(), 0, run + HOLD * vh);
  render();

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    kick();
  });

  // Con teclado: al enfocar una foto, llevar el scroll hasta su trío.
  sticky.addEventListener('focusin', (e) => {
    const i = frames.findIndex((li) => li.contains(e.target as Node));
    if (i < 0 || frames[i].classList.contains('is-active')) return;
    window.scrollTo({ top: start + (i / Math.max(1, frames.length - 1)) * run, behavior: 'auto' });
  });

  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    document.documentElement.classList.remove('seq-on');
    seq.style.height = '';
    window.removeEventListener('scroll', kick);
  });
}
