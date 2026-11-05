/**
 * Datos del negocio. Es el ÚNICO sitio donde hay que tocar teléfono, enlaces o dirección.
 * Los valores `null` están pendientes de confirmar: los bloques que dependen de ellos no se muestran.
 */

const instagramHandle = 'lallorona.sevilla';

export const site = {
  name: 'La Llorona',
  descriptor: 'Private Studio',
  /** Dominio definitivo (sin barra final). Cambiar cuando se registre el dominio. */
  url: 'https://lallorona-sevilla.netlify.app',

  /**
   * Mientras sea `true`, los textos provisionales y las fotos pendientes muestran una etiqueta visible.
   * Ponerlo a `false` solo cuando el estudio haya aprobado los textos.
   */
  showDraftMarks: true,

  instagram: {
    handle: instagramHandle,
    url: `https://www.instagram.com/${instagramHandle}/`,
    /** Abre directamente un mensaje directo con el estudio. */
    dm: `https://ig.me/m/${instagramHandle}`,
  },

  /** Número en formato internacional sin "+" ni espacios, p. ej. '34600000000'. Pendiente. */
  whatsapp: null as string | null,
  /** Teléfono para enlaces tel:, p. ej. '+34 600 00 00 00'. Pendiente. */
  phone: null as string | null,

  address: {
    street: 'Calle Viterbo 7, local 2',
    area: 'Montequinto',
    city: 'Sevilla',
    /** Pendiente de confirmar con el estudio. */
    postalCode: null as string | null,
    country: 'ES',
  },

  /** Horario en texto libre, p. ej. [['Lunes a viernes', '10:00–20:00']]. Pendiente. */
  hours: null as [string, string][] | null,

  /** Titular de la web para el aviso legal y la privacidad. Pendiente. */
  legal: {
    owner: null as string | null,
    taxId: null as string | null,
    email: null as string | null,
  },
};

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${site.address.street}, ${site.address.area}, ${site.address.city}`,
)}`;

export const phoneHref = site.phone ? `tel:${site.phone.replace(/\s+/g, '')}` : null;

export function whatsappUrl(text?: string) {
  if (!site.whatsapp) return null;
  return `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** Canal principal de cita: WhatsApp si está configurado; si no, mensaje directo de Instagram. */
export const primaryContact = site.whatsapp
  ? { href: whatsappUrl()!, channel: 'WhatsApp' as const }
  : { href: site.instagram.dm, channel: 'Instagram' as const };

export const nav = [
  { href: '/#trabajos', label: 'Trabajos' },
  { href: '/#residentes', label: 'Residentes' },
  { href: '/#estudio', label: 'Estudio' },
  { href: '/#contacto', label: 'Contacto' },
];
