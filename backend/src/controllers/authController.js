import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { signToken, setTokenCookie, clearTokenCookie } from '../utils/jwt.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['guest', 'host']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { name, email, password, role } = parsed.data;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409);
      return next(new Error('Email already in use'));
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: role || 'guest' });
    const token = signToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      return next(new Error('Invalid credentials'));
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401);
      return next(new Error('Invalid credentials'));
    }
    const token = signToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Logged out' });
};

export const me = (req, res) => {
  const { _id, name, email, role, avatarUrl } = req.user;
  res.json({ _id, name, email, role, avatarUrl });
};
