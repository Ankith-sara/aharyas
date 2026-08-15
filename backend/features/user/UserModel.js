import mongoose from 'mongoose';

const sanitizeString = (val) => typeof val === 'string' ? val.trim().replace(/<[^>]*>/g, '') : val; // eslint-disable-line sonarjs/slow-regex -- simple tag stripping, no backtracking risk on bounded input

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      set: sanitizeString
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); // eslint-disable-line sonarjs/slow-regex -- bounded email format checks
        },
        message: 'Please enter a valid email address'
      }
    },
    googleId: {
      type: String,
      default: null,
      sparse: true
    },
    password: {
      type: String,
      required: false,
      minlength: [6, 'Password must be at least 6 characters']
    },
    tempPassword: {
      type: String,
      select: false
    },
    image: {
      type: String,
      default: "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
    },
    addresses: [
      {
        label: { type: String, trim: true, set: sanitizeString },
        address: { type: String, trim: true, set: sanitizeString },
        city: { type: String, trim: true, set: sanitizeString },
        state: { type: String, trim: true, set: sanitizeString },
        zip: { type: String, trim: true, set: sanitizeString },
        country: { type: String, trim: true, set: sanitizeString },
        phone: { type: String, trim: true, set: sanitizeString },
        isDefault: { type: Boolean, default: false }
      }
    ],
    wishlist: {
      type: [String],
      default: []
    },
    cartData: {
      type: Map,
      of: Map,
      default: new Map()
    },
    role: {
      type: String,
      default: 'user',
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be either user or admin'
      }
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String,
      select: false
    },
    otpExpiry: {
      type: Date,
      select: false
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    },
    refreshToken: {
      type: String,
      select: false
    },
    lastLogin: {
      type: Date,
      default: null
    },
    loginHistory: {
      type: [Date],
      default: []
    }
  },
  {
    timestamps: true,
    minimize: false,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpiry;
        delete ret.refreshToken;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
userSchema.index({ lockUntil: 1 }, { sparse: true, expireAfterSeconds: 0 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ loginHistory: 1 });

// Virtual for cart item count
userSchema.virtual('cartItemCount').get(function () {
  if (!this.cartData) return 0;
  let count = 0;
  for (const [, sizes] of this.cartData.entries()) {
    for (const [, quantity] of sizes.entries()) {
      count += quantity;
    }
  }
  return count;
});

// Check if account is locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.hasAdminAccess = function () {
  return this.role === 'admin';
};

userSchema.methods.addToCart = function (itemId, size, quantity = 1) {
  const itemIdStr = String(itemId);
  const sizeStr = String(size);
  if (!this.cartData) this.cartData = new Map();
  if (!this.cartData.has(itemIdStr)) this.cartData.set(itemIdStr, new Map());
  const currentQty = this.cartData.get(itemIdStr).get(sizeStr) || 0;
  this.cartData.get(itemIdStr).set(sizeStr, currentQty + quantity);
  this.markModified('cartData');
  return this.cartData;
};

userSchema.methods.updateCartItem = function (itemId, size, quantity) {
  const itemIdStr = String(itemId);
  const sizeStr = String(size);
  if (!this.cartData) this.cartData = new Map();
  if (quantity === 0) {
    if (this.cartData.has(itemIdStr)) {
      this.cartData.get(itemIdStr).delete(sizeStr);
      if (this.cartData.get(itemIdStr).size === 0) this.cartData.delete(itemIdStr);
    }
  } else {
    if (!this.cartData.has(itemIdStr)) this.cartData.set(itemIdStr, new Map());
    this.cartData.get(itemIdStr).set(sizeStr, quantity);
  }
  this.markModified('cartData');
  return this.cartData;
};

userSchema.methods.clearCart = function () {
  this.cartData = new Map();
  this.markModified('cartData');
  return this.cartData;
};

// Increment login attempts and lock if needed
userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 };
  }
  return await this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $unset: { lockUntil: 1 },
    $set: { loginAttempts: 0 }
  });
};

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;
