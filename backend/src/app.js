import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { morganMiddleware } from './middleware/morgan.middleware.js';

import authRouter from './routes/auth.route.js';
import bookRouter from './routes/book.route.js';
import paymentRouter from './routes/payment.route.js';
import aiRouter from './routes/ai.route.js';
import exportRouter from './routes/export.route.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(morganMiddleware);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Core API Routes
app.use('/api/auth', authRouter);
app.use('/api/diary', bookRouter);
app.use('/api/book', bookRouter); // Alias for backwards compatibility
app.use('/api/payment', paymentRouter);
app.use('/api/ai', aiRouter);
app.use('/api/export', exportRouter);

app.use('/', (req, res, next) => {
  if (req.path === '/' || req.path === '/api/health') {
    return res.json({
      status: 'active',
      app: 'LifeLog - Written Daily Life & Vlogs API',
      version: '2.0.0',
    });
  }
  next();
});

app.use(errorHandler);

export { app };
