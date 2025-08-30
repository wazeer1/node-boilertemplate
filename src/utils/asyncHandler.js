/**
 * Wrapper for async route handlers to catch errors
 * This is an alternative to the catchAsync middleware
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wrapper for async functions that don't have req, res, next
 */
const asyncWrapper = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error;
    }
  };
};

/**
 * Wrapper for async functions with custom error handling
 */
const asyncHandlerWithErrorHandling = (fn, errorHandler) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        return errorHandler(error, ...args);
      }
      throw error;
    }
  };
};

/**
 * Wrapper for async functions with timeout
 */
const asyncHandlerWithTimeout = (fn, timeoutMs = 5000) => {
  return async (...args) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([
        fn(...args),
        timeoutPromise
      ]);
      return result;
    } catch (error) {
      throw error;
    }
  };
};

/**
 * Wrapper for async functions with retry logic
 */
const asyncHandlerWithRetry = (fn, maxRetries = 3, delayMs = 1000) => {
  return async (...args) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
    
    throw lastError;
  };
};

/**
 * Wrapper for async functions with circuit breaker pattern
 */
const createCircuitBreaker = (fn, failureThreshold = 5, timeoutMs = 5000) => {
  let failures = 0;
  let lastFailureTime = 0;
  let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  
  return async (...args) => {
    const now = Date.now();
    
    // Check if circuit is open
    if (state === 'OPEN') {
      if (now - lastFailureTime > timeoutMs) {
        state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn(...args);
      
      // Reset on success
      if (state === 'HALF_OPEN') {
        state = 'CLOSED';
        failures = 0;
      }
      
      return result;
    } catch (error) {
      failures++;
      lastFailureTime = now;
      
      if (failures >= failureThreshold) {
        state = 'OPEN';
      }
      
      throw error;
    }
  };
};

export {
  asyncHandler,
  asyncWrapper,
  asyncHandlerWithErrorHandling,
  asyncHandlerWithTimeout,
  asyncHandlerWithRetry,
  createCircuitBreaker
};
