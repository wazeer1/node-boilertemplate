import express from 'express';
import { roleController } from '../controllers/role.controller.js';
import { authenticate, requireRole, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { roleValidation } from '../validations/role.validation.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to all role routes
router.use(strictRateLimiter);

// All role routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

// Role management routes
router.get('/', validate(roleValidation.getAllRoles), roleController.getAllRoles);
router.get('/search', validate(roleValidation.searchRoles), roleController.searchRoles);
router.get('/:id', validate(roleValidation.getRoleById), roleController.getRoleById);
router.post('/', validate(roleValidation.createRole), roleController.createRole);
router.put('/:id', validate(roleValidation.updateRole), roleController.updateRole);
router.delete('/:id', validate(roleValidation.deleteRole), roleController.deleteRole);

// Role permissions management
router.put('/:id/permissions', validate(roleValidation.updateRolePermissions), roleController.updateRolePermissions);
router.post('/:id/permissions', validate(roleValidation.addRolePermissions), roleController.addRolePermissions);
router.delete('/:id/permissions', validate(roleValidation.removeRolePermissions), roleController.removeRolePermissions);

// Role statistics
router.get('/stats/overview', roleController.getRoleStats);
router.get('/stats/by-permission', roleController.getRoleStatsByPermission);

// Role assignment
router.post('/:id/assign', validate(roleValidation.assignRole), roleController.assignRole);
router.delete('/:id/assign', validate(roleValidation.unassignRole), roleController.unassignRole);

export default router;
