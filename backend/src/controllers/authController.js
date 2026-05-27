import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { signToken, setTokenCookie, clearTokenCookie } from '../utils/jwt.js';
import { getPermissionsForRole } from '../config/permissions.js';

const PASSWORD_RESET_MESSAGE = 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được tạo.';
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30;

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

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(6),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(30).optional(),
    avatarUrl: z.string().trim().url().or(z.literal('')).optional(),
    preferences: z
      .object({
        language: z.enum(['vi', 'en']).optional(),
        currency: z.enum(['VND', 'USD']).optional(),
      })
      .optional(),
  })
  .passthrough();

const selfVerificationSchema = z
  .object({
    email: z.literal(true).optional(),
    phone: z.literal(true).optional(),
    id: z.literal(true).optional(),
  })
  .strict()
  .refine((data) => data.email || data.phone || data.id, {
    message: 'At least one verification flag must be true',
  });

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const firstClientOrigin = () =>
  (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)[0] || 'http://localhost:5173';

const shouldExposeResetLink = () => ['development', 'test'].includes(process.env.NODE_ENV || 'development');

const authPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  avatarUrl: user.avatarUrl || '',
  favoriteListings: user.favoriteListings || [],
  verified: user.verified || { email: false, phone: false, id: false },
  preferences: user.preferences || { language: 'vi', currency: 'VND' },
  permissions: getPermissionsForRole(user.role),
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
    res.status(201).json(authPayload(user));
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
    res.json(authPayload(user));
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Logged out' });
};

export const me = (req, res) => {
  res.json(authPayload(req.user));
};

export const updateProfile = async (req, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const { name, phone, avatarUrl, preferences } = parsed.data;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (preferences?.language !== undefined) user.preferences.language = preferences.language;
    if (preferences?.currency !== undefined) user.preferences.currency = preferences.currency;

    await user.save();
    res.json(authPayload(user));
  } catch (err) {
    next(err);
  }
};

export const updateSelfVerification = async (req, res, next) => {
  try {
    const parsed = selfVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (parsed.data.email) user.verified.email = true;
    if (parsed.data.phone) user.verified.phone = true;
    if (parsed.data.id) user.verified.id = true;

    await user.save();
    res.json(authPayload(user));
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }

    const response = { message: PASSWORD_RESET_MESSAGE };
    const user = await User.findOne({ email: parsed.data.email });
    if (!user) return res.json(response);

    await PasswordResetToken.updateMany({ user: user._id, usedAt: null }, { usedAt: new Date() });
    const token = crypto.randomBytes(32).toString('hex');
    await PasswordResetToken.create({
      user: user._id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    if (shouldExposeResetLink()) {
      response.resetLink = `${firstClientOrigin()}/reset-password/${token}`;
    }
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }

    const resetToken = await PasswordResetToken.findOne({
      tokenHash: hashResetToken(parsed.data.token),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!resetToken) {
      res.status(400);
      return next(new Error('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'));
    }

    const user = await User.findById(resetToken.user);
    if (!user) {
      res.status(400);
      return next(new Error('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'));
    }

    user.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    resetToken.usedAt = new Date();
    await Promise.all([user.save(), resetToken.save()]);
    res.json({ message: 'Mật khẩu đã được cập nhật' });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    const match = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!match) {
      res.status(400);
      return next(new Error('Mật khẩu hiện tại không đúng'));
    }

    user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await user.save();
    res.json({ message: 'Mật khẩu đã được cập nhật' });
  } catch (err) {
    next(err);
  }
};
