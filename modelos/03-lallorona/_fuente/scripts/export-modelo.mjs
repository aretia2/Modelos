/**
 * Convierte dist/ en una copia estática que se abre con doble clic (file://) dentro del hub:
 * rutas relativas en vez de absolutas y scripts clásicos (IIFE) en vez de módulos con import.
 *
 *   npm run build && node scripts/export-modelo.mjs
 *
 * Escribe en la carpeta padre (modelos/03-lallorona/), sin tocar _fuente/.
 */
import { cp, readFile, writeFile, readdir, rm, stat } from 'node:fs/promises';
import { join, relative, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'rolldown';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const out = join(root, '..');

async function walk(dir) {
  const files = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) files.push(...(await walk(p)));
    else files.push(p);
  }
  return files;
}

// Limpia la exportación anterior (todo menos _fuente/).
for (const name of await readdir(out)) {
  if (name !== '_fuente') await rm(join(out, name), { recursive: true, force: true });
}
await cp(dist, out, { recursive: true, filter: (src) => !/sitemap|robots\.txt/.test(src) });

const bundled = new Map();
async function toIife(file) {
  if (!bundled.has(file)) {
    const name = file.replace(/\.js$/, '.iife.js');
    await build({ input: join(out, '_astro', file), output: { format: 'iife', file: join(out, '_astro', name) }, logLevel: 'silent' });
    bundled.set(file, name);
  }
  return bundled.get(file);
}

for (const file of await walk(out)) {
  if (file.includes(`${join(out, '_fuente')}`)) continue;

  if (file.endsWith('.css')) {
    const css = await readFile(file, 'utf8');
    await writeFile(file, css.replaceAll('url(/_astro/', 'url(./'));
    continue;
  }
  if (!file.endsWith('.html')) continue;

  const depth = relative(out, dirname(file)).split(/[\\/]/).filter(Boolean).length;
  const up = '../'.repeat(depth);
  const home = `${up}index.html`;
  let html = await readFile(file, 'utf8');

  // Módulos externos → script clásico empaquetado.
  for (const [tag, src] of [...html.matchAll(/<script type="module" src="\/_astro\/([^"]+)"><\/script>/g)]) {
    html = html.replace(tag, `<script defer src="${up}_astro/${await toIife(src)}"></script>`);
  }
  // Los módulos en línea no importan nada y funcionan igual en file://: se quedan como están.

  html = html
    .replace(/<link rel="sitemap"[^>]*>/g, '')
    .replace(/([\s,"])\/_astro\//g, `$1${up}_astro/`)
    .replace(/href="\/([a-z-]+)\/"/g, `href="${up}$1/index.html"`)
    .replace(/href="\/(#[^"]*)?"/g, (_, hash = '') => `href="${depth === 0 && file.endsWith('index.html') && hash ? '' : home}${hash}"`)
    .replace(/(href|src)="\/(?!\/)([^"]+)"/g, `$1="${up}$2"`);

  await writeFile(file, html);
}

// Los módulos originales ya no se usan.
for (const file of bundled.keys()) await rm(join(out, '_astro', file));
for (const f of await readdir(join(out, '_astro'))) {
  if (/^dom\.[^.]+\.js$/.test(f)) await rm(join(out, '_astro', f));
}

console.log('Exportado en', posix.normalize(out.replaceAll('\\', '/')));
