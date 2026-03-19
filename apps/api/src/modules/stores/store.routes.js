import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import {
  getPublicStore,
  getMyStores,
  createStore,
  updateTheme,
  updateContact,
  updateAbout,
  updateInfo,
} from './store.controller.js';

const router = Router();

// Pública
router.get('/public/:slug', getPublicStore);

// Protegidas — middleware inline
router.get('/',                        authenticate, getMyStores);
router.post('/',                       authenticate, createStore);
router.patch('/:storeId/theme',        authenticate, updateTheme);
router.patch('/:storeId/contact',      authenticate, updateContact);
router.patch('/:storeId/about',        authenticate, updateAbout);
router.patch('/:storeId/info',         authenticate, updateInfo);

export default router;
