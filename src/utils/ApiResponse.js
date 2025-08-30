/**
 * Standardized API Response Utility
 * Provides consistent response format across all API endpoints
 */
class ApiResponse {
  constructor(success = true, message = '', data = null, statusCode = 200) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }

  // Success responses
  static success(data = null, message = 'Operation successful', statusCode = 200) {
    return new ApiResponse(true, message, data, statusCode);
  }

  static created(data = null, message = 'Resource created successfully') {
    return new ApiResponse(true, message, data, 201);
  }

  static updated(data = null, message = 'Resource updated successfully') {
    return new ApiResponse(true, message, data, 200);
  }

  static deleted(message = 'Resource deleted successfully') {
    return new ApiResponse(true, message, null, 200);
  }

  // Error responses
  static error(message = 'Operation failed', statusCode = 500, data = null) {
    return new ApiResponse(false, message, data, statusCode);
  }

  static badRequest(message = 'Bad request', data = null) {
    return new ApiResponse(false, message, data, 400);
  }

  static unauthorized(message = 'Unauthorized access', data = null) {
    return new ApiResponse(false, message, data, 401);
  }

  static forbidden(message = 'Forbidden access', data = null) {
    return new ApiResponse(false, message, data, 403);
  }

  static notFound(message = 'Resource not found', data = null) {
    return new ApiResponse(false, message, data, 404);
  }

  static conflict(message = 'Resource conflict', data = null) {
    return new ApiResponse(false, message, data, 409);
  }

  static validationError(message = 'Validation failed', errors = null) {
    return new ApiResponse(false, message, { errors }, 422);
  }

  static tooManyRequests(message = 'Too many requests', data = null) {
    return new ApiResponse(false, message, data, 429);
  }

  static internalError(message = 'Internal server error', data = null) {
    return new ApiResponse(false, message, data, 500);
  }

  // Pagination response
  static paginated(data, page, limit, total, message = 'Data retrieved successfully') {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    };

    return new ApiResponse(true, message, { data, pagination }, 200);
  }

  // List response with count
  static list(data, total, message = 'Data retrieved successfully') {
    return new ApiResponse(true, message, { data, total }, 200);
  }

  // Send response to Express res object
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp
    });
  }

  // Convert to plain object
  toObject() {
    return {
      success: this.success,
      message: this.message,
      data: this.data,
      statusCode: this.statusCode,
      timestamp: this.timestamp
    };
  }
}

export default ApiResponse;
