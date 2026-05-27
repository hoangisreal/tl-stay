import apiClient from './apiClient.ts';

export interface OverviewStats {
  totalBookings: number;
  totalRevenue: number;
  totalListings: number;
  totalUsers: number;
}

export interface RevenueData {
  _id: { year: number; month: number };
  revenue: number;
  count: number;
}

export interface BookingStatusData {
  _id: string;
  count: number;
}

export interface HostAnalytics {
  listings: number;
  bookings: number;
  revenue: number;
  avgRating: number;
}

export const fetchAnalyticsOverview = () => apiClient.get<OverviewStats>('/analytics/overview');

export const fetchAnalyticsRevenue = (months = 6) =>
  apiClient.get<RevenueData[]>('/analytics/revenue', { params: { months } });

export const fetchBookingsByStatus = () =>
  apiClient.get<BookingStatusData[]>('/analytics/bookings-by-status');

export const fetchHostAnalytics = () =>
  apiClient.get<HostAnalytics>('/analytics/host');
