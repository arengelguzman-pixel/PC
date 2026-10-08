// Reenvía pidemeza.com → meza.arengel-guzman.workers.dev conservando ruta, query, método,
// cuerpo y cabeceras (los WebSockets de la sala pasan igual). www → apex.
const ORIGEN = 'meza.arengel-guzman.workers.dev';
export default {
  async fetch(request) {
    const u = new URL(request.url);
    if (u.hostname.startsWith('www.')) {
      u.hostname = u.hostname.slice(4);
      return Response.redirect(u.toString(), 301);
    }
    u.hostname = ORIGEN; u.protocol = 'https:';
    const h = new Headers(request.headers);
    h.set('X-Forwarded-Host', 'pidemeza.com');
    return fetch(new Request(u.toString(), { method: request.method, headers: h, body: request.body, redirect: 'manual' }));
  },
};
