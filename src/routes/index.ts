import { Router } from 'express';
import { authRouter } from '../modules/auth/index.js';
import { questionnaireRouter } from '../modules/questionnaire/index.js';

const router = Router();

/**
 * API Routes
 *
 * All routes are prefixed with /api/v1 (set in app.ts)
 */

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes: /api/v1/auth/*
router.use('/auth', authRouter);

// Questionnaire routes: /api/v1/questionnaire/*
router.use('/questionnaire', questionnaireRouter);

// TODO: Add more module routes here
// router.use('/users', userRouter);

export const apiRouter = router;
