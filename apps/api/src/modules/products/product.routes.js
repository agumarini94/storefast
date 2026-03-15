import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { resolveTenant } from '../../middlewares/tenant.js';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './product.controller.js';

const router = Router({ mergeParams: true });

// Pública
router.get('/',                                              resolveTenant, getProducts);

// Protegidas — middleware inline para evitar que afecte al GET público
router.post('/',            authenticate, resolveTenant, createProduct);
router.patch('/:productId', authenticate, resolveTenant, updateProduct);
router.delete('/:productId',authenticate, resolveTenant, deleteProduct);

export default router;
