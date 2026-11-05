# Modelos — Hub de plantillas web

```
Modelos/
├── index.html              ← portada / directorio (hub)
├── assets/                 ← estilos y script SOLO del hub
│   ├── hub.css
│   └── hub.js              ← registro MODELS: añade aquí cada modelo nuevo
└── modelos/
    └── 01-cronografo-scroll/   ← proyecto independiente
        ├── index.html
        ├── css/style.css
        └── js/
            ├── watch.js    ← reloj 3D procedural (caja, esfera, calibre, brazalete)
            ├── scene.js    ← renderer, reflejos, fila de acabados, partículas GLSL
            └── main.js     ← Lenis + estados por sección + revelados
    └── 02-real-madrid/         ← estructura de web de lanzamiento con contenido oficial del Real Madrid (uso privado)
        ├── index.html
        ├── css/style.css
        ├── assets/img/     ← fotos y escudo descargados de realmadrid.com / YouTube oficial (3-11-2026)
        └── js/main.js      ← pins GSAP, secuencias de fotos ligadas al scroll, carrusel, menú, reproductor YouTube
    └── 03-lallorona/           ← copia estática de ProyectosClaude/lallorona: Trabajos como secuencia a pantalla completa (fundido + zoom, como el estadio del 02) + página trabajos/
        ├── index.html, _astro/ ← exportado (no editar a mano)
        └── _fuente/            ← proyecto Astro; Trabajos en src/components/WorkStream.astro, Gallery.astro, src/pages/trabajos.astro y src/scripts/sequence.ts
    └── 04-olivar/              ← alojamiento rural (vídeo de referencia): recorrido 3D ligado al scroll por una casa de cristal procedural
        ├── index.html
        ├── css/style.css
        └── js/
            ├── house.js    ← escena Three.js procedural: casa, mobiliario, olivos instanciados, luz de hora dorada
            └── main.js     ← array STATES de cámara, «fotos» renderizadas de la escena, pins GSAP, calendario de reservas
```

Para regenerar el modelo 03 tras editar `_fuente/` (necesita `npm install` dentro de `_fuente/`):

```
npm run build
node scripts/export-modelo.mjs
```

## Ver en local

Funciona abriendo `index.html` directamente (doble clic), o con un servidor:

```
python -m http.server 5173
```

y abre http://localhost:5173

## Añadir un modelo

1. Crea `modelos/NN-nombre/` con su propio `index.html`, CSS y JS.
2. Añade una entrada al array `MODELS` de `assets/hub.js`.
