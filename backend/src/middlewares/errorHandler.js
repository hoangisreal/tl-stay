const errorHandler = (err, req, res, _next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${req.method} ${req.originalUrl}] ${err.message}`);
    if (statusCode >= 500) console.error(err.stack);
  }
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    code: err.code || null,
  });
};

export default errorHandler;
