/**
 * Create pagination object
 */
const createPagination = (page = 1, limit = 10, total) => {
  const currentPage = parseInt(page);
  const itemsPerPage = parseInt(limit);
  const totalItems = parseInt(total);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  const nextPage = hasNextPage ? currentPage + 1 : null;
  const prevPage = hasPrevPage ? currentPage - 1 : null;
  
  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    startIndex: (currentPage - 1) * itemsPerPage,
    endIndex: Math.min(currentPage * itemsPerPage, totalItems)
  };
};

/**
 * Validate pagination parameters
 */
const validatePagination = (page, limit, maxLimit = 100) => {
  const errors = [];
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    errors.push('Page must be a positive integer');
  }
  
  if (isNaN(limitNum) || limitNum < 1) {
    errors.push('Limit must be a positive integer');
  }
  
  if (limitNum > maxLimit) {
    errors.push(`Limit cannot exceed ${maxLimit}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    page: pageNum || 1,
    limit: limitNum || 10
  };
};

/**
 * Create pagination response
 */
const createPaginatedResponse = (data, pagination, message = 'Data retrieved successfully') => {
  return {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      total: pagination.totalItems,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.hasNextPage,
      hasPrevPage: pagination.hasPrevPage,
      nextPage: pagination.nextPage,
      prevPage: pagination.prevPage
    }
  };
};

/**
 * Apply pagination to database query
 */
const applyPagination = (query, page = 1, limit = 10) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return query.skip(skip).limit(parseInt(limit));
};

/**
 * Get pagination metadata from query result
 */
const getPaginationMetadata = (query, page = 1, limit = 10) => {
  const currentPage = parseInt(page);
  const itemsPerPage = parseInt(limit);
  
  return {
    currentPage,
    itemsPerPage,
    startIndex: (currentPage - 1) * itemsPerPage,
    endIndex: currentPage * itemsPerPage
  };
};

/**
 * Create pagination links for API responses
 */
const createPaginationLinks = (baseUrl, pagination, queryParams = {}) => {
  const { currentPage, totalPages, hasNextPage, hasPrevPage, nextPage, prevPage } = pagination;
  
  const links = {
    self: `${baseUrl}?page=${currentPage}&limit=${pagination.itemsPerPage}`,
    first: `${baseUrl}?page=1&limit=${pagination.itemsPerPage}`,
    last: `${baseUrl}?page=${totalPages}&limit=${pagination.itemsPerPage}`,
    next: hasNextPage ? `${baseUrl}?page=${nextPage}&limit=${pagination.itemsPerPage}` : null,
    prev: hasPrevPage ? `${baseUrl}?page=${prevPage}&limit=${pagination.itemsPerPage}` : null
  };
  
  // Add query parameters to links
  const queryString = Object.keys(queryParams)
    .filter(key => key !== 'page' && key !== 'limit')
    .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join('&');
  
  if (queryString) {
    Object.keys(links).forEach(key => {
      if (links[key]) {
        links[key] += `&${queryString}`;
      }
    });
  }
  
  return links;
};

/**
 * Calculate offset for database queries
 */
const calculateOffset = (page, limit) => {
  return (parseInt(page) - 1) * parseInt(limit);
};

/**
 * Check if page exists
 */
const isValidPage = (page, totalPages) => {
  const pageNum = parseInt(page);
  return pageNum >= 1 && pageNum <= totalPages;
};

export {
  createPagination,
  validatePagination,
  createPaginatedResponse,
  applyPagination,
  getPaginationMetadata,
  createPaginationLinks,
  calculateOffset,
  isValidPage
};
