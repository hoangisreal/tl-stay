const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) {
    res.status(403);
    return next(new Error('Forbidden'));
  }
  next();
};

export default requireRole;
