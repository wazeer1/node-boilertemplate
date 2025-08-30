import authService from '../services/auth.service.js';
import userService from '../services/user.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { catchAsync } from '../middleware/error.js';

/**
 * User registration
 */
const register = catchAsync(async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;
  
  const result = await authService.register({
    email,
    password,
    firstName,
    lastName,
    phone
  });
  
  ApiResponse.created(result, 'User registered successfully').send(res);
});

/**
 * User login
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  const result = await authService.login(email, password);
  
  // Set cookies if using cookie-based auth
  if (req.cookies) {
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }
  
  ApiResponse.success(result, 'Login successful').send(res);
});

/**
 * Refresh access token
 */
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  
  const result = await authService.refreshToken(refreshToken);
  
  // Update cookies
  if (req.cookies) {
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
  }
  
  ApiResponse.success(result, 'Token refreshed successfully').send(res);
});

/**
 * User logout
 */
const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  
  await authService.logout(refreshToken);
  
  // Clear cookies
  if (req.cookies) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }
  
  ApiResponse.success(null, 'Logout successful').send(res);
});

/**
 * Logout from all devices
 */
const logoutAll = catchAsync(async (req, res) => {
  await authService.logoutAll(req.user.id);
  
  // Clear cookies
  if (req.cookies) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }
  
  ApiResponse.success(null, 'Logged out from all devices').send(res);
});

/**
 * Get user profile
 */
const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  
  ApiResponse.success(user, 'Profile retrieved successfully').send(res);
});

/**
 * Update user profile
 */
const updateProfile = catchAsync(async (req, res) => {
  const { firstName, lastName, phone, preferences } = req.body;
  
  const result = await userService.updateUser(req.user.id, {
    firstName,
    lastName,
    phone,
    preferences
  });
  
  ApiResponse.updated(result, 'Profile updated successfully').send(res);
});

/**
 * Change password
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  
  ApiResponse.success(null, 'Password changed successfully').send(res);
});

/**
 * Forgot password
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  
  await authService.forgotPassword(email);
  
  ApiResponse.success(null, 'Password reset email sent').send(res);
});

/**
 * Reset password
 */
const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  
  await authService.resetPassword(token, newPassword);
  
  ApiResponse.success(null, 'Password reset successfully').send(res);
});

/**
 * Verify email
 */
const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.body;
  
  await authService.verifyEmail(token);
  
  ApiResponse.success(null, 'Email verified successfully').send(res);
});

/**
 * Resend verification email
 */
const resendVerification = catchAsync(async (req, res) => {
  const { email } = req.body;
  
  await authService.resendVerification(email);
  
  ApiResponse.success(null, 'Verification email sent').send(res);
});

/**
 * Delete account
 */
const deleteAccount = catchAsync(async (req, res) => {
  const { password } = req.body;
  
  await authService.deleteAccount(req.user.id, password);
  
  // Clear cookies
  if (req.cookies) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }
  
  ApiResponse.success(null, 'Account deleted successfully').send(res);
});

/**
 * Get all users (admin only)
 */
const getAllUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search, sortBy, sortOrder } = req.query;
  
  const result = await userService.getAllUsers({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sortBy,
    sortOrder
  });
  
  ApiResponse.paginated(
    result.users,
    parseInt(page),
    parseInt(limit),
    result.total,
    'Users retrieved successfully'
  ).send(res);
});

/**
 * Get user by ID (admin only)
 */
const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const user = await userService.getUserById(id);
  
  ApiResponse.success(user, 'User retrieved successfully').send(res);
});

/**
 * Update user status (admin only)
 */
const updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive, isDeleted } = req.body;
  
  const result = await userService.updateUserStatus(id, { isActive, isDeleted });
  
  ApiResponse.updated(result, 'User status updated successfully').send(res);
});

export default {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  deleteAccount,
  getAllUsers,
  getUserById,
  updateUserStatus
};
