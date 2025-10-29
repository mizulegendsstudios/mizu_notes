import { upgradeWebSocket } from '@hono/node-server/dist/ws';
import { verifyJWT } from './auth.js';
import { get, set } from './db.js';

export const upgradeWebSocket = upgradeWebSocket((c) => ({
  onOpen(evt, ws) {
    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(ev.data as ArrayBuffer));
        if (msg.t === 'auth') {
          const ok = await verifyJWT(msg.token);
          if (!ok) ws.close(1008, 'Invalid token');
          else (ws as any).authed = true;
          return;
        }
        if (!(ws as any).authed) return ws.close(1008, 'Unauthorized');
        if (msg.t === 'sync') {
          await set('pad', msg.text);
          ws.send(new TextEncoder().encode(JSON.stringify({ t: 'sync', text: msg.text, ts: Date.now() })));
        }
      } catch {}
    };
  },
}));