import { WSPayload } from './types.js';

const WS_URL = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';

let ws: WebSocket;
let lastSent = '';

export function initWS(pad: HTMLTextAreaElement) {
  ws = new WebSocket(WS_URL);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    ws.send(JSON.stringify({ t: 'auth', token: localStorage.getItem('sb-token') }));
  };

  ws.onmessage = (ev) => {
    const msg = JSON.parse(new TextDecoder().decode(new Uint8Array(ev.data))) as WSPayload;
    if (msg.t === 'sync' && msg.text !== pad.value) {
      const caret = pad.selectionStart;
      pad.value = msg.text;
      pad.setSelectionRange(caret, caret);
    }
  };

  pad.addEventListener('input', () => {
    if (pad.value === lastSent) return;
    lastSent = pad.value;
    const buf = new TextEncoder().encode(JSON.stringify({ t: 'sync', text: pad.value, ts: Date.now() }));
    ws.send(buf);
  });
}