let locks = 0;
let savedPadding = '';

/** Bloquea el desplazamiento del fondo sin que la página "salte" al ocultar la barra de scroll. */
export function lockScroll() {
  if (locks++ > 0) return;
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  savedPadding = document.body.style.paddingRight;
  if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
  document.documentElement.style.overflow = 'hidden';
}

export function unlockScroll() {
  if (locks === 0 || --locks > 0) return;
  document.documentElement.style.overflow = '';
  document.body.style.paddingRight = savedPadding;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Mantiene el foco del teclado dentro de `root`. Devuelve la función para soltarlo. */
export function trapFocus(root: HTMLElement) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  root.addEventListener('keydown', onKey);
  return () => root.removeEventListener('keydown', onKey);
}
