import apiClient from './apiClient.ts';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'guest' | 'host';
  avatarUrl: string;
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
