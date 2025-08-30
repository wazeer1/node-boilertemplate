import { User, Role } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId)
      .select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires')
      .populate('role', 'name permissions');
    
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    return user;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to get user');
  }
};

/**
 * Get all users with pagination and search
 */
const getAllUsers = async (options = {}) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    let query = { isDeleted: false };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires')
      .populate('role', 'name permissions')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw ApiError.internalError('Failed to get users');
  }
};

/**
 * Update user
 */
const updateUser = async (userId, updateData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    // Update user fields
    Object.keys(updateData).forEach(key => {
      if (user[key] !== undefined) {
        user[key] = updateData[key];
      }
    });
    
    await user.save();
    
    // Return updated user without sensitive data
    const updatedUser = user.toObject();
    delete updatedUser.password;
    delete updatedUser.emailVerificationToken;
    delete updatedUser.emailVerificationExpires;
    delete updatedUser.passwordResetToken;
    delete updatedUser.passwordResetExpires;
    
    return updatedUser;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to update user');
  }
};

/**
 * Update user status (admin only)
 */
const updateUserStatus = async (userId, statusData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    // Update status fields
    if (statusData.isActive !== undefined) {
      user.isActive = statusData.isActive;
    }
    
    if (statusData.isDeleted !== undefined) {
      user.isDeleted = statusData.isDeleted;
    }
    
    await user.save();
    
    // Return updated user without sensitive data
    const updatedUser = user.toObject();
    delete updatedUser.password;
    delete updatedUser.emailVerificationToken;
    delete updatedUser.emailVerificationExpires;
    delete updatedUser.passwordResetToken;
    delete updatedUser.passwordResetExpires;
    
    return updatedUser;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to update user status');
  }
};

/**
 * Delete user (soft delete)
 */
const deleteUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    // Soft delete user
    user.isDeleted = true;
    user.isActive = false;
    await user.save();
    
    return { message: 'User deleted successfully' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to delete user');
  }
};

/**
 * Get users by role
 */
const getUsersByRole = async (roleId, options = {}) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const query = { role: roleId, isDeleted: false };
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires')
      .populate('role', 'name permissions')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw ApiError.internalError('Failed to get users by role');
  }
};

/**
 * Search users
 */
const searchUsers = async (searchQuery, options = {}) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const query = {
      isDeleted: false,
      $or: [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    };
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires')
      .populate('role', 'name permissions')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw ApiError.internalError('Failed to search users');
  }
};

/**
 * Get user statistics
 */
const getUserStats = async () => {
  try {
    const stats = await User.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          verifiedUsers: {
            $sum: { $cond: ['$isEmailVerified', 1, 0] }
          },
          unverifiedUsers: {
            $sum: { $cond: ['$isEmailVerified', 0, 1] }
          }
        }
      }
    ]);
    
    return stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      verifiedUsers: 0,
      unverifiedUsers: 0
    };
  } catch (error) {
    throw ApiError.internalError('Failed to get user statistics');
  }
};

/**
 * Get users by creation date range
 */
const getUsersByDateRange = async (startDate, endDate, options = {}) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const query = {
      isDeleted: false,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires')
      .populate('role', 'name permissions')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw ApiError.internalError('Failed to get users by date range');
  }
};

export default {
  getUserById,
  getAllUsers,
  updateUser,
  updateUserStatus,
  deleteUser,
  getUsersByRole,
  searchUsers,
  getUserStats,
  getUsersByDateRange
};
