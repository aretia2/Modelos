(function() {
	// ../_astro/dom.8Pi3v-w5.js
	var e = 0;
	var t = ``;
	function n() {
		if (e++ > 0) return;
		let n = window.innerWidth - document.documentElement.clientWidth;
		t = document.body.style.paddingRight, n > 0 && (document.body.style.paddingRight = `${n}px`), document.documentElement.style.overflow = `hidden`;
	}
	function r$1() {
		e === 0 || --e > 0 || (document.documentElement.style.overflow = ``, document.body.style.paddingRight = t);
	}
	function i$1(e) {
		let t = (t) => {
			if (t.key !== `Tab`) return;
			let n = [...e.querySelectorAll(`a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`)].filter((e) => e.offsetParent !== null);
			if (n.length === 0) return;
			let r = n[0], i = n[n.length - 1];
			t.shiftKey && document.activeElement === r ? (t.preventDefault(), i.focus()) : !t.shiftKey && document.activeElement === i && (t.preventDefault(), r.focus());
		};
		return e.addEventListener(`keydown`, t), () => e.removeEventListener(`keydown`, t);
	}
	// ../_astro/Header.astro_astro_type_script_index_0_lang.C11fwbE7.js
	var r = document.querySelector(`[data-header]`);
	var i = document.querySelector(`[data-menu]`);
	var a = document.querySelector(`[data-menu-open]`);
	var o = document.querySelector(`[data-menu-close]`);
	if (r) {
		let e = () => r.classList.toggle(`is-scrolled`, window.scrollY > 8);
		e(), window.addEventListener(`scroll`, e, { passive: !0 });
	}
	if (i && a && o) {
		let r = null, s = () => [
			document.querySelector(`main`),
			document.querySelector(`footer`),
			document.querySelector(`[data-mobile-bar]`)
		].filter((e) => e instanceof HTMLElement), c = () => {
			i.hidden = !1, requestAnimationFrame(() => i.classList.add(`is-open`)), a.setAttribute(`aria-expanded`, `true`), n(), s().forEach((e) => e.inert = !0), r = i$1(i), o.focus(), document.addEventListener(`keydown`, u);
		}, l = (e = !0) => {
			i.classList.remove(`is-open`), a.setAttribute(`aria-expanded`, `false`), r$1(), s().forEach((e) => e.inert = !1), r?.(), document.removeEventListener(`keydown`, u);
			let n = () => i.hidden = !0;
			window.matchMedia(`(prefers-reduced-motion: reduce)`).matches ? n() : setTimeout(n, 300), e && a.focus();
		}, u = (e) => {
			e.key === `Escape` && l();
		};
		a.addEventListener(`click`, c), o.addEventListener(`click`, () => l()), i.querySelectorAll(`[data-menu-link], a[target="_blank"]`).forEach((e) => e.addEventListener(`click`, () => l(!1))), window.matchMedia(`(min-width: 960px)`).addEventListener(`change`, (e) => {
			e.matches && !i.hidden && l(!1);
		});
	}
})();
