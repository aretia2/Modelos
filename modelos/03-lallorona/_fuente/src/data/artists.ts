/**
 * Residentes y cuentas de Instagram facilitados por el estudio (01/11/2026).
 * Gaffa: cuenta tomada de la bio del estudio. Pendiente: fotos y estilos de cada uno.
 * No añadir estilos ni biografías hasta que el estudio los confirme.
 */
export type Artist = {
  name: string;
  /** Cuenta de Instagram sin @. `null` si no está confirmada. */
  instagram: string | null;
  /** Ruta dentro de src/assets, p. ej. 'residentes/gaffa.jpg'. */
  photo?: string;
  /** Estilos confirmados por el propio artista. */
  styles?: string[];
  /** Etiqueta breve opcional (como la que aparece en el destacado). */
  tag?: string;
};

export const artists: Artist[] = [
  { name: 'Gaffa', instagram: 'gaffatattoo' },
  { name: 'Rosi', instagram: 'rosotatus' },
  { name: 'Garay', instagram: 'garay.tattoo' },
  { name: 'Bruno', instagram: 'brunolopes.tattoo', tag: 'BR' },
  { name: 'Parrado', instagram: 'parrado_tattoo' },
  { name: 'Diana', instagram: 'adamakabra_tattoo' },
  { name: 'Mirxiha', instagram: 'mirxiha.tattoo' },
  { name: 'Javi', instagram: 'javivilchezz' },
  { name: 'Edu', instagram: 'edus.tattoo' },
];
