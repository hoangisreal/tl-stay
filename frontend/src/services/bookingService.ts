import apiClient from './apiClient.ts';
import type { Listing } from './listingService.ts';

export interface PriceBreakdown {
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  tax: number;
  totalPrice: number;
}

export interface Booking extends PriceBreakdown {
  _id: string;
  listing: Pick<Listing, '_id' | 'title' | 'images' | 'location' | 'pricePerNight'>;
  guest: { _id: string; name: string; email: string };
  checkIn: string;
  checkOut: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export const createBooking = (data: {
  listing: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}) => apiClient.post<Booking>('/bookings', data);

export const fetchPriceQuote = (params: {
  listing: string;
  checkIn: string;
  checkOut: string;
}) => apiClient.get<PriceBreakdown>('/bookings/quote', { params });

export const fetchMyBookings = () =>
  apiClient.get<Booking[]>('/bookings/me');

export const fetchHostBookings = () =>
  apiClient.get<Booking[]>('/bookings/host');

export const cancelBooking = (id: string) =>
  apiClient.patch<Booking>(`/bookings/${id}/cancel`);

export const fetchBookingById = (id: string) =>
  apiClient.get<Booking>(`/bookings/${id}`);
