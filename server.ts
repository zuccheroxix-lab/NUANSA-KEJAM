/**
 * PASEO GAME ZX - Full-Stack Express & Socket.IO Server
 * Serves Vite dev middleware or static dist, binds Socket.IO on port 3000.
 * Developer: ZUCCHERO XANN
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { GameServer } from './server/gameServer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Setup Socket.IO with permissive CORS for mobile / web clients
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Attach authoritative game server engine
  new GameServer(io);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      game: 'PASEO GAME ZX',
      version: '1.0.0',
      developer: 'ZUCCHERO XANN',
      timestamp: Date.now(),
    });
  });

  if (!isProd) {
    // Development mode: attach Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[PASEO GAME ZX] Server running at http://0.0.0.0:${PORT} (env: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[PASEO GAME ZX] Failed to start server:', err);
  process.exit(1);
});
