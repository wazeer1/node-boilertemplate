import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, Role } from '../models/index.js';
import { generateAccessToken, generateRefreshToken } from '../config/jwt.js';
import ApiError from '../utils/ApiError.js';
import emailService from './email.service.js';
import tokenService from './token.service.js';

/**
 * User registration service
 */
const register = async (userData) => {
  const { email, password, firstName, lastName, phone } = userData;
  
  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }
  
  // Get default role
  const defaultRole = await Role.findOne({ isDefault: true, isActive: true });
  if (!defaultRole) {
    throw ApiError.internalError('Default role not found');
  }
  
  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  // Create user
  const user = new User({
    email,
    password,
    firstName,
    lastName,
    phone,
    role: defaultRole._id,
    emailVerificationToken,
    emailVerificationExpires
  });
  
  await user.save();
  
  // Send verification email
  await emailService.sendVerificationEmail(user.email, emailVerificationToken);
  
  // Return user without sensitive data
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.emailVerificationToken;
  delete userResponse.emailVerificationExpires;
  
  return userResponse;
};

/**
 * User login service
 */
const login = async (email, password) => {
  // Find user and include password for comparison
  const user = await User.findByEmail(email).select('+password');
  if (!user) {
    throw ApiError.invalidCredentials('Invalid email or password');
  }
  
  // Check if account is locked
  if (user.isLocked()) {
    throw ApiError.unauthorized('Account is temporarily locked. Please try again later.');
  }
  
  // Check if account is active
  if (!user.isActive || user.isDeleted) {
    throw ApiError.unauthorized('Account is deactivated or deleted');
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    // Increment login attempts
    await user.incLoginAttempts();
    throw ApiError.invalidCredentials('Invalid email or password');
  }
  
  // Reset login attempts on successful login
  await user.resetLoginAttempts();
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  // Get user role with permissions
  const role = await Role.findById(user.role);
  
  // Generate tokens
  const accessToken = generateAccessToken({
    id: user._id,
    email: user.email,
    role: role.name,
    permissions: role.permissions
  });
  
  const refreshToken = generateRefreshToken({
    id: user._id,
    email: user.email,
    role: role.name
  });
  
  // Store refresh token
  await tokenService.storeRefreshToken(user._id, refreshToken);
  
  // Return user data and tokens
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.emailVerificationToken;
  delete userResponse.emailVerificationExpires;
  delete userResponse.passwordResetToken;
  delete userResponse.passwordResetExpires;
  
  return {
    user: userResponse,
    accessToken,
    refreshToken,
    role: role.name,
    permissions: role.permissions
  };
};

/**
 * Refresh access token service
 */
const refreshToken = async (refreshToken) => {
  // Verify refresh token
  const decoded = await tokenService.verifyRefreshToken(refreshToken);
  
  // Check if token exists in database
  const tokenExists = await tokenService.checkRefreshToken(refreshToken);
  if (!tokenExists) {
    throw ApiError.unauthorized('Invalid refresh token');
  }
  
  // Get user
  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive || user.isDeleted) {
    throw ApiError.unauthorized('User not found or inactive');
  }
  
  // Get user role
  const role = await Role.findById(user.role);
  
  // Generate new access token
  const newAccessToken = generateAccessToken({
    id: user._id,
    email: user.email,
    role: role.name,
    permissions: role.permissions
  });
  
  return {
    accessToken: newAccessToken,
    user: user.toObject(),
    role: role.name,
    permissions: role.permissions
  };
};

/**
 * Logout service
 */
const logout = async (refreshToken) => {
  // Remove refresh token from database
  await tokenService.removeRefreshToken(refreshToken);
  
  return { message: 'Logged out successfully' };
};

/**
 * Logout from all devices service
 */
const logoutAll = async (userId) => {
  // Remove all refresh tokens for user
  await tokenService.removeAllRefreshTokens(userId);
  
  return { message: 'Logged out from all devices' };
};

/**
 * Change password service
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw ApiError.invalidCredentials('Current password is incorrect');
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  // Logout from all devices (invalidate all tokens)
  await tokenService.removeAllRefreshTokens(userId);
  
  return { message: 'Password changed successfully' };
};

/**
 * Forgot password service
 */
const forgotPassword = async (email) => {
  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if user exists or not
    return { message: 'If an account with that email exists, a password reset email has been sent' };
  }
  
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
  
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = resetExpires;
  await user.save();
  
  // Send reset email
  await emailService.sendPasswordResetEmail(user.email, resetToken);
  
  return { message: 'Password reset email sent' };
};

/**
 * Reset password service
 */
const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }
  
  // Update password and clear reset token
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  // Logout from all devices
  await tokenService.removeAllRefreshTokens(user._id);
  
  return { message: 'Password reset successfully' };
};

/**
 * Verify email service
 */
const verifyEmail = async (token) => {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }
  
  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  
  return { message: 'Email verified successfully' };
};

/**
 * Resend verification email service
 */
const resendVerification = async (email) => {
  const user = await User.findByEmail(email);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  if (user.isEmailVerified) {
    throw ApiError.badRequest('Email is already verified');
  }
  
  // Generate new verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpires = emailVerificationExpires;
  await user.save();
  
  // Send verification email
  await emailService.sendVerificationEmail(user.email, emailVerificationToken);
  
  return { message: 'Verification email sent' };
};

/**
 * Delete account service
 */
const deleteAccount = async (userId, password) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.invalidCredentials('Password is incorrect');
  }
  
  // Soft delete user
  user.isDeleted = true;
  user.isActive = false;
  await user.save();
  
  // Remove all refresh tokens
  await tokenService.removeAllRefreshTokens(userId);
  
  return { message: 'Account deleted successfully' };
};

export default {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  deleteAccount
};
