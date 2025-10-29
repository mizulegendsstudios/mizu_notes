import { initWS } from './ws.js';
import { initGameLoop } from './gameLoop.js';
import { applyDeadReckoning } from './deadReckoning.js';

const pad = document.getElementById('pad') as HTMLTextAreaElement;

initWS(pad);
initGameLoop(pad);
applyDeadReckoning(pad);