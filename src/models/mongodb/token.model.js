import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['refresh', 'reset', 'verification'],
    default: 'refresh'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceId: String
  }
}, {
  timestamps: true
});

// Indexes
tokenSchema.index({ userId: 1 });
tokenSchema.index({ token: 1 });
tokenSchema.index({ type: 1 });
tokenSchema.index({ expiresAt: 1 });
tokenSchema.index({ isRevoked: 1 });
tokenSchema.index({ createdAt: -1 });

// TTL index to automatically delete expired tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to set default expiration for refresh tokens
tokenSchema.pre('save', function(next) {
  if (this.type === 'refresh' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  next();
});

// Instance method to check if token is expired
tokenSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Instance method to revoke token
tokenSchema.methods.revoke = function() {
  this.isRevoked = true;
  return this.save();
};

// Static method to find valid token
tokenSchema.statics.findValidToken = function(token, type = 'refresh') {
  return this.findOne({
    token,
    type,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to find all tokens for user
tokenSchema.statics.findByUserId = function(userId, type = 'refresh') {
  return this.find({
    userId,
    type,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to revoke all tokens for user
tokenSchema.statics.revokeAllForUser = function(userId, type = 'refresh') {
  return this.updateMany(
    { userId, type },
    { isRevoked: true }
  );
};

// Static method to clean expired tokens
tokenSchema.statics.cleanExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Static method to get token statistics
tokenSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        activeCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$isRevoked', false] }, { $gt: ['$expiresAt', new Date()] }] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

// Export the model
const Token = mongoose.model('Token', tokenSchema);

export default Token;
