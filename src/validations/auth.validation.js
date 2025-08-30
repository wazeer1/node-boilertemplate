import Joi from 'joi';
import { commonValidations } from '../middleware/validate.js';

/**
 * User registration validation schema
 */
const register = {
  body: Joi.object({
    firstName: commonValidations.name,
    lastName: commonValidations.name,
    email: commonValidations.email,
    password: commonValidations.password,
    phone: commonValidations.phone.optional()
  })
};

/**
 * User login validation schema
 */
const login = {
  body: Joi.object({
    email: commonValidations.email,
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  })
};

/**
 * Forgot password validation schema
 */
const forgotPassword = {
  body: Joi.object({
    email: commonValidations.email
  })
};

/**
 * Reset password validation schema
 */
const resetPassword = {
  body: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
    }),
    newPassword: commonValidations.password
  })
};

/**
 * Verify email validation schema
 */
const verifyEmail = {
  body: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Verification token is required'
    })
  })
};

/**
 * Resend verification email validation schema
 */
const resendVerification = {
  body: Joi.object({
    email: commonValidations.email
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
 * Delete account validation schema
 */
const deleteAccount = {
  body: Joi.object({
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  })
};

/**
 * Update user status validation schema (admin only)
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
 * Refresh token validation schema
 */
const refreshToken = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required'
    })
  })
};

/**
 * Logout validation schema
 */
const logout = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required'
    })
  })
};

export default {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  updateProfile,
  changePassword,
  deleteAccount,
  updateUserStatus,
  refreshToken,
  logout
};
