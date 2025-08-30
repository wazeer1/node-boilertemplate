import express from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate, requireRole, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { userValidation } from '../validations/user.validation.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to all user routes
router.use(strictRateLimiter);

// Public routes (if any)
// router.get('/public-profile/:id', userController.getPublicProfile);

// Protected routes - require authentication
router.use(authenticate);

// User profile routes
router.get('/me', userController.getMyProfile);
router.put('/me', validate(userValidation.updateProfile), userController.updateMyProfile);
router.delete('/me', validate(userValidation.deleteAccount), userController.deleteMyAccount);
router.put('/me/change-password', validate(userValidation.changePassword), userController.changeMyPassword);

// Admin routes - require admin role
router.use(requireRole('admin'));

// User management routes
router.get('/', validate(userValidation.getAllUsers), userController.getAllUsers);
router.get('/search', validate(userValidation.searchUsers), userController.searchUsers);
router.get('/:id', validate(userValidation.getUserById), userController.getUserById);
router.put('/:id', validate(userValidation.updateUser), userController.updateUser);
router.put('/:id/status', validate(userValidation.updateUserStatus), userController.updateUserStatus);
router.delete('/:id', validate(userValidation.deleteUser), userController.deleteUser);

// User statistics
router.get('/stats/overview', userController.getUserStats);
router.get('/stats/by-role', userController.getUserStatsByRole);
router.get('/stats/by-date', validate(userValidation.getUsersByDateRange), userController.getUsersByDateRange);

// Role-based user queries
router.get('/role/:roleId', validate(userValidation.getUsersByRole), userController.getUsersByRole);

export default router;
