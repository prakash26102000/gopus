// src/middlewares/authMiddleware.js
const { verifyToken } = require('../utils/jwtUtils');
const { user, role } = require('../models');

/**
 * Middleware to check if user is authenticated
 */
exports.isAuthenticated = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    // Prioritize Authorization header if present
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // Fallback to cookie if no Authorization header
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } 
    // If neither is present, no token provided
    else {
      return res.status(401).json({ message: 'No token provided' });
    }

    if (!token) {
      // This case should ideally be caught by the else block above, but as a safeguard:
      return res.status(401).json({ message: 'No token found after checks' });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      // Clear cookie if token is invalid and came from cookie
      if (req.cookies && req.cookies.token === token) {
        res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
      }
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Find the user
    const userRecord = await user.findByPk(decoded.id, {
      include: [{ model: role }]
    });
    
    if (!userRecord || !userRecord.isactive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    
    // Add user info to request object
    req.user = {
      id: userRecord.id,
      email: userRecord.email,
      roleid: userRecord.roleid,
      role: userRecord.role.name
    };
    
    console.log('[authMiddleware] Authentication successful, req.user:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // It might be good to clear a potentially problematic cookie here too
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
    }
    return res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

/**
 * Non-blocking authentication: tries to authenticate, but never 401s.
 * - If a valid token is present (header or cookie), sets req.user and continues.
 * - If token is missing/invalid/expired, proceeds without user info.
 */
exports.tryAuthenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(); // unauthenticated, continue
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      // clear bad cookie but do not block
      if (req.cookies && req.cookies.token === token) {
        res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
      }
      return next();
    }

    const userRecord = await user.findByPk(decoded.id, { include: [{ model: role }] });
    if (!userRecord || !userRecord.isactive) {
      return next();
    }

    req.user = {
      id: userRecord.id,
      email: userRecord.email,
      roleid: userRecord.roleid,
      role: userRecord.role?.name
    };
    return next();
  } catch (error) {
    // Never block; just proceed unauthenticated
    return next();
  }
};

/**
 * Middleware to check if user is an admin
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin role required' });
  }
  next();
};

/**
 * Middleware to check if user is a customer
 */
exports.isCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Access denied: Customer role required' });
  }
  next();
};