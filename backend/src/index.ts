import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { upgradeWebSocket } from './ws.js';

const app = new Hono();

app.get('/', (c) => c.text('Notepad RT API'));

app.get('/ws', upgradeWebSocket);

serve({ fetch: app.fetch, port: process.env.PORT ? Number(process.env.PORT) : 4000 });