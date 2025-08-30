/**
 * Custom API Error Class
 * Extends the built-in Error class with additional properties for API error handling
 */
class ApiError extends Error {
  constructor(message, statusCode, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Predefined error types
  static badRequest(message = 'Bad request') {
    return new ApiError(message, 400, true);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(message, 401, true);
  }

  static forbidden(message = 'Forbidden access') {
    return new ApiError(message, 403, true);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, 404, true);
  }

  static conflict(message = 'Resource conflict') {
    return new ApiError(message, 409, true);
  }

  static validationError(message = 'Validation failed', errors = null) {
    const error = new ApiError(message, 422, true);
    error.errors = errors;
    return error;
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(message, 429, true);
  }

  static internalError(message = 'Internal server error') {
    return new ApiError(message, 500, false);
  }

  static serviceUnavailable(message = 'Service unavailable') {
    return new ApiError(message, 503, false);
  }

  // Database errors
  static databaseError(message = 'Database operation failed') {
    return new ApiError(message, 500, false);
  }

  static duplicateKeyError(message = 'Duplicate key violation') {
    return new ApiError(message, 409, true);
  }

  static constraintViolationError(message = 'Constraint violation') {
    return new ApiError(message, 400, true);
  }

  // Authentication errors
  static invalidCredentials(message = 'Invalid credentials') {
    return new ApiError(message, 401, true);
  }

  static tokenExpired(message = 'Token expired') {
    return new ApiError(message, 401, true);
  }

  static invalidToken(message = 'Invalid token') {
    return new ApiError(message, 401, true);
  }

  // File upload errors
  static fileTooLarge(message = 'File too large') {
    return new ApiError(message, 413, true);
  }

  static invalidFileType(message = 'Invalid file type') {
    return new ApiError(message, 400, true);
  }

  static uploadFailed(message = 'File upload failed') {
    return new ApiError(message, 500, false);
  }

  // Convert to plain object
  toObject() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  // Convert to JSON response format
  toResponse() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp
    };
  }

  // Check if error is operational (expected) or programming error
  isOperational() {
    return this.isOperational;
  }

  // Get error type based on status code
  getErrorType() {
    if (this.statusCode >= 500) return 'ServerError';
    if (this.statusCode >= 400) return 'ClientError';
    return 'UnknownError';
  }
}

export default ApiError;
