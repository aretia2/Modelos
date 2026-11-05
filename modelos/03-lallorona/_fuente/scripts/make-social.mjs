// Genera public/og.png (1200x630) con el sello del estudio.
// Uso: node scripts/make-social.mjs
import sharp from 'sharp';

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0e0d0c"/>
  <line x1="70" y1="110" x2="660" y2="110" stroke="#ece6da" stroke-opacity=".2"/>
  <text x="70" y="92" fill="#b5865a" font-family="Arial Narrow, Arial, sans-serif" font-size="22" letter-spacing="4" font-weight="700">PRIVATE STUDIO · MONTEQUINTO, SEVILLA</text>
  <text x="64" y="300" fill="#ece6da" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="104">La Llorona</text>
  <text x="70" y="390" fill="#ece6da" font-family="Arial Narrow, Arial, sans-serif" font-weight="800" font-size="40">PA QUE LLORE MI MARE,</text>
  <text x="70" y="440" fill="#86c1e8" font-family="Arial Narrow, Arial, sans-serif" font-weight="800" font-size="40">QUE LLORE LA TUYA.</text>
  <text x="70" y="545" fill="#b9b1a4" font-family="Arial, sans-serif" font-size="24">Estudio de tatuaje · @lallorona.sevilla</text>
</svg>`;

const seal = await sharp('src/assets/marca/logo.png').resize(430, 430).toBuffer();
await sharp(Buffer.from(og))
  .composite([{ input: seal, left: 735, top: 100 }])
  .png()
  .toFile('public/og.png');
console.log('OK: public/og.png');
