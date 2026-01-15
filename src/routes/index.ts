import { Router } from 'express';
import { authRouter } from '../modules/auth/index.js';
import { questionnaireRouter } from '../modules/questionnaire/index.js';
import { adminRouter } from '../modules/admin/index.js';
import { countriesAdminRouter, countriesPublicRouter } from '../modules/countries/index.js';
import { reportsAdminRouter, reportsPublicRouter } from '../modules/reports/index.js';
import { notificationsUserRouter, notificationsAdminRouter } from '../modules/notifications/index.js';
import { uploadRouter } from '../modules/upload/index.js';

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

// Countries routes: /api/v1/countries/* (public)
router.use('/countries', countriesPublicRouter);

// Admin routes: /api/v1/admin/*
router.use('/admin', adminRouter);

// Admin countries routes: /api/v1/admin/countries/*
router.use('/admin/countries', countriesAdminRouter);

// Reports routes: /api/v1/reports/* (authenticated users)
router.use('/reports', reportsPublicRouter);

// Admin reports routes: /api/v1/admin/reports/*
router.use('/admin/reports', reportsAdminRouter);

// Notifications routes: /api/v1/notifications/* (authenticated users)
router.use('/notifications', notificationsUserRouter);

// Admin notifications routes: /api/v1/admin/notifications/*
router.use('/admin/notifications', notificationsAdminRouter);

// Upload routes: /api/v1/upload/*
router.use('/upload', uploadRouter);

export const apiRouter = router;
