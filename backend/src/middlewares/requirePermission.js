import { hasPermission } from '../config/permissions.js';

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    next();
  };
};

export default requirePermission;
