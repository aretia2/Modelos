// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio definitivo: mantener sincronizado con `site.url` en src/data/site.ts
export default defineConfig({
  site: 'https://lallorona-sevilla.netlify.app',
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  image: { layout: 'constrained' },
});
