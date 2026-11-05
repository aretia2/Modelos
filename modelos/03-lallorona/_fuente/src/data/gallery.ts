/**
 * Selección de trabajos de la portada.
 *
 * Para añadir una foto: copiarla a src/assets/trabajos/ y poner su nombre en `image`.
 * Astro genera automáticamente AVIF/WebP en varios tamaños.
 * Mientras `image` no exista, se muestra una placa "Foto pendiente".
 *
 * `size` controla la composición: 'feature' (pieza protagonista), 'tall' (vertical), 'regular', 'wide'.
 *
 * Las fotos actuales son capturas de Instagram (unos 400 px de ancho). Sustituirlas por los
 * originales en cuanto estén disponibles: se verán más nítidas sin tocar nada más.
 */
export type Work = {
  image?: string;
  alt: string;
  title?: string;
  /** Nombre tal y como aparece en src/data/artists.ts */
  artist?: string;
  /** Estilo, solo si está confirmado. Activa los filtros cuando haya suficientes. */
  category?: string;
  description?: string;
  size: 'feature' | 'tall' | 'regular' | 'wide';
  /** Punto focal del recorte, p. ej. '50% 30%'. */
  position?: string;
};

export const works: Work[] = [
  {
    size: 'feature',
    image: 'trabajos/realismo-reloj-ojo.jpg',
    title: 'Realismo en negro y gris',
    alt: 'Media manga en negro y gris con un ojo realista, un reloj con números romanos y una rosa en el antebrazo',
    position: '50% 40%',
  },
  {
    size: 'tall',
    image: 'trabajos/betis-cartoon.jpg',
    title: 'Cartoon a color',
    alt: 'Retrato cartoon a color de un aficionado con gorra y la Copa del Rey, con el texto «Viva er Beti oé, la Copa oé», en el gemelo',
  },
  {
    size: 'tall',
    image: 'trabajos/anime-linea.jpg',
    title: 'Anime en línea y sombra',
    alt: 'Composición de personajes de anime en línea negra y sombreado en el antebrazo',
  },
  {
    size: 'regular',
    image: 'trabajos/tradicional-punal.jpg',
    title: 'Tradicional',
    alt: 'Tatuaje tradicional a color de un puñal atravesando un corazón rojo, con borla y abanico, en el antebrazo',
  },
  {
    size: 'regular',
    image: 'trabajos/lettering-rojo.jpg',
    title: 'Lettering en tinta roja',
    alt: 'Palabra «Grateful» en caligrafía fina con tinta roja en el antebrazo',
  },
];

/** Foto principal del hero (src/assets/...). */
export const heroImage: { image?: string; alt: string; caption: string; position?: string } = {
  image: 'estudio/equipo-camisetas.jpg',
  alt: 'Dos miembros del equipo de espaldas, con camisetas de La Llorona, frente al mural del estudio',
  caption: 'El equipo',
  position: '50% 50%',
};

/** Fotos del espacio. La segunda es opcional: si no hay, la composición se adapta. */
export const studioImages: { image?: string; alt: string }[] = [
  {
    image: 'estudio/sesion.jpg',
    alt: 'Sesión de tatuaje en el estudio, con grafitis naranjas en la pared del fondo',
  },
];

/** Cartel de la casa ("A llorar a La Llorona"). */
export const poster = {
  image: 'estudio/cartel-a-llorar.jpg',
  alt: 'Cartel rosa y verde con el lema «A llorar a La Llorona» y una cara llorando dibujada',
};

/** Sello del estudio en blanco sobre transparente. */
export const logo = {
  image: 'marca/logo.png',
  alt: 'Sello de La Llorona Private Studio: corazón atravesado por un puñal con una mujer llorando y dos estrellas',
};
