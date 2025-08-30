import Joi from 'joi';
import { commonValidations } from '../middleware/validate.js';

/**
 * Get all users validation schema
 */
const getAllUsers = {
  query: Joi.object({
    page: commonValidations.page,
    limit: commonValidations.limit,
    search: Joi.string().min(1).max(100).optional(),
    sortBy: Joi.string().valid('firstName', 'lastName', 'email', 'createdAt', 'lastSeen').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

/**
 * Search users validation schema
 */
const searchUsers = {
  query: Joi.object({
    q: Joi.string().min(1).max(100).required().messages({
      'any.required': 'Search query is required',
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query cannot exceed 100 characters'
    }),
    page: commonValidations.page,
    limit: commonValidations.limit,
    sortBy: Joi.string().valid('firstName', 'lastName', 'email', 'createdAt', 'lastSeen').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

/**
 * Get user by ID validation schema
 */
const getUserById = {
  params: Joi.object({
    id: commonValidations.objectId
  })
};

/**
 * Update user validation schema
 */
const updateUser = {
  params: Joi.object({
    id: commonValidations.objectId
  }),
  body: Joi.object({
    firstName: commonValidations.name.optional(),
    lastName: commonValidations.name.optional(),
    phone: commonValidations.phone.optional(),
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'auto').optional(),
      language: Joi.string().min(2).max(5).optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional()
      }).optional()
    }).optional()
  })
};

/**
 * Update user status validation schema
 */
const updateUserStatus = {
  params: Joi.object({
    id: commonValidations.objectId
  }),
  body: Joi.object({
    isActive: Joi.boolean().optional(),
    isDeleted: Joi.boolean().optional()
  })
};

/**
 * Delete user validation schema
 */
const deleteUser = {
  params: Joi.object({
    id: commonValidations.objectId
  })
};

/**
 * Update profile validation schema
 */
const updateProfile = {
  body: Joi.object({
    firstName: commonValidations.name.optional(),
    lastName: commonValidations.name.optional(),
    phone: commonValidations.phone.optional(),
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'auto').optional(),
      language: Joi.string().min(2).max(5).optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional()
      }).optional()
    }).optional()
  })
};

/**
 * Delete account validation schema
 */
const deleteAccount = {
  body: Joi.object({
    password: Joi.string().required().messages({
      'any.required': 'Password is required for account deletion'
    })
  })
};

/**
 * Change password validation schema
 */
const changePassword = {
  body: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: commonValidations.password
  })
};

/**
 * Get users by date range validation schema
 */
const getUsersByDateRange = {
  query: Joi.object({
    startDate: Joi.date().iso().required().messages({
      'any.required': 'Start date is required',
      'date.format': 'Start date must be a valid ISO date'
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
      'any.required': 'End date is required',
      'date.format': 'End date must be a valid ISO date',
      'date.min': 'End date must be after start date'
    }),
    page: commonValidations.page,
    limit: commonValidations.limit,
    sortBy: Joi.string().valid('firstName', 'lastName', 'email', 'createdAt', 'lastSeen').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

/**
 * Get users by role validation schema
 */
const getUsersByRole = {
  params: Joi.object({
    roleId: commonValidations.objectId
  }),
  query: Joi.object({
    page: commonValidations.page,
    limit: commonValidations.limit,
    sortBy: Joi.string().valid('firstName', 'lastName', 'email', 'createdAt', 'lastSeen').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

export const userValidation = {
  getAllUsers,
  searchUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  updateProfile,
  deleteAccount,
  changePassword,
  getUsersByDateRange,
  getUsersByRole
};
