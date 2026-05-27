import apiClient from './apiClient.ts';
import type { Booking } from './bookingService.ts';
import type { Listing } from './listingService.ts';

export type NotificationType =
  | 'booking_created'
  | 'booking_paid'
  | 'booking_cancelled'
  | 'booking_refunded'
  | 'booking_failed';

export interface Notification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  body: string;
  booking?: Pick<Booking, '_id' | 'checkIn' | 'checkOut' | 'guests' | 'status' | 'totalPrice'>;
  listing?: Pick<Listing, '_id' | 'title' | 'images' | 'location' | 'pricePerNight'>;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  page: number;
  limit: number;
  total: number;
  pages: number;
  unreadCount: number;
}

export const fetchNotifications = (page = 1, limit = 10) =>
  apiClient.get<NotificationsResponse>('/notifications', { params: { page, limit } });

export const fetchUnreadNotificationCount = () =>
  apiClient.get<{ count: number }>('/notifications/unread-count');

export const markNotificationRead = (id: string) =>
  apiClient.patch<Notification>(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  apiClient.patch<{ message: string; count: number }>('/notifications/read-all');
