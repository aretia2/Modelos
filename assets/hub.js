/* Registro de modelos del hub. Para añadir uno nuevo, agrega una entrada a MODELS. */
(function () {
  'use strict';

  const MODELS = [
    {
      n: '01',
      title: 'Halden HX-60P',
      kind: 'Landing de producto · Scroll 3D',
      desc: 'Reloj 3D en tiempo real que gira, se despieza y despliega su brazalete sincronizado con el scroll.',
      tags: ['Three.js', 'ScrollTrigger', 'Lenis', 'Partículas GLSL'],
      href: 'modelos/01-cronografo-scroll/index.html',
      art: 'watch',
    },
    {
      n: '02',
      title: 'Hala Madrid 26/27',
      kind: 'Web de lanzamiento · Narrativa con scroll',
      desc: 'Contenido oficial del Real Madrid con estructura de web de lanzamiento: mosaico fijado, vídeos de YouTube, fotos que avanzan con el scroll y tienda.',
      tags: ['GSAP pin', 'Secuencia de fotos', 'Lenis', 'YouTube embed'],
      href: 'modelos/02-real-madrid/index.html',
      art: 'mosaic',
    },
    {
      n: '03',
      title: 'La Llorona',
      kind: 'Web de estudio de tatuaje · Secuencia a pantalla completa',
      desc: 'Copia de la web de La Llorona: en Trabajos las fotos ocupan la pantalla de tres en tres y cada trío se funde sobre el anterior al hacer scroll; los huecos sin foto avisan de que se subirán próximamente.',
      tags: ['Astro', 'Sticky pin', 'Fundido + zoom', 'Lightbox'],
      href: 'modelos/03-lallorona/index.html',
      art: 'strip',
    },
    {
      n: '04',
      title: 'Olivar',
      kind: 'Alojamiento rural · Recorrido 3D con scroll',
      desc: 'Casa de cristal entre olivos: la cámara entra desde el jardín y recorre dormitorio, salón y comedor con el scroll; pisos, galería fijada y calendario de reservas.',
      tags: ['Three.js', 'ScrollTrigger', 'Lenis', 'Calendario'],
      href: 'modelos/04-olivar/index.html',
      art: 'house',
    },
    { n: '05', title: 'Próximo modelo', kind: 'En espera de diseño', desc: 'Glassmorphism, bento grids, tipografía cinética… el formato lo marca tu diseño.', tags: [], art: 'empty' },
  ];

  const ART = {
    watch: `<svg viewBox="0 0 200 200" class="art art--watch" aria-hidden="true">
      <rect x="78" y="8" width="44" height="40" rx="6"/><rect x="78" y="152" width="44" height="40" rx="6"/>
      <circle cx="100" cy="100" r="58"/><circle cx="100" cy="100" r="47"/><circle cx="100" cy="78" r="10"/><circle cx="100" cy="124" r="11"/>
      <rect x="156" y="94" width="10" height="12" rx="2"/>
      <g class="art__hands"><path d="M100 100V64"/><path d="M100 100l22 12"/></g>
      ${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30} 100 100)" d="M100 49v7"/>`).join('')}
    </svg>`,
    mosaic: `<svg viewBox="0 0 200 200" class="art art--watch" aria-hidden="true">
      <rect x="20" y="40" width="50" height="50" rx="3"/><rect x="74" y="40" width="50" height="50" rx="3"/><rect x="128" y="40" width="52" height="24" rx="3"/>
      <rect x="128" y="68" width="52" height="54" rx="3"/><rect x="20" y="94" width="24" height="66" rx="3"/><rect x="48" y="94" width="22" height="30" rx="3"/>
      <rect x="74" y="94" width="50" height="66" rx="3"/><rect x="48" y="128" width="22" height="32" rx="3"/><rect x="128" y="126" width="24" height="34" rx="3"/><rect x="156" y="126" width="24" height="34" rx="3"/>
      <text x="100" y="118" text-anchor="middle" font-size="58" font-weight="900" font-family="Big Shoulders Display, Impact, sans-serif" fill="currentColor" stroke="none">RM</text>
    </svg>`,
    strip: `<svg viewBox="0 0 200 200" class="art art--watch" aria-hidden="true">
      <rect x="30" y="18" width="70" height="60" rx="3"/><path d="M118 40h50M118 52h34"/>
      <rect x="100" y="94" width="70" height="60" rx="3"/><path d="M32 116h50M48 128h34"/>
      <rect x="30" y="170" width="70" height="40" rx="3"/><path d="M180 70v40m-5-5l5 5 5-5"/>
    </svg>`,
    house: `<svg viewBox="0 0 200 200" class="art art--watch" aria-hidden="true">
      <path d="M18 92h164M26 98h148"/><rect x="34" y="98" width="132" height="44"/>
      <path d="M62 98v44M90 98v44M118 98v44M146 98v44M20 142h160"/>
      <circle cx="40" cy="60" r="16"/><path d="M40 76v16"/><circle cx="166" cy="64" r="12"/><path d="M166 76v16"/>
      <path d="M30 170c30-8 110-8 140 0"/>
    </svg>`,
    empty: `<svg viewBox="0 0 200 200" class="art art--empty" aria-hidden="true">
      <rect x="40" y="40" width="120" height="120" rx="14"/><path d="M100 80v40M80 100h40"/></svg>`,
  };

  const grid = document.getElementById('grid');
  grid.innerHTML = MODELS.map((m, i) => {
    const live = Boolean(m.href);
    const tag = live ? 'a' : 'div';
    return `<li style="--i:${i}">
      <${tag} class="card${live ? '' : ' card--soon'}" ${live ? `href="${m.href}"` : 'aria-disabled="true"'}>
        <span class="card__n mono">${m.n}</span>
        <span class="card__status mono">${live ? '● Disponible' : '○ Próximamente'}</span>
        <div class="card__art">${ART[m.art]}</div>
        <div class="card__body">
          <p class="card__kind mono">${m.kind}</p>
          <h3 class="card__title">${m.title}</h3>
          <p class="card__desc">${m.desc}</p>
          ${m.tags.length ? `<ul class="card__tags mono">${m.tags.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
        </div>
        ${live ? '<span class="card__go" aria-hidden="true">↗</span>' : ''}
      </${tag}>
    </li>`;
  }).join('');

  document.getElementById('count').textContent = String(MODELS.filter((m) => m.href).length).padStart(2, '0');

  // foco de luz que sigue al cursor dentro de cada tarjeta
  grid.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });

  requestAnimationFrame(() => document.body.classList.add('is-ready'));
})();
