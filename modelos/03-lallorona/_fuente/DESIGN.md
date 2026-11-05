# La Llorona — Dirección de diseño

## 1. Qué sabemos (perfil público de Instagram, consultado el 01/11/2026)

- **Nombre y lema:** 💧LA LLORONA💧 · *Private Studio*.
- **Dirección publicada en la bio:** Calle Viterbo 7, local 2 (Montequinto, Sevilla).
- **Cuentas en la bio:** @javivilchezz ⚔️ @gaffatattoo.
- **Residentes (historias destacadas):** Gaffa, Rosi, Garay, Bruno (🇧🇷), Parrado, Diana, Mirxiha, Javi, Edu. También hay un destacado *Guest welcome*.
- **Logotipo:** sello circular negro, letras de inspiración gótica/blackletter, corazón atravesado por un puñal y dos estrellas de cuatro puntas.
- **Trabajo visible:** realismo en negro y gris (retratos, mangas con relojes y ojos), color de estilo cómic/anime, piezas cartoon con lettering (p. ej. homenaje al Betis), línea fina y ornamental. Mucha variedad: es un estudio de varios residentes, no de un único estilo.
- **Fotografía:** piel bien iluminada sobre fondos de **listones de madera cálida** o **ladrillo negro**; fotos de móvil, cercanas, sin filtros fuertes.
- **Tono:** de barrio, cercano y con humor (Flash Day de Halloween con DJ, “5 tatuadores, más de 50 diseños”, sorteos). Se gestiona todo por **mensaje directo**.

Lo que no aparece y no se ha inventado: teléfono, WhatsApp, horario, correo, precios fijos, biografías, certificaciones.

## 2. Direcciones exploradas

1. **Galería blanca de arte contemporáneo.** Elegante, pero fría y ajena a un estudio de barrio con DJ y flash days. Descartada.
2. **Archivo de historias / memoria.** Bonito sobre el papel, pero tiende a lo poético y a lo melancólico; la marca real es más directa y divertida. Descartada.
3. **Fanzine de estudio (elegida).** La web como un fanzine impreso y numerado que edita un estudio privado: páginas negro tinta, insertos en papel hueso, cabeceras en letra gótica heredada del logo, etiquetas tipo hoja de flash y **una sola lágrima azul** (el 💧 que la marca ya usa) como marca de acento.

**Por qué:** sale del logo (blackletter + estrellas), del uso real del 💧, del formato *flash* que el estudio ya practica y de su tono callejero. Permite que cada residente y cada estilo convivan como “páginas” distintas de una misma publicación.

## 3. Sistema

### Color (4 + variaciones)

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#0E0D0C` | Fondo principal, texto sobre papel |
| `--bone` | `#ECE6DA` | Texto principal en oscuro, secciones “papel” |
| `--oak` | `#B5865A` | Secundario cálido sacado de las paredes de madera de las fotos: etiquetas, numeración |
| `--tear` | `#86C1E8` | Acento muy controlado: la lágrima, foco, CTA principal |

Variaciones: `--ink-2` (superficies), `--bone-dim` (texto secundario, contraste ≥ 7:1 sobre tinta), `--tear-deep` (acento legible sobre papel). Nada de degradados.

### Tipografía (2 familias, autoalojadas)

- **Display — Grenze Gotisch** (variable): gótica contemporánea, eco directo del logotipo pero legible en titulares largos. Solo para cabeceras y nombres.
- **Funcional — Archivo** (variable con eje de anchura): texto, navegación y formularios a anchura normal; etiquetas editoriales en **Archivo condensada** (`wdth 62–75`) en mayúsculas, como los rótulos de una hoja de flash.
- Escala fluida con `clamp()` en `src/styles/global.css` (`--step--1` … `--step-6`).
- Fuentes servidas desde el propio dominio (Fontsource): sin peticiones a Google.

### Composición

- Rejilla de 12 columnas, ancho máximo 1440 px, márgenes laterales fluidos (16 px en móvil).
- Ritmo de “pliegos”: secciones en tinta alternadas con un pliego en papel (manifiesto) para romper la monotonía oscura.
- Cada sección lleva **número editorial** (`01 — Trabajos`) y una línea fina; los separadores son la **estrella de cuatro puntas** del logo.

### Fotografía

- El tatuaje manda: sin overlays oscuros, sin filtros. Hover solo con un zoom de 3 % y una etiqueta pequeña.
- Proporciones fijas por ranura (4:5, 3:4, 1:1, 16:10) para evitar saltos.
- Mientras no haya foto, se muestra una **placa provisional** claramente rotulada (“Foto pendiente”), nunca un stock.

### Componentes

- **Botones:** rectangulares, esquinas vivas, borde de 1 px. Primario = lágrima azul sobre tinta. Secundario = contorno hueso. Flecha que se desplaza en hover.
- **Enlaces:** subrayado fino que se engrosa en hover.
- **Foco:** contorno azul lágrima de 2 px con separación, siempre visible.
- **Iconos:** solo los imprescindibles (Instagram, flecha, cerrar, lágrima, estrella), dibujados en SVG inline.

### Movimiento

- Aparición suave (opacidad + 16 px) de bloques al entrar en pantalla; todo es visible si no hay JS.
- Menú móvil a pantalla completa con fundido; visor con `<dialog>` nativo.
- Sin parallax ni WebGL. `prefers-reduced-motion` desactiva todas las transiciones.
- Sin cursor personalizado: no aportaba suficiente y complica el uso.

### Responsive

- **Móvil primero:** en el hero, cabecera gótica → lema → acciones → foto; se entiende qué es y cómo pedir cita sin desplazar. Barra fija inferior de “Pide tu cita” que aparece tras el hero y deja hueco al final de página.
- **Tablet:** galería a 6 columnas, residentes a 1 columna amplia.
- **Escritorio:** hero asimétrico (texto 7/12, foto 5/12) con texto vertical lateral; galería editorial con piezas protagonistas.
