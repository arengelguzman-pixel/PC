// Genera los QR crudos de cada mesa: node scripts/qr-mesas.mjs <urlBase> <cantidad> <carpetaSalida>
// Ej: node scripts/qr-mesas.mjs "https://meza.arengel-guzman.workers.dev/m/elgaraje-a3f9k2m8x1" 8 qr-out
import QRCode from 'qrcode';
import { mkdirSync } from 'node:fs';
const [base, n = '8', out = 'qr-out'] = process.argv.slice(2);
if (!base) { console.error('falta la URL base'); process.exit(1); }
mkdirSync(out, { recursive: true });
for (let i = 1; i <= Number(n); i++) {
  const url = `${base}?mesa=${i}`;
  await QRCode.toFile(`${out}/qr-${i}.png`, url, { width: 1000, margin: 1, errorCorrectionLevel: 'H', color: { dark: '#000000', light: '#FFFFFF' } });
  console.log(`qr-${i}.png → ${url}`);
}
