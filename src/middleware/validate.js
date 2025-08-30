import Joi from 'joi';
import ApiError from '../utils/ApiError.js';

/**
 * Request Validation Middleware
 * Validates request body, query, and params using Joi schemas
 */
export const validate = schema => {
  return (req, res, next) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
      .prefs({ errors: { label: 'key' }, abortEarly: false })
      .validate(object);

    if (error) {
      const errorMessage = error.details.map(details => details.message).join(', ');
      return next(ApiError.validationError(errorMessage, error.details));
    }

    Object.assign(req, value);
    next();
  };
};

/**
 * Pick properties from an object
 */
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

/**
 * Common validation schemas
 */
export const commonValidations = {
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'email').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().min(1).max(100).optional()
  }),

  // Individual pagination fields
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),

  // ObjectId validation
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format'
    }),

  // Email validation
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),

  // Password validation
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required'
    }),

  // Name validation
  name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Name can only contain letters and spaces',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 50 characters',
      'any.required': 'Name is required'
    }),

  // Phone validation
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]+$/)
    .min(10)
    .max(15)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  // Date validation
  date: Joi.date().iso().optional().messages({
    'date.format': 'Date must be in ISO format'
  }),

  // File validation
  file: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number()
      .max(5 * 1024 * 1024)
      .required(), // 5MB max
    destination: Joi.string().required(),
    filename: Joi.string().required(),
    path: Joi.string().required()
  })
};

/**
 * Custom validation functions
 */
export const customValidators = {
  // Check if value is not empty
  notEmpty: (value, helpers) => {
    if (!value || value.trim().length === 0) {
      return helpers.error('any.invalid');
    }
    return value;
  },

  // Check if value is a valid URL
  isValidUrl: (value, helpers) => {
    try {
      new URL(value);
      return value;
    } catch {
      return helpers.error('any.invalid');
    }
  },

  // Check if value is a valid date in the future
  futureDate: (value, helpers) => {
    const date = new Date(value);
    const now = new Date();
    if (date <= now) {
      return helpers.error('any.invalid');
    }
    return value;
  },

  // Check if value is a valid date in the past
  pastDate: (value, helpers) => {
    const date = new Date(value);
    const now = new Date();
    if (date >= now) {
      return helpers.error('any.invalid');
    }
    return value;
  }
};

/**
 * Validation error formatter
 */
export const formatValidationError = error => {
  if (error.isJoi) {
    const formattedErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));

    return {
      message: 'Validation failed',
      errors: formattedErrors
    };
  }

  return error;
};
