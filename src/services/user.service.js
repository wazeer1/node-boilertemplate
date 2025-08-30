import { User, Role } from '../models/index.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get user by ID
 */
const getUserById = async userId => {
  try {
    const user = await User.findById(userId).populate('role');
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
      .populate('role')
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
      .populate('role')
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
 * Update user
 */
const updateUser = async (userId, updateData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Prevent updating system users
    if (user.isSystem) {
      throw ApiError.badRequest('Cannot update system users');
    }

    // Check if email is being changed and if it conflicts with existing user
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        isDeleted: false,
        _id: { $ne: userId }
      });

      if (existingUser) {
        throw ApiError.badRequest('User with this email already exists');
      }
    }

    // Update user fields
    Object.keys(updateData).forEach(key => {
      if (user[key] !== undefined && key !== 'password') {
        user[key] = updateData[key];
      }
    });

    await user.save();
    return user.populate('role');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to update user');
  }
};

/**
 * Update user status
 */
const updateUserStatus = async (userId, statusData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Prevent updating system users
    if (user.isSystem) {
      throw ApiError.badRequest('Cannot update system users');
    }

    // Update status fields
    if (statusData.isActive !== undefined) {
      user.isActive = statusData.isActive;
    }

    if (statusData.isDeleted !== undefined) {
      user.isDeleted = statusData.isDeleted;
    }

    if (statusData.isSuspended !== undefined) {
      user.isSuspended = statusData.isSuspended;
    }

    if (statusData.suspensionReason !== undefined) {
      user.suspensionReason = statusData.suspensionReason;
    }

    if (statusData.suspendedUntil !== undefined) {
      user.suspendedUntil = statusData.suspendedUntil;
    }

    await user.save();
    return user.populate('role');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to update user status');
  }
};

/**
 * Delete user (soft delete)
 */
const deleteUser = async userId => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Prevent deleting system users
    if (user.isSystem) {
      throw ApiError.badRequest('Cannot delete system users');
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
 * Change user password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to change password');
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
          suspendedUsers: {
            $sum: { $cond: ['$isSuspended', 1, 0] }
          }
        }
      }
    ]);

    return (
      stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        suspendedUsers: 0
      }
    );
  } catch (error) {
    throw ApiError.internalError('Failed to get user statistics');
  }
};

/**
 * Get user statistics by role
 */
const getUserStatsByRole = async () => {
  try {
    const stats = await User.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'roleInfo'
        }
      },
      {
        $unwind: '$roleInfo'
      },
      {
        $group: {
          _id: '$roleInfo.name',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return stats;
  } catch (error) {
    throw ApiError.internalError('Failed to get user statistics by role');
  }
};

/**
 * Get users by date range
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
      .populate('role')
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

/**
 * Get users by role
 */
const getUsersByRole = async (roleId, options = {}) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const query = {
      role: roleId,
      isDeleted: false
    };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const users = await User.find(query)
      .populate('role')
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

export const userService = {
  getUserById,
  getAllUsers,
  searchUsers,
  updateUser,
  updateUserStatus,
  deleteUser,
  changePassword,
  getUserStats,
  getUserStatsByRole,
  getUsersByDateRange,
  getUsersByRole
};
