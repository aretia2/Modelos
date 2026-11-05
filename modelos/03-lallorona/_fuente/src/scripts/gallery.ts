import { lockScroll, unlockScroll } from './dom';

const gallery = document.querySelector<HTMLElement>('[data-gallery]');
const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');

// ---- Filtros (solo existen si hay categorías suficientes) ----
const filters = document.querySelector<HTMLElement>('[data-filters]');
if (filters && gallery) {
  filters.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-filter]');
    if (!btn) return;
    const value = btn.dataset.filter!;
    filters.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    gallery.querySelectorAll<HTMLElement>('.work').forEach((li) => {
      li.hidden = value !== '*' && li.dataset.category !== value;
    });
  });
}

// ---- Visor ----
if (gallery && dialog) {
  const img = dialog.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const caption = dialog.querySelector<HTMLElement>('[data-lb-caption]')!;
  const count = dialog.querySelector<HTMLElement>('[data-lb-count]')!;
  const prev = dialog.querySelector<HTMLButtonElement>('[data-lb-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-lb-next]')!;
  let current = 0;
  let opener: HTMLElement | null = null;

  const visibleButtons = () =>
    [...gallery.querySelectorAll<HTMLButtonElement>('[data-full]')].filter((b) => !b.closest('.work')?.hasAttribute('hidden'));

  const show = (index: number) => {
    const list = visibleButtons();
    if (!list.length) return;
    current = (index + list.length) % list.length;
    const btn = list[current];
    img.src = btn.dataset.full!;
    img.alt = btn.dataset.alt ?? '';
    caption.textContent = btn.dataset.caption ?? '';
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    prev.hidden = next.hidden = list.length < 2;
  };

  gallery.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-full]');
    if (!btn) return;
    opener = btn;
    show(visibleButtons().indexOf(btn));
    dialog.showModal();
    lockScroll();
  });

  dialog.addEventListener('close', () => {
    unlockScroll();
    img.removeAttribute('src');
    opener?.focus();
  });

  dialog.querySelector('[data-lb-close]')!.addEventListener('click', () => dialog.close());
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));

  // Clic fuera de la imagen cierra.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || (e.target as HTMLElement).classList.contains('lb__figure')) dialog.close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  // Deslizar en pantallas táctiles.
  let startX = 0;
  let startY = 0;
  dialog.addEventListener(
    'touchstart',
    (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true },
  );
  dialog.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
    },
    { passive: true },
  );
}
