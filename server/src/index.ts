import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import meetingRoutes from './routes/meetingRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notification.js';
import path from 'path';

import http from 'http';
import { initSocket } from './utils/socketManager.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(server);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Static folders
const rootDir = path.resolve();
console.log(`[Server] Detected Root Directory: ${rootDir}`);
console.log(`[Server] Environment: ${process.env.NODE_ENV}`);

app.use('/uploads', express.static(path.join(rootDir, 'server', 'uploads')));

// Serve frontend static files
const distPath = path.join(rootDir, 'dist');
app.use(express.static(distPath));

import fs from 'fs';

// API Health Check
app.get('/health', (req, res) => {
  const dPath = path.join(rootDir, 'dist');
  res.json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV,
    rootDir,
    distPath: dPath,
    distPathExists: fs.existsSync(dPath),
    indexExists: fs.existsSync(path.join(dPath, 'index.html'))
  });
});

// Catch-all route for SPA - MUST BE LAST
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(rootDir, 'dist', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error(`[Server] Error sending index.html: ${err.message}`);
        res.status(404).send('Frontend build not found. Please run build command first.');
      }
    });
  }
});

const startServer = async () => {
  try {
    await connectDB();
    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} (0.0.0.0)`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
