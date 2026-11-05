import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}',
  { eager: true },
);

/** Convierte una ruta relativa a src/assets en la imagen importada, o undefined si no existe. */
export function resolveImage(path?: string): ImageMetadata | undefined {
  if (!path) return undefined;
  const mod = files[`/src/assets/${path}`];
  if (!mod) {
    console.warn(`[imagen] No se encuentra src/assets/${path}; se muestra la placa provisional.`);
    return undefined;
  }
  return mod.default;
}
