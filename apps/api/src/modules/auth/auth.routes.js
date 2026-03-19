import { Router } from 'express';
import { registerHandler, loginHandler, forgotPasswordHandler, resetPasswordHandler, changePasswordHandler, updateProfileHandler } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.post('/register',         registerHandler);
router.post('/login',            loginHandler);
router.post('/forgot-password',  forgotPasswordHandler);
router.post('/reset-password',   resetPasswordHandler);
router.post('/change-password',  authenticate, changePasswordHandler);
router.patch('/profile',         authenticate, updateProfileHandler);

export default router;
