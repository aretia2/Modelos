import { lockScroll, unlockScroll, trapFocus } from './dom';

const header = document.querySelector<HTMLElement>('[data-header]');
const menu = document.querySelector<HTMLElement>('[data-menu]');
const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
const closeBtn = document.querySelector<HTMLButtonElement>('[data-menu-close]');

if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

if (menu && openBtn && closeBtn) {
  let releaseTrap: (() => void) | null = null;
  const background = () =>
    [document.querySelector('main'), document.querySelector('footer'), document.querySelector('[data-mobile-bar]')].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );

  const open = () => {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
    openBtn.setAttribute('aria-expanded', 'true');
    lockScroll();
    background().forEach((el) => (el.inert = true));
    releaseTrap = trapFocus(menu);
    closeBtn.focus();
    document.addEventListener('keydown', onKey);
  };

  const close = (restoreFocus = true) => {
    menu.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    unlockScroll();
    background().forEach((el) => (el.inert = false));
    releaseTrap?.();
    document.removeEventListener('keydown', onKey);
    const finish = () => (menu.hidden = true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else setTimeout(finish, 300);
    if (restoreFocus) openBtn.focus();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', () => close());
  menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link], a[target="_blank"]').forEach((a) =>
    a.addEventListener('click', () => close(false)),
  );

  // Si se pasa a escritorio con el menú abierto, se cierra.
  window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => {
    if (e.matches && !menu.hidden) close(false);
  });
}
