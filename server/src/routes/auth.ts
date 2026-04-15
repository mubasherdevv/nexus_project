import { Router } from 'express';
import { register, login, logout, getMe, updateProfile, verify2FA, toggle2FA } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { registerValidation, loginValidation, validate } from '../middleware/validation.js';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/verify-2fa', verify2FA);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/toggle-2fa', protect, toggle2FA);

export default router;
