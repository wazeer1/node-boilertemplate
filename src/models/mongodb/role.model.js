import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Role name must be at least 2 characters long'],
    maxlength: [50, 'Role name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  permissions: [{
    type: String,
    enum: [
      // User permissions
      'user:read',
      'user:create',
      'user:update',
      'user:delete',
      'user:list',
      
      // Role permissions
      'role:read',
      'role:create',
      'role:update',
      'role:delete',
      'role:list',
      
      // Auth permissions
      'auth:login',
      'auth:register',
      'auth:refresh',
      'auth:logout',
      
      // Profile permissions
      'profile:read',
      'profile:update',
      'profile:delete',
      
      // Admin permissions
      'admin:all',
      'admin:users',
      'admin:roles',
      'admin:system',
      
      // Content permissions
      'content:read',
      'content:create',
      'content:update',
      'content:delete',
      'content:publish',
      
      // File permissions
      'file:upload',
      'file:download',
      'file:delete',
      'file:list'
    ]
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for permission count
roleSchema.virtual('permissionCount').get(function() {
  return this.permissions ? this.permissions.length : 0;
});

// Virtual for is admin role
roleSchema.virtual('isAdmin').get(function() {
  return this.permissions && this.permissions.includes('admin:all');
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isDeleted: 1 });
roleSchema.index({ isDefault: 1 });
roleSchema.index({ createdAt: -1 });

// Pre-save middleware to ensure unique names
roleSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

// Pre-save middleware to prevent deletion of system roles
roleSchema.pre('save', function(next) {
  if (this.isModified('isDeleted') && this.isDeleted && this.isSystem) {
    return next(new Error('Cannot delete system roles'));
  }
  next();
});

// Pre-save middleware to prevent modification of system roles
roleSchema.pre('save', function(next) {
  if (this.isSystem && this.isModified() && !this.isNew) {
    // Allow only certain fields to be modified for system roles
    const allowedModifications = ['description', 'isActive', 'updatedAt'];
    const modifiedFields = Object.keys(this.modifiedPaths());
    
    const hasUnauthorizedModifications = modifiedFields.some(
      field => !allowedModifications.includes(field)
    );
    
    if (hasUnauthorizedModifications) {
      return next(new Error('Cannot modify system role properties'));
    }
  }
  next();
});

// Instance method to check if user has permission
roleSchema.methods.hasPermission = function(permission) {
  if (!this.permissions || !this.isActive || this.isDeleted) {
    return false;
  }
  
  // Admin roles have all permissions
  if (this.permissions.includes('admin:all')) {
    return true;
  }
  
  return this.permissions.includes(permission);
};

// Instance method to check if user has any of the permissions
roleSchema.methods.hasAnyPermission = function(permissions) {
  if (!this.permissions || !this.isActive || this.isDeleted) {
    return false;
  }
  
  // Admin roles have all permissions
  if (this.permissions.includes('admin:all')) {
    return true;
  }
  
  return permissions.some(permission => this.permissions.includes(permission));
};

// Instance method to check if user has all permissions
roleSchema.methods.hasAllPermissions = function(permissions) {
  if (!this.permissions || !this.isActive || this.isDeleted) {
    return false;
  }
  
  // Admin roles have all permissions
  if (this.permissions.includes('admin:all')) {
    return true;
  }
  
  return permissions.every(permission => this.permissions.includes(permission));
};

// Instance method to add permission
roleSchema.methods.addPermission = function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this;
};

// Instance method to remove permission
roleSchema.methods.removePermission = function(permission) {
  if (this.isSystem) {
    throw new Error('Cannot modify permissions of system roles');
  }
  
  this.permissions = this.permissions.filter(p => p !== permission);
  return this;
};

// Static method to find by name
roleSchema.statics.findByName = function(name) {
  return this.findOne({ name: name.toLowerCase(), isDeleted: false });
};

// Static method to find default roles
roleSchema.statics.findDefaults = function() {
  return this.find({ isDefault: true, isDeleted: false });
};

// Static method to find system roles
roleSchema.statics.findSystem = function() {
  return this.find({ isSystem: true, isDeleted: false });
};

// Static method to find active roles
roleSchema.statics.findActive = function() {
  return this.find({ isActive: true, isDeleted: false });
};

// Static method to find roles by permissions
roleSchema.statics.findByPermissions = function(permissions) {
  return this.find({
    permissions: { $in: permissions },
    isActive: true,
    isDeleted: false
  });
};

// Export the model
const Role = mongoose.model('Role', roleSchema);

export default Role;
