import express from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, authenticateRefresh } from '../middleware/auth.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';
import { catchAsync } from '../middleware/error.js';
import authController from '../controllers/auth.controller.js';
import authValidation from '../validations/auth.validation.js';

const router = express.Router();

// Apply strict rate limiting to auth routes
router.use(strictRateLimiter);

// Public routes
router.post('/register', 
  validate(authValidation.register), 
  catchAsync(authController.register)
);

router.post('/login', 
  validate(authValidation.login), 
  catchAsync(authController.login)
);

router.post('/forgot-password',
  validate(authValidation.forgotPassword),
  catchAsync(authController.forgotPassword)
);

router.post('/reset-password',
  validate(authValidation.resetPassword),
  catchAsync(authController.resetPassword)
);

router.post('/verify-email',
  validate(authValidation.verifyEmail),
  catchAsync(authController.verifyEmail)
);

router.post('/resend-verification',
  validate(authValidation.resendVerification),
  catchAsync(authController.resendVerification)
);

// Protected routes
router.post('/refresh', 
  authenticateRefresh, 
  catchAsync(authController.refreshToken)
);

router.post('/logout', 
  authenticate, 
  catchAsync(authController.logout)
);

router.post('/logout-all',
  authenticate,
  catchAsync(authController.logoutAll)
);

router.get('/me',
  authenticate,
  catchAsync(authController.getProfile)
);

router.put('/profile',
  authenticate,
  validate(authValidation.updateProfile),
  catchAsync(authController.updateProfile)
);

router.put('/change-password',
  authenticate,
  validate(authValidation.changePassword),
  catchAsync(authController.changePassword)
);

router.delete('/account',
  authenticate,
  validate(authValidation.deleteAccount),
  catchAsync(authController.deleteAccount)
);

// Admin routes
router.get('/users',
  authenticate,
  catchAsync(authController.getAllUsers)
);

router.get('/users/:id',
  authenticate,
  catchAsync(authController.getUserById)
);

router.put('/users/:id/status',
  authenticate,
  validate(authValidation.updateUserStatus),
  catchAsync(authController.updateUserStatus)
);

export default router;
