// Conecta el bot de Telegram con el Worker (una sola vez).
//   node scripts/telegram-setup.mjs <TOKEN_DEL_BOT> <TELEGRAM_WEBHOOK_SECRET> [https://meza.arengel-guzman.workers.dev]
// Antes: npx wrangler secret put TELEGRAM_TOKEN  y  npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
// Después: pon el usuario del bot (sin @) en TELEGRAM_BOT de wrangler.toml y vuelve a publicar.
const [token, secreto, base = 'https://meza.arengel-guzman.workers.dev'] = process.argv.slice(2);
if (!token || !secreto) { console.log('uso: node scripts/telegram-setup.mjs <TOKEN> <SECRETO> [urlBase]'); process.exit(1); }
const api = (m, q = '') => fetch(`https://api.telegram.org/bot${token}/${m}${q}`).then((r) => r.json());
const yo = await api('getMe');
if (!yo.ok) { console.log('Token inválido:', yo.description); process.exit(1); }
const wh = await api('setWebhook', `?url=${encodeURIComponent(base + '/api/telegram')}&secret_token=${encodeURIComponent(secreto)}&allowed_updates=${encodeURIComponent('["message"]')}`);
console.log('Bot:', '@' + yo.result.username);
console.log('Webhook:', wh.ok ? 'listo → ' + base + '/api/telegram' : 'falló: ' + wh.description);
console.log(`\nAhora en wrangler.toml: TELEGRAM_BOT = "${yo.result.username}"  y  npm run deploy`);
