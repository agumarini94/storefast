import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import {
  getPublicStore,
  getMyStores,
  createStore,
  updateTheme,
  updateContact,
} from './store.controller.js';

const router = Router();

// Rutas públicas
router.get('/public/:slug', getPublicStore);

// Rutas protegidas (dashboard del owner)
router.use(authenticate);
router.get('/', getMyStores);
router.post('/', createStore);
router.patch('/:storeId/theme', updateTheme);
router.patch('/:storeId/contact', updateContact);

export default router;
