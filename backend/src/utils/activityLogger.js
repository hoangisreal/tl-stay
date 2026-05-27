import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (userId, action, resource, resourceId = null, details = {}, req = null) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const logMiddleware = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        logActivity(req.user._id, action, resource, req.params.id || data?._id, { method: req.method, path: req.path }, req);
      }
      return originalJson(data);
    };
    next();
  };
};
