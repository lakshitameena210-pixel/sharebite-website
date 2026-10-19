import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth';
import foodRoutes from './server/routes/food';
import requestRoutes from './server/routes/requests';
import notificationRoutes from './server/routes/notifications';
import organizationRoutes from './server/routes/organizations';
import adminRoutes from './server/routes/admin';
import aiRoutes from './server/routes/ai';
import contactRoutes from './server/routes/contact';
import { db } from './server/db';
import { initSocketIO } from './server/socket';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');



dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize real-time Socket.IO handler on the same server
initSocketIO(httpServer);

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/contact', contactRoutes);

// Public Impact Stats
app.get('/api/impact/stats', (_req, res) => {
  const stats = db.getImpactStats();
  res.json({ stats });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Download entire website as a ZIP file
app.get('/api/download-zip', (_req, res) => {
  try {
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    res.attachment('sharebite-website.zip');
    res.setHeader('Content-Type', 'application/zip');

    archive.on('warning', (err: NodeJS.ErrnoException)  => {
      if (err.code === 'ENOENT') {
        console.warn('Archiver warning:', err);
      } else {
        throw err;
      }
    });

    archive.on('error', (err: NodeJS.ErrnoException)  => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate ZIP archive' });
      }
    });

    archive.pipe(res);

    // Append directories and files while excluding heavy/temporary folders
    const rootDir = process.cwd();
    archive.glob('**/*', {
      cwd: rootDir,
      ignore: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        '*.zip',
        '.vite/**',
        'bun.lock',
      ],
      dot: true, // Include .env.example, .gitignore, etc.
    });

    archive.finalize();
  } catch (err: any) {
    console.error('Error generating project zip:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download zip file' });
    }
  }
});

// Reset demo data endpoint (useful for demo testers)
app.post('/api/reset-demo', (_req, res) => {
  db.resetSeedData();
  res.json({ success: true, message: 'Demo data reset successfully' });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

async function startServer() {
  if (!isProduction) {
    // Mount Vite in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🌿 ShareBite Full-Stack server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
