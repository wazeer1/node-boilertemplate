import Joi from 'joi';
import { commonValidations } from '../middleware/validate.js';

/**
 * Get all roles validation schema
 */
const getAllRoles = {
  query: Joi.object({
    page: commonValidations.page,
    limit: commonValidations.limit,
    search: Joi.string().min(1).max(100).optional(),
    sortBy: Joi.string().valid('name', 'description', 'createdAt', 'permissionCount').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

/**
 * Search roles validation schema
 */
const searchRoles = {
  query: Joi.object({
    q: Joi.string().min(1).max(100).required().messages({
      'any.required': 'Search query is required',
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query cannot exceed 100 characters'
    }),
    page: commonValidations.page,
    limit: commonValidations.limit,
    sortBy: Joi.string().valid('name', 'description', 'createdAt', 'permissionCount').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

/**
 * Get role by ID validation schema
 */
const getRoleById = {
  params: Joi.object({
    id: commonValidations.objectId
  })
};

/**
 * Create role validation schema
 */
const createRole = {
  body: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .required()
      .messages({
        'any.required': 'Role name is required',
        'string.min': 'Role name must be at least 2 characters long',
        'string.max': 'Role name cannot exceed 50 characters',
        'string.pattern.base': 'Role name can only contain letters, numbers, hyphens, and underscores'
      }),
    description: Joi.string()
      .min(5)
      .max(200)
      .optional()
      .messages({
        'string.min': 'Description must be at least 5 characters long',
        'string.max': 'Description cannot exceed 200 characters'
      }),
    permissions: Joi.array()
      .items(Joi.string().valid(
        'admin:all',
        'user:read', 'user:create', 'user:update', 'user:delete', 'user:list',
        'role:read', 'role:create', 'role:update', 'role:delete', 'role:list',
        'auth:login', 'auth:register', 'auth:refresh', 'auth:logout',
        'profile:read', 'profile:update', 'profile:delete',
        'content:read', 'content:create', 'content:update', 'content:delete', 'content:publish',
        'file:upload', 'file:download', 'file:delete', 'file:list'
      ))
      .min(1)
      .required()
      .messages({
        'any.required': 'At least one permission is required',
        'array.min': 'At least one permission is required'
      }),
    isDefault: Joi.boolean().optional(),
    isSystem: Joi.boolean().optional(),
    isActive: Joi.boolean().optional()
  })
};

/**
 * Update role validation schema
 */
const updateRole = {
  params: Joi.object({
    id: commonValidations.objectId
  }),
  body: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .optional()
      .messages({
        'string.min': 'Role name must be at least 2 characters long',
        'string.max': 'Role name cannot exceed 50 characters',
        'string.pattern.base': 'Role name can only contain letters, numbers, hyphens, and underscores'
      }),
    description: Joi.string()
      .min(5)
      .max(200)
      .optional()
      .messages({
        'string.min': 'Description must be at least 5 characters long',
        'string.max': 'Description cannot exceed 200 characters'
      }),
    isActive: Joi.boolean().optional()
  })
};

/**
 * Delete role validation schema
 */
const deleteRole = {
  params: Joi.object({
    id: commonValidations.objectId
  })
};

/**
 * Update role permissions validation schema
 */
const updateRolePermissions = {
  params: Joi.object({
    id: commonValidations.objectId
  }),
  body: Joi.object({
    permissions: Joi.array()
      .items(Joi.string().valid(
        'admin:all',
        'user:read', 'user:create', 'user:update', 'user:delete', 'user:list',
        'role:read', 'role:create', 'role:update', 'role:delete', 'role:list',
        'auth:login', 'auth:register', 'auth:refresh', 'auth:logout',
        'profile:read', 'profile:update', 'profile:delete',
        'content:read', 'content:create', 'content:update', 'content:delete', 'content:publish',
        'file:upload', 'file:download', 'file:delete', 'file:list'
      ))
      .min(1)
      .required()
      .messages({
        'any.required': 'Permissions array is required',
        'array.min': 'At least one permission is required'
      })
  })
};

/**
 * Add role permissions validation schema
 */
const addRolePermissions = {
  params: Joi.object({
    id: commonValidations.objectId
  }),
  body: Joi.object({
    permissions: Joi.array()
      .items(Joi.string().valid(
        'admin:all',
        'user:read', 'user:create', 'user:update', 'user:delete', 'user:list',
        'role:read', 'role:create', 'role:update', 'role:delete', 'role:list',
        'auth:login', 'auth:register', 'auth:refresh', 'auth:logout',
        'profile:read', 'profile:update', 'profile:delete',
        'content:read', 'content:create', 'content:update', 'content:delete', 'content:publish',
        'file:upload', 'file:download', 'file:delete', 'file:list'
      ))
      .min(1)
      .required()
      .messages({
        'any.required': 'Permissions array is required',
        'array.min': 'At least one permission is required'
      })
  })
};

/**
 * Remove role permissions validation schema
 */
const removeRolePermissions = {
  params: Joi.object({
    id: commonValidations.objectId
  }),
  body: Joi.object({
    permissions: Joi.array()
      .items(Joi.string().valid(
        'admin:all',
        'user:read', 'user:create', 'user:update', 'user:delete', 'user:list',
        'role:read', 'role:create', 'role:update', 'role:delete', 'role:list',
        'auth:login', 'auth:register', 'auth:refresh', 'auth:logout',
        'profile:read', 'profile:update', 'profile:delete',
        'content:read', 'content:create', 'content:update', 'content:delete', 'content:publish',
        'file:upload', 'file:download', 'file:delete', 'file:list'
      ))
      .min(1)
      .required()
      .messages({
        'any.required': 'Permissions array is required',
        'array.min': 'At least one permission is required'
      })
  })
};

/**
 * Assign role validation schema
 */
const assignRole = {
  params: Joi.object({
    id: commonValidations.objectId
  }),
  body: Joi.object({
    userId: commonValidations.objectId.required().messages({
      'any.required': 'User ID is required'
    })
  })
};

/**
 * Unassign role validation schema
 */
const unassignRole = {
  params: Joi.object({
    id: commonValidations.objectId
  }),
  body: Joi.object({
    userId: commonValidations.objectId.required().messages({
      'any.required': 'User ID is required'
    })
  })
};

export const roleValidation = {
  getAllRoles,
  searchRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
  addRolePermissions,
  removeRolePermissions,
  assignRole,
  unassignRole
};
