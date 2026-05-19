import apiClient from './apiClient.ts';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'guest' | 'host' | 'admin';
  avatarUrl: string;
  favoriteListings?: string[];
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

export const forgotPasswordRequest = (data: { email: string }) =>
  apiClient.post<{ message: string; resetLink?: string }>('/auth/forgot-password', data);

export const resetPasswordRequest = (data: { token: string; password: string }) =>
  apiClient.post<{ message: string }>('/auth/reset-password', data);

export const changePasswordRequest = (data: { currentPassword: string; newPassword: string }) =>
  apiClient.patch<{ message: string }>('/auth/change-password', data);
