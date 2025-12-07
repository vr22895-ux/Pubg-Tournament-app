const User = require('../schema/User');
const bcrypt = require('bcryptjs');
const axios = require('axios'); // Added axios for OTP verification
const jwt = require('jsonwebtoken');
/**
 * GET /api/auth/find?phone=XXXXXXXXXX
 * If a user exists with that phone, return it. Used after OTP verify to decide whether to register or login.
 */
exports.findByPhone = async (req, res) => {
  try {
    const digits = String(req.query.phone || '').replace(/\D/g, '');
    if (!digits) return res.status(400).json({ success: false, error: 'phone is required' });

    const user = await User.findOne({ phone: digits, role: 'user' }).lean();

    if (user && user.status !== 'active') {
      let statusMessage = '';
      if (user.status === 'suspended') {
        statusMessage = 'Account suspended. Please contact support.';
      } else if (user.status === 'banned') {
        statusMessage = 'Account banned.';
        if (user.banReason) {
          statusMessage += ` Reason: ${user.banReason}`;
        }
        if (user.banExpiry && user.banExpiry > new Date()) {
          statusMessage += ` Ban expires: ${user.banExpiry.toLocaleDateString()}`;
        } else if (user.banExpiry) {
          statusMessage += ' This is a permanent ban.';
        }
      } else {
        statusMessage = `Account is ${user.status}. Please contact support.`;
      }

      return res.json({
        success: false,
        error: statusMessage,
        status: user.status,
        user: null
      });
    }

    return res.json({ success: true, user: user || null });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'failed' });
  }
};

/**
 * GET /api/auth/find-user?email=user@example.com or ?pubgId=Player123
 * Find user by email or PUBG ID for squad invitations
 */
exports.findByEmailOrPubgId = async (req, res) => {
  try {
    const { email, pubgId } = req.query;

    if (!email && !pubgId) {
      return res.status(400).json({ success: false, error: 'email or pubgId is required' });
    }

    let query = { role: 'user' };
    if (email) {
      query.email = String(email).trim().toLowerCase();
    } else if (pubgId) {
      query.pubgId = String(pubgId).trim();
    }

    const user = await User.findOne(query).lean();

    if (!user) {
      return res.json({ success: false, error: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.json({
        success: false,
        error: `User account is ${user.status}`
      });
    }

    // Remove sensitive fields
    const { password, ...userResponse } = user;

    return res.json({ success: true, data: userResponse });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'failed' });
  }
};

/**
 * GET /api/auth/players?search=searchterm
 * Get all available players for squad invitations with search and pagination
 */
exports.getAvailablePlayers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    let query = {
      role: 'user',
      status: 'active',
      // Only show players who are not in a squad
      $or: [
        { squadId: { $exists: false } },
        { squadId: null }
      ]
    };

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = [
        {
          $or: [
            { name: searchRegex },
            { pubgId: searchRegex },
            { email: searchRegex }
          ]
        }
      ];
    }

    // Get players with pagination
    const players = await User.find(query)
      .select('name pubgId email')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: players,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'failed' });
  }
};

/**
 * POST /api/auth/register
 * body: { phone, pubgId, email, password }
 * Creates (or updates) a user after OTP verification is done on the client.
 * Returns the user object.
 */
