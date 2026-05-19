import apiClient from './apiClient.ts';
import type { AuthUser } from './authService.ts';
import type { Booking } from './bookingService.ts';
import type { AdminMessage } from './conversationService.ts';
import type { Listing } from './listingService.ts';

export interface AdminStats {
  users: number;
  hosts: number;
  guests: number;
  admins: number;
  listings: number;
  activeListings: number;
  inactiveListings: number;
  bookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  reviews: number;
  conversations: number;
  messages: number;
  revenue: number;
}

export interface AdminUser extends AuthUser {
  createdAt: string;
  updatedAt: string;
}

export interface AdminReview {
  _id: string;
  listing: Pick<Listing, '_id' | 'title' | 'location'>;
  guest: { _id: string; name: string; email: string; avatarUrl: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  pages: number;
  [key: string]: T[] | number;
}

export const fetchAdminStats = () => apiClient.get<AdminStats>('/admin/stats');

export const fetchAdminUsers = (page = 1, limit = 20) =>
  apiClient.get<{ users: AdminUser[] } & PaginatedResponse<AdminUser>>('/admin/users', { params: { page, limit } });

export const updateAdminUserRole = (id: string, role: AdminUser['role']) =>
  apiClient.patch<AdminUser>(`/admin/users/${id}/role`, { role });

export const fetchAdminListings = (page = 1, limit = 20) =>
  apiClient.get<{ listings: Listing[] } & PaginatedResponse<Listing>>('/admin/listings', { params: { page, limit } });

export const updateAdminListingStatus = (id: string, isActive: boolean) =>
  apiClient.patch<Listing>(`/admin/listings/${id}/status`, { isActive });

export const fetchAdminBookings = (page = 1, limit = 20) =>
  apiClient.get<{ bookings: Booking[] } & PaginatedResponse<Booking>>('/admin/bookings', { params: { page, limit } });

export const cancelAdminBooking = (id: string) =>
  apiClient.patch<Booking>(`/admin/bookings/${id}/cancel`);

export const fetchAdminReviews = (page = 1, limit = 20) =>
  apiClient.get<{ reviews: AdminReview[] } & PaginatedResponse<AdminReview>>('/admin/reviews', { params: { page, limit } });

export const deleteAdminReview = (id: string) =>
  apiClient.delete(`/admin/reviews/${id}`);

export const fetchAdminMessages = (page = 1, limit = 20) =>
  apiClient.get<{ messages: AdminMessage[] } & PaginatedResponse<AdminMessage>>('/admin/messages', { params: { page, limit } });
