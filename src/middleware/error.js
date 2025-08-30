import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Global error handling middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error
  logger.logError(err, req);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = ApiError.notFound(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = ApiError.conflict(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = ApiError.validationError(message, err.errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = ApiError.unauthorized(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = ApiError.unauthorized(message);
  }

  // Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    error = ApiError.validationError(message, err.errors);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value entered';
    error = ApiError.conflict(message);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Referenced resource does not exist';
    error = ApiError.badRequest(message);
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = ApiError.tooManyRequests('Too many requests from this IP');
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = ApiError.fileTooLarge('File too large');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = ApiError.badRequest('Unexpected file field');
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  if (isDevelopment) {
    errorResponse.stack = err.stack;
    errorResponse.error = err;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found middleware
 * Handles 404 errors for undefined routes
 */
export const notFound = (req, res, next) => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Validation error handler
 * Handles Joi validation errors
 */
export const handleValidationError = (err, req, res, next) => {
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    const error = ApiError.validationError(message, err.details);
    return next(error);
  }
  next(err);
};

/**
 * Database error handler
 * Handles database-specific errors
 */
export const handleDatabaseError = (err, req, res, next) => {
  if (err.name && err.name.includes('Sequelize')) {
    const error = ApiError.databaseError('Database operation failed');
    return next(error);
  }
  next(err);
};
