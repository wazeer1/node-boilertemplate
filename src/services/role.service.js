import { Role, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get role by ID
 */
const getRoleById = async (roleId) => {
  try {
    const role = await Role.findById(roleId);
    if (!role) {
      throw ApiError.notFound('Role not found');
    }
    return role;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to get role');
  }
};

/**
 * Get all roles with pagination and search
 */
const getAllRoles = async (options = {}) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = options;
    
    let query = { isDeleted: false };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const roles = await Role.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Role.countDocuments(query);
    
    return {
      roles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw ApiError.internalError('Failed to get roles');
  }
};

/**
 * Search roles
 */
const searchRoles = async (searchQuery, options = {}) => {
  try {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = options;
    
    const query = {
      isDeleted: false,
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ]
    };
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const roles = await Role.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Role.countDocuments(query);
    
    return {
      roles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw ApiError.internalError('Failed to search roles');
  }
};

/**
 * Create new role
 */
const createRole = async (roleData) => {
  try {
    // Check if role with same name already exists
    const existingRole = await Role.findOne({ 
      name: roleData.name, 
      isDeleted: false 
    });
    
    if (existingRole) {
      throw ApiError.badRequest('Role with this name already exists');
    }
    
    const role = new Role(roleData);
    await role.save();
    
    return role;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to create role');
  }
};

/**
 * Update role
 */
const updateRole = async (roleId, updateData) => {
  try {
    const role = await Role.findById(roleId);
    if (!role) {
      throw ApiError.notFound('Role not found');
    }
    
    // Prevent updating system roles
    if (role.isSystem) {
      throw ApiError.badRequest('Cannot update system roles');
    }
    
    // Check if name is being changed and if it conflicts with existing role
    if (updateData.name && updateData.name !== role.name) {
      const existingRole = await Role.findOne({ 
        name: updateData.name, 
        isDeleted: false,
        _id: { $ne: roleId }
      });
      
      if (existingRole) {
        throw ApiError.badRequest('Role with this name already exists');
      }
    }
    
    // Update role fields
    Object.keys(updateData).forEach(key => {
      if (role[key] !== undefined) {
        role[key] = updateData[key];
      }
    });
    
    await role.save();
    return role;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to update role');
  }
};

/**
 * Delete role (soft delete)
 */
const deleteRole = async (roleId) => {
  try {
    const role = await Role.findById(roleId);
    if (!role) {
      throw ApiError.notFound('Role not found');
    }
    
    // Prevent deleting system roles
    if (role.isSystem) {
      throw ApiError.badRequest('Cannot delete system roles');
    }
    
    // Check if role is assigned to any users
    const usersWithRole = await User.countDocuments({ 
      role: roleId, 
      isDeleted: false 
    });
    
    if (usersWithRole > 0) {
      throw ApiError.badRequest('Cannot delete role that is assigned to users');
    }
    
    // Soft delete role
    role.isDeleted = true;
    role.isActive = false;
    await role.save();
    
    return { message: 'Role deleted successfully' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to delete role');
  }
};

/**
 * Update role permissions
 */
const updateRolePermissions = async (roleId, permissions) => {
  try {
    const role = await Role.findById(roleId);
    if (!role) {
      throw ApiError.notFound('Role not found');
    }
    
    // Prevent updating system roles
    if (role.isSystem) {
      throw ApiError.badRequest('Cannot update system roles');
    }
    
    role.permissions = permissions;
    await role.save();
    
    return role;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to update role permissions');
  }
};

/**
 * Add permissions to role
 */
const addRolePermissions = async (roleId, permissions) => {
  try {
    const role = await Role.findById(roleId);
    if (!role) {
      throw ApiError.notFound('Role not found');
    }
    
    // Prevent updating system roles
    if (role.isSystem) {
      throw ApiError.badRequest('Cannot update system roles');
    }
    
    // Add new permissions (avoid duplicates)
    permissions.forEach(permission => {
      if (!role.permissions.includes(permission)) {
        role.permissions.push(permission);
      }
    });
    
    await role.save();
    return role;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to add role permissions');
  }
};

/**
 * Remove permissions from role
 */
const removeRolePermissions = async (roleId, permissions) => {
  try {
    const role = await Role.findById(roleId);
    if (!role) {
      throw ApiError.notFound('Role not found');
    }
    
    // Prevent updating system roles
    if (role.isSystem) {
      throw ApiError.badRequest('Cannot update system roles');
    }
    
    // Remove specified permissions
    role.permissions = role.permissions.filter(
      permission => !permissions.includes(permission)
    );
    
    await role.save();
    return role;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to remove role permissions');
  }
};

/**
 * Get role statistics
 */
const getRoleStats = async () => {
  try {
    const stats = await Role.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: null,
          totalRoles: { $sum: 1 },
          activeRoles: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          systemRoles: {
            $sum: { $cond: ['$isSystem', 1, 0] }
          },
          defaultRoles: {
            $sum: { $cond: ['$isDefault', 1, 0] }
          }
        }
      }
    ]);
    
    return stats[0] || {
      totalRoles: 0,
      activeRoles: 0,
      systemRoles: 0,
      defaultRoles: 0
    };
  } catch (error) {
    throw ApiError.internalError('Failed to get role statistics');
  }
};

/**
 * Get role statistics by permission
 */
const getRoleStatsByPermission = async () => {
  try {
    const stats = await Role.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $unwind: '$permissions'
      },
      {
        $group: {
          _id: '$permissions',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    return stats;
  } catch (error) {
    throw ApiError.internalError('Failed to get role statistics by permission');
  }
};

/**
 * Assign role to user
 */
const assignRole = async (roleId, userId) => {
  try {
    // Check if role exists
    const role = await Role.findById(roleId);
    if (!role) {
      throw ApiError.notFound('Role not found');
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    // Update user's role
    user.role = roleId;
    await user.save();
    
    return { message: 'Role assigned successfully' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to assign role');
  }
};

/**
 * Unassign role from user
 */
const unassignRole = async (roleId, userId) => {
  try {
    // Check if user exists and has this role
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    if (user.role.toString() !== roleId) {
      throw ApiError.badRequest('User does not have this role');
    }
    
    // Get default role
    const defaultRole = await Role.findOne({ isDefault: true, isActive: true });
    if (!defaultRole) {
      throw ApiError.internalError('No default role found');
    }
    
    // Assign default role
    user.role = defaultRole._id;
    await user.save();
    
    return { message: 'Role unassigned successfully' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.internalError('Failed to unassign role');
  }
};

export const roleService = {
  getRoleById,
  getAllRoles,
  searchRoles,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
  addRolePermissions,
  removeRolePermissions,
  getRoleStats,
  getRoleStatsByPermission,
  assignRole,
  unassignRole
};