exports.register = async (req, res) => {
  try {
    const { phone, pubgId, email, password, name } = req.body || {};
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return res.status(400).json({ success: false, error: 'phone is required' });
    if (!pubgId) return res.status(400).json({ success: false, error: 'pubgId is required' });
    if (!email) return res.status(400).json({ success: false, error: 'email is required' });
    if (!password) return res.status(400).json({ success: false, error: 'password is required' });
    if (!name) return res.status(400).json({ success: false, error: 'name is required' });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    const update = {
      phone: digits,
      pubgId: String(pubgId).trim(),
      email: String(email).trim().toLowerCase(),
      password: hashedPassword,
      name: String(name).trim(),
      role: 'user',
      lastLoginAt: new Date(),
      status: 'active',
    };

    const user = await User.findOneAndUpdate(
      { email: String(email).trim().toLowerCase(), role: 'user' },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    // Remove password from response
    const { password: _, ...userResponse } = user;

    return res.json({ success: true, user: userResponse });
  } catch (e) {
    // Handle other errors
    const code = e?.code === 11000 ? 409 : 500;
    const msg = e?.code === 11000 ? 'Duplicate key (email already used)' : (e.message || 'failed');
    return res.status(code).json({ success: false, error: msg });
  }
};

/**
 * POST /api/auth/login
 * body: { email, password }
 * User login with email and password.
 * Returns the user object.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email) return res.status(400).json({ success: false, error: 'email is required' });
    if (!password) return res.status(400).json({ success: false, error: 'password is required' });

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
      role: 'user'
    }).lean();

    if (!user) return res.status(404).json({ success: false, error: 'User not found. Please register.' });

    // Check user status - prevent login for suspended or banned users
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account suspended. Please contact support for assistance.',
        status: 'suspended'
      });
    }

    if (user.status === 'banned') {
      let banMessage = 'Account banned.';
      if (user.banReason) {
        banMessage += ` Reason: ${user.banReason}`;
      }
      if (user.banExpiry && user.banExpiry > new Date()) {
        banMessage += ` Ban expires: ${user.banExpiry.toLocaleDateString()}`;
      } else if (user.banExpiry) {
        banMessage += ' This is a permanent ban.';
      }

      return res.status(403).json({
        success: false,
        error: banMessage,
        status: 'banned',
        banReason: user.banReason,
        banExpiry: user.banExpiry
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `Account is ${user.status}. Please contact support.`,
        status: user.status
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, {
      $set: { lastLoginAt: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password: _, ...userResponse } = user;

    // Return token + user
    return res.json({ success: true, token, user: userResponse });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'failed' });
  }
};

/**
 * POST /api/auth/admin/login
 * body: { email, password }
 * Admin login with email and password.
 * Returns the admin user object.
 */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email) return res.status(400).json({ success: false, error: 'Admin email is required' });
    if (!password) return res.status(400).json({ success: false, error: 'Admin password is required' });

    const admin = await User.findOne({
      adminEmail: String(email).trim().toLowerCase(),
      role: 'admin'
    }).lean();

    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }

    if (admin.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Admin account suspended. Please contact system administrator.',
        status: 'suspended'
      });
    }

    if (admin.status === 'banned') {
      let banMessage = 'Admin account banned.';
      if (admin.banReason) {
        banMessage += ` Reason: ${admin.banReason}`;
      }
      if (admin.banExpiry && admin.banExpiry > new Date()) {
        banMessage += ` Ban expires: ${admin.banExpiry.toLocaleDateString()}`;
      } else if (admin.banExpiry) {
        banMessage += ' This is a permanent ban.';
      }

      return res.status(403).json({
        success: false,
        error: banMessage,
        status: 'banned',
        banReason: admin.banReason,
        banExpiry: admin.banExpiry
      });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `Admin account is ${admin.status}. Please contact system administrator.`,
        status: admin.status
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.adminPassword);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }

    // Update last login
    await User.findByIdAndUpdate(admin._id, {
      $set: { lastLoginAt: new Date() }
    });

    // Remove password from response
    const { adminPassword, ...adminUser } = admin;

    // Generate JWT token for admin
    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({ success: true, token, user: adminUser });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'failed' });
  }
};

/**
 * POST /api/auth/admin/create
 * body: { email, password, name }
 * Creates a new admin user (protected endpoint - should be called only once during setup)
 * Returns the admin user object.
 */
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email) return res.status(400).json({ success: false, error: 'Admin email is required' });
    if (!password) return res.status(400).json({ success: false, error: 'Admin password is required' });
    if (!name) return res.status(400).json({ success: false, error: 'Admin name is required' });

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(409).json({ success: false, error: 'Admin user already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      adminEmail: String(email).trim().toLowerCase(),
      adminPassword: hashedPassword,
      name: String(name).trim(),
      role: 'admin',
      status: 'active',
      lastLoginAt: new Date(),
    });

    // Remove password from response
    const { adminPassword, ...adminUser } = admin.toObject();

    return res.json({ success: true, user: adminUser });
  } catch (e) {
    const code = e?.code === 11000 ? 409 : 500;
    const msg = e?.code === 11000 ? 'Admin email already exists' : (e.message || 'failed');
    return res.status(code).json({ success: false, error: msg });
  }
};

/**
 * GET /api/auth/check-login-eligibility/:userId
 * Checks if a user can login based on their current status
 * Returns eligibility status and details
 */
