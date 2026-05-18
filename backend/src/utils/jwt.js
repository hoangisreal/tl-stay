import jwt from 'jsonwebtoken';

export const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

export const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookie = (res) => {
  res.cookie('token', '', { httpOnly: true, maxAge: 0 });
};
