import { catchAsync } from '../middleware/error.js';
import { userService } from '../services/user.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get current user's profile
 */
const getMyProfile = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);

  res.status(200).json(ApiResponse.success('Profile retrieved successfully', { user }));
});

/**
 * Update current user's profile
 */
const updateMyProfile = catchAsync(async (req, res) => {
  const updatedUser = await userService.updateUser(req.user.id, req.body);

  res.status(200).json(ApiResponse.updated('Profile updated successfully', { user: updatedUser }));
});

/**
 * Delete current user's account
 */
const deleteMyAccount = catchAsync(async (req, res) => {
  // Verify password before deletion
  const { password } = req.body;
  if (!password) {
    throw ApiError.badRequest('Password is required for account deletion');
  }

  await userService.deleteUser(req.user.id);

  res.status(200).json(ApiResponse.success('Account deleted successfully'));
});

/**
 * Change current user's password
 */
const changeMyPassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('Current password and new password are required');
  }

  await userService.changePassword(req.user.id, currentPassword, newPassword);

  res.status(200).json(ApiResponse.success('Password changed successfully'));
});

/**
 * Get all users (admin only)
 */
const getAllUsers = catchAsync(async (req, res) => {
  const { page, limit, search, sortBy, sortOrder } = req.query;

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    search,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc'
  };

  const result = await userService.getAllUsers(options);

  res.status(200).json(
    ApiResponse.paginated('Users retrieved successfully', result.users, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    })
  );
});

/**
 * Search users (admin only)
 */
const searchUsers = catchAsync(async (req, res) => {
  const { q: searchQuery, page, limit, sortBy, sortOrder } = req.query;

  if (!searchQuery) {
    throw ApiError.badRequest('Search query is required');
  }

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc'
  };

  const result = await userService.searchUsers(searchQuery, options);

  res.status(200).json(
    ApiResponse.paginated('Search results retrieved successfully', result.users, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      searchQuery
    })
  );
});

/**
 * Get user by ID (admin only)
 */
const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await userService.getUserById(id);

  res.status(200).json(ApiResponse.success('User retrieved successfully', { user }));
});

/**
 * Update user (admin only)
 */
const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const updatedUser = await userService.updateUser(id, req.body);

  res.status(200).json(ApiResponse.updated('User updated successfully', { user: updatedUser }));
});

/**
 * Update user status (admin only)
 */
const updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive, isDeleted } = req.body;

  const updatedUser = await userService.updateUserStatus(id, { isActive, isDeleted });

  res.status(200).json(ApiResponse.updated('User status updated successfully', { user: updatedUser }));
});

/**
 * Delete user (admin only)
 */
const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  await userService.deleteUser(id);

  res.status(200).json(ApiResponse.deleted('User deleted successfully'));
});

/**
 * Get user statistics overview (admin only)
 */
const getUserStats = catchAsync(async (req, res) => {
  const stats = await userService.getUserStats();

  res.status(200).json(ApiResponse.success('User statistics retrieved successfully', { stats }));
});

/**
 * Get user statistics by role (admin only)
 */
const getUserStatsByRole = catchAsync(async (req, res) => {
  const stats = await userService.getUserStatsByRole();

  res.status(200).json(ApiResponse.success('User statistics by role retrieved successfully', { stats }));
});

/**
 * Get users by date range (admin only)
 */
const getUsersByDateRange = catchAsync(async (req, res) => {
  const { startDate, endDate, page, limit, sortBy, sortOrder } = req.query;

  if (!startDate || !endDate) {
    throw ApiError.badRequest('Start date and end date are required');
  }

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc'
  };

  const result = await userService.getUsersByDateRange(startDate, endDate, options);

  res.status(200).json(
    ApiResponse.paginated('Users by date range retrieved successfully', result.users, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      startDate,
      endDate
    })
  );
});

/**
 * Get users by role (admin only)
 */
const getUsersByRole = catchAsync(async (req, res) => {
  const { roleId } = req.params;
  const { page, limit, sortBy, sortOrder } = req.query;

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc'
  };

  const result = await userService.getUsersByRole(roleId, options);

  res.status(200).json(
    ApiResponse.paginated('Users by role retrieved successfully', result.users, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      roleId
    })
  );
});

export const userController = {
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
  changeMyPassword,
  getAllUsers,
  searchUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  getUserStats,
  getUserStatsByRole,
  getUsersByDateRange,
  getUsersByRole
};
