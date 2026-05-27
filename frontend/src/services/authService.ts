import apiClient from './apiClient.ts';

export type UserRole =
  | 'guest'
  | 'host'
  | 'admin'
  | 'customer_support'
  | 'content_moderator'
  | 'finance_manager'
  | 'operations_manager';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl: string;
  favoriteListings?: string[];
  verified: {
    email: boolean;
    phone: boolean;
    id: boolean;
  };
  preferences: {
    language: 'vi' | 'en';
    currency: 'VND' | 'USD';
  };
  permissions: string[];
}

export const registerRequest = (data: {
  name: string;
  email: string;
  password: string;
  role: 'guest' | 'host';
}) => apiClient.post<AuthUser>('/auth/register', data);

export const loginRequest = (data: { email: string; password: string }) =>
  apiClient.post<AuthUser>('/auth/login', data);

export const logoutRequest = () => apiClient.post('/auth/logout');

export const getMeRequest = () => apiClient.get<AuthUser>('/auth/me');

export const updateProfileRequest = (data: {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  preferences?: Partial<AuthUser['preferences']>;
}) => apiClient.patch<AuthUser>('/auth/me/profile', data);

export const updateVerificationRequest = (data: Partial<AuthUser['verified']>) =>
  apiClient.patch<AuthUser>('/auth/me/verification', data);

export const forgotPasswordRequest = (data: { email: string }) =>
  apiClient.post<{ message: string; resetLink?: string }>('/auth/forgot-password', data);

export const resetPasswordRequest = (data: { token: string; password: string }) =>
  apiClient.post<{ message: string }>('/auth/reset-password', data);

export const changePasswordRequest = (data: { currentPassword: string; newPassword: string }) =>
  apiClient.patch<{ message: string }>('/auth/change-password', data);
