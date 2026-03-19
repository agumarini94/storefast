import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { resolveTenant } from '../../middlewares/tenant.js';
import { trackEvent, getStats } from './analytics.controller.js';

const router = Router({ mergeParams: true });

// POST /api/stores/:slug/analytics — pública, registra un clic
router.post('/', resolveTenant, trackEvent);

// GET /api/stores/:slug/analytics — protegida, devuelve stats al admin
router.get('/', authenticate, resolveTenant, getStats);

export default router;