exports.checkLoginEligibility = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const user = await User.findById(userId).select('-password -adminPassword').lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const canLogin = user.status === 'active';
    let message = '';
    let details = {};

    if (user.status === 'suspended') {
      message = 'Account suspended. Please contact support for assistance.';
      details = { status: 'suspended', reason: user.adminNotes || 'No reason provided' };
    } else if (user.status === 'banned') {
      message = 'Account banned.';
      if (user.banReason) {
        message += ` Reason: ${user.banReason}`;
      }
      if (user.banExpiry && user.banExpiry > new Date()) {
        message += ` Ban expires: ${user.banExpiry.toLocaleDateString()}`;
      } else if (user.banExpiry) {
        message += ' This is a permanent ban.';
      }
      details = {
        status: 'banned',
        reason: user.banReason,
        expiry: user.banExpiry,
        adminNotes: user.adminNotes
      };
    } else if (user.status === 'active') {
      message = 'Account is active and can login.';
      details = { status: 'active' };
    } else {
      message = `Account is ${user.status}. Please contact support.`;
      details = { status: user.status };
    }

    return res.json({
      success: true,
      canLogin,
      message,
      details,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed to check login eligibility' });
  }
};

/**
 * PUT /api/auth/profile/update
 * body: { userId, name, email, pubgId }
 * Updates user profile information (name, email, pubgId)
 * Returns the updated user object.
 */
exports.updateProfile = async (req, res) => {
  try {
    const { userId, name, email, pubgId } = req.body || {};

    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email: String(email).trim().toLowerCase(),
      _id: { $ne: userId },
      role: 'user'
    });

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email is already taken by another user' });
    }

    const updateFields = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      updatedAt: new Date()
    };

    if (pubgId) {
      updateFields.pubgId = String(pubgId).trim();
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Remove password from response
    const { password, adminPassword, ...userResponse } = updatedUser;

    // Propagate changes to Squads and Matches
    const Squad = require('../schema/Squad');
    const Match = require('../schema/matchSchema');

    // 1. Update Squad Members details
    await Squad.updateMany(
      { "members.userId": userId },
      {
        $set: {
          "members.$[elem].pubgId": updateFields.pubgId || updatedUser.pubgId,
          "members.$[elem].name": updateFields.name
        }
      },
      { arrayFilters: [{ "elem.userId": userId }] }
    );

    // 2. Update Upcoming Matches registrations
    // We only update upcoming matches to preserve history of completed ones
    await Match.updateMany(
      {
        "registeredPlayers.userId": userId,
        status: "upcoming"
      },
      {
        $set: {
          "registeredPlayers.$[elem].pubgId": updateFields.pubgId || updatedUser.pubgId,
          "registeredPlayers.$[elem].userName": updateFields.name
        }
      },
      { arrayFilters: [{ "elem.userId": userId }] }
    );

    return res.json({ success: true, user: userResponse });
  } catch (e) {
    console.error("Profile update error:", e);
    return res.status(500).json({ success: false, error: e.message || 'Failed to update profile' });
  }
};

/**
 * POST /api/auth/profile/verify-phone
 * body: { userId, phone, verificationId, otp }
 * Verifies and updates user's phone number
 * Returns the updated user object.
 */
exports.verifyPhoneNumber = async (req, res) => {
  try {
    const { userId, phone, verificationId, otp } = req.body || {};

    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });
    if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });
    if (!verificationId) return res.status(400).json({ success: false, error: 'Verification ID is required' });
    if (!otp) return res.status(400).json({ success: false, error: 'OTP is required' });

    // Verify OTP first
    try {
      const otpResponse = await axios.get(`${process.env.OTP_API_URL || 'http://localhost:5050'}/api/otp/verify`, {
        params: { verificationId, code: otp.replace(/\D/g, "") },
      });

      if (!otpResponse.data?.success) {
        return res.status(400).json({ success: false, error: 'Invalid OTP' });
      }
    } catch (otpError) {
      return res.status(400).json({ success: false, error: 'OTP verification failed' });
    }

    // Update phone number
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          phone: String(phone).replace(/\D/g, ''),
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Remove password from response
    const { password, adminPassword, ...userResponse } = updatedUser;

    return res.json({ success: true, user: userResponse, message: 'Phone number verified successfully' });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed to verify phone number' });
  }
};
