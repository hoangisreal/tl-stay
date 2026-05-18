import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

const requireAuth = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401);
    return next(new Error('Not authenticated'));
  }
  try {
    const decoded = verifyToken(token);
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) {
      res.status(401);
      return next(new Error('User not found'));
    }
    next();
  } catch {
    res.status(401);
    next(new Error('Invalid token'));
  }
};

export default requireAuth;
