(function() {
	// ../_astro/dom.8Pi3v-w5.js
	var e = 0;
	var t = ``;
	function n$1() {
		if (e++ > 0) return;
		let n = window.innerWidth - document.documentElement.clientWidth;
		t = document.body.style.paddingRight, n > 0 && (document.body.style.paddingRight = `${n}px`), document.documentElement.style.overflow = `hidden`;
	}
	function r$1() {
		e === 0 || --e > 0 || (document.documentElement.style.overflow = ``, document.body.style.paddingRight = t);
	}
	// ../_astro/WorkStream.astro_astro_type_script_index_0_lang.C0UpnQh1.js
	var n = document.querySelector(`[data-gallery]`);
	var r = document.querySelector(`[data-lightbox]`);
	var i = document.querySelector(`[data-filters]`);
	if (i && n && i.addEventListener(`click`, (e) => {
		let t = e.target.closest(`[data-filter]`);
		if (!t) return;
		let r = t.dataset.filter;
		i.querySelectorAll(`[data-filter]`).forEach((e) => e.setAttribute(`aria-pressed`, String(e === t))), n.querySelectorAll(`.work`).forEach((e) => {
			e.hidden = r !== `*` && e.dataset.category !== r;
		});
	}), n && r) {
		let i = r.querySelector(`[data-lb-img]`), a = r.querySelector(`[data-lb-caption]`), o = r.querySelector(`[data-lb-count]`), s = r.querySelector(`[data-lb-prev]`), c = r.querySelector(`[data-lb-next]`), l = 0, u = null, d = () => [...n.querySelectorAll(`[data-full]`)].filter((e) => !e.closest(`.work`)?.hasAttribute(`hidden`)), f = (e) => {
			let t = d();
			if (!t.length) return;
			l = (e + t.length) % t.length;
			let n = t[l];
			i.src = n.dataset.full, i.alt = n.dataset.alt ?? ``, a.textContent = n.dataset.caption ?? ``, o.textContent = `${String(l + 1).padStart(2, `0`)} / ${String(t.length).padStart(2, `0`)}`, s.hidden = c.hidden = t.length < 2;
		};
		n.addEventListener(`click`, (e) => {
			let n = e.target.closest(`[data-full]`);
			n && (u = n, f(d().indexOf(n)), r.showModal(), n$1());
		}), r.addEventListener(`close`, () => {
			r$1(), i.removeAttribute(`src`), u?.focus();
		}), r.querySelector(`[data-lb-close]`).addEventListener(`click`, () => r.close()), s.addEventListener(`click`, () => f(l - 1)), c.addEventListener(`click`, () => f(l + 1)), r.addEventListener(`click`, (e) => {
			(e.target === r || e.target.classList.contains(`lb__figure`)) && r.close();
		}), r.addEventListener(`keydown`, (e) => {
			e.key === `ArrowLeft` && f(l - 1), e.key === `ArrowRight` && f(l + 1);
		});
		let p = 0, m = 0;
		r.addEventListener(`touchstart`, (e) => {
			p = e.touches[0].clientX, m = e.touches[0].clientY;
		}, { passive: !0 }), r.addEventListener(`touchend`, (e) => {
			let t = e.changedTouches[0].clientX - p, n = e.changedTouches[0].clientY - m;
			Math.abs(t) > 50 && Math.abs(t) > Math.abs(n) && f(l + (t < 0 ? 1 : -1));
		}, { passive: !0 });
	}
	var a = document.querySelector(`[data-seq]`);
	var o = window.matchMedia(`(prefers-reduced-motion: reduce)`);
	var s = (e, t = 0, n = 1) => Math.min(n, Math.max(t, e));
	var c = (e) => {
		let t = s(e);
		return t * t * (3 - 2 * t);
	};
	var l = 1;
	var u = .6;
	var d = .18;
	if (a && !o.matches) {
		let e = a.querySelector(`[data-seq-sticky]`), t = [...a.querySelectorAll(`[data-frame]`)], n = t.map((e) => [...e.querySelectorAll(`[data-panel]`)]), r = a.querySelector(`[data-seq-count]`), i = a.querySelector(`[data-seq-bar]`), f = a.querySelector(`[data-seq-shade]`), p = a.dataset.total ?? ``, m = 0, h = 1, g = window.innerHeight, _ = 0, v = 0, y = 0, b = () => {
			g = window.innerHeight, h = Math.max(1, (t.length - 1) * l * g), a.style.height = `${g + h + u * g}px`, m = a.getBoundingClientRect().top + window.scrollY;
		}, x = () => window.scrollY - m, S = () => {
			v += (_ - v) * .14, Math.abs(_ - v) < .5 && (v = _);
			let e = t.length > 1 ? s(v / h) : 1, o = e * (t.length - 1), l = t.map((e, t) => t === 0 ? 1 : c(o - (t - 1))), m = 0, b = -1;
			t.forEach((e, t) => {
				let r = 1.18 - .18 * s(o - t + 1, 0, 2) / 2;
				n[t].forEach((e, n) => {
					let i = t === 0 ? 1 : c((o - (t - 1) - n * d) / (1 - 2 * d));
					e.style.setProperty(`--o`, i.toFixed(3)), e.style.setProperty(`--s`, r.toFixed(4));
				});
				let i = l[t] * (1 - (l[t + 1] ?? 0));
				e.style.setProperty(`--w`, c(i * 2.5 - 1.2).toFixed(3)), i > b && (b = i, m = t);
			}), t.forEach((e, t) => e.classList.toggle(`is-active`, t === m)), a.classList.toggle(`is-last`, m === t.length - 1), r && (r.textContent = `${t[m].dataset.range} / ${p}`), i?.style.setProperty(`--p`, e.toFixed(4)), f?.style.setProperty(`--shade`, (c((v - h - u * g * .3) / (u * g * .7)) * .75).toFixed(3)), y = v === _ ? 0 : requestAnimationFrame(S);
		}, C = () => {
			_ = s(x(), 0, h + u * g), y ||= requestAnimationFrame(S);
		};
		document.documentElement.classList.add(`seq-on`), b(), _ = v = s(x(), 0, h + u * g), S(), window.addEventListener(`scroll`, C, { passive: !0 }), window.addEventListener(`resize`, () => {
			b(), C();
		}), e.addEventListener(`focusin`, (e) => {
			let n = t.findIndex((t) => t.contains(e.target));
			n < 0 || t[n].classList.contains(`is-active`) || window.scrollTo({
				top: m + n / Math.max(1, t.length - 1) * h,
				behavior: `auto`
			});
		}), o.addEventListener(`change`, () => {
			o.matches && (document.documentElement.classList.remove(`seq-on`), a.style.height = ``, window.removeEventListener(`scroll`, C));
		});
	}
	var f = [...document.querySelectorAll(`[data-rise]`)];
	var p = window.matchMedia(`(prefers-reduced-motion: reduce)`);
	if (f.length && !p.matches) {
		let e = f.map(() => ({
			cur: 0,
			tgt: 0
		})), t = 0, n = () => {
			let t = window.innerHeight;
			f.forEach((n, r) => {
				if (n.hidden) return;
				let i = n.getBoundingClientRect();
				e[r].tgt = Math.min(1, Math.max(0, (t - i.top) / (t * .6))), n.style.setProperty(`--py`, `${((i.top + i.height / 2 - t / 2) * -.08).toFixed(1)}px`);
			});
		}, r = () => {
			let n = !1;
			f.forEach((t, r) => {
				let i = e[r];
				i.cur += (i.tgt - i.cur) * .12, Math.abs(i.tgt - i.cur) < .001 ? i.cur = i.tgt : n = !0, t.style.setProperty(`--r`, i.cur.toFixed(4));
			}), t = n ? requestAnimationFrame(r) : 0;
		}, i = () => {
			n(), t ||= requestAnimationFrame(r);
		};
		document.documentElement.classList.add(`rise-on`), f.forEach((e) => e.style.setProperty(`--r`, `0`)), i(), window.addEventListener(`scroll`, i, { passive: !0 }), window.addEventListener(`resize`, i), document.querySelector(`[data-filters]`)?.addEventListener(`click`, () => requestAnimationFrame(i)), p.addEventListener(`change`, () => {
			p.matches && (document.documentElement.classList.remove(`rise-on`), window.removeEventListener(`scroll`, i));
		});
	}
})();
