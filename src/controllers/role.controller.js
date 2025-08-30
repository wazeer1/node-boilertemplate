import { catchAsync } from '../middleware/error.js';
import { roleService } from '../services/role.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get all roles
 */
const getAllRoles = catchAsync(async (req, res) => {
  const { page, limit, search, sortBy, sortOrder } = req.query;

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    search,
    sortBy: sortBy || 'name',
    sortOrder: sortOrder || 'asc'
  };

  const result = await roleService.getAllRoles(options);

  res.status(200).json(
    ApiResponse.paginated('Roles retrieved successfully', result.roles, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    })
  );
});

/**
 * Search roles
 */
const searchRoles = catchAsync(async (req, res) => {
  const { q: searchQuery, page, limit, sortBy, sortOrder } = req.query;

  if (!searchQuery) {
    throw ApiError.badRequest('Search query is required');
  }

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    sortBy: sortBy || 'name',
    sortOrder: sortOrder || 'asc'
  };

  const result = await roleService.searchRoles(searchQuery, options);

  res.status(200).json(
    ApiResponse.paginated('Search results retrieved successfully', result.roles, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      searchQuery
    })
  );
});

/**
 * Get role by ID
 */
const getRoleById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const role = await roleService.getRoleById(id);

  res.status(200).json(ApiResponse.success('Role retrieved successfully', { role }));
});

/**
 * Create new role
 */
const createRole = catchAsync(async (req, res) => {
  const roleData = req.body;

  const newRole = await roleService.createRole(roleData);

  res.status(201).json(ApiResponse.created('Role created successfully', { role: newRole }));
});

/**
 * Update role
 */
const updateRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedRole = await roleService.updateRole(id, updateData);

  res.status(200).json(ApiResponse.updated('Role updated successfully', { role: updatedRole }));
});

/**
 * Delete role
 */
const deleteRole = catchAsync(async (req, res) => {
  const { id } = req.params;

  await roleService.deleteRole(id);

  res.status(200).json(ApiResponse.deleted('Role deleted successfully'));
});

/**
 * Update role permissions
 */
const updateRolePermissions = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!permissions || !Array.isArray(permissions)) {
    throw ApiError.badRequest('Permissions array is required');
  }

  const updatedRole = await roleService.updateRolePermissions(id, permissions);

  res.status(200).json(ApiResponse.updated('Role permissions updated successfully', { role: updatedRole }));
});

/**
 * Add permissions to role
 */
const addRolePermissions = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!permissions || !Array.isArray(permissions)) {
    throw ApiError.badRequest('Permissions array is required');
  }

  const updatedRole = await roleService.addRolePermissions(id, permissions);

  res.status(200).json(ApiResponse.updated('Permissions added to role successfully', { role: updatedRole }));
});

/**
 * Remove permissions from role
 */
const removeRolePermissions = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!permissions || !Array.isArray(permissions)) {
    throw ApiError.badRequest('Permissions array is required');
  }

  const updatedRole = await roleService.removeRolePermissions(id, permissions);

  res.status(200).json(ApiResponse.updated('Permissions removed from role successfully', { role: updatedRole }));
});

/**
 * Get role statistics overview
 */
const getRoleStats = catchAsync(async (req, res) => {
  const stats = await roleService.getRoleStats();

  res.status(200).json(ApiResponse.success('Role statistics retrieved successfully', { stats }));
});

/**
 * Get role statistics by permission
 */
const getRoleStatsByPermission = catchAsync(async (req, res) => {
  const stats = await roleService.getRoleStatsByPermission();

  res.status(200).json(ApiResponse.success('Role statistics by permission retrieved successfully', { stats }));
});

/**
 * Assign role to user
 */
const assignRole = catchAsync(async (req, res) => {
  const { id: roleId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    throw ApiError.badRequest('User ID is required');
  }

  await roleService.assignRole(roleId, userId);

  res.status(200).json(ApiResponse.success('Role assigned successfully'));
});

/**
 * Unassign role from user
 */
const unassignRole = catchAsync(async (req, res) => {
  const { id: roleId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    throw ApiError.badRequest('User ID is required');
  }

  await roleService.unassignRole(roleId, userId);

  res.status(200).json(ApiResponse.success('Role unassigned successfully'));
});

export const roleController = {
  getAllRoles,
  searchRoles,
  getRoleById,
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
