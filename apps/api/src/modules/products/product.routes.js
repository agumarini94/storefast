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

// Pública: GET /stores/:slug/products
router.get('/', resolveTenant, getProducts);

// Protegidas: dashboard
router.use(authenticate, resolveTenant);
router.post('/',              createProduct);
router.patch('/:productId',   updateProduct);
router.delete('/:productId',  deleteProduct);

export default router;
