const requireRole = (role) => (req, res, next) => {
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(req.user?.role)) {
    res.status(403);
    return next(new Error('Forbidden'));
  }
  next();
};

export default requireRole;
