import apiClient from './apiClient.ts';
import type { Booking } from './bookingService.ts';

export interface ReviewGuest {
  _id: string;
  name: string;
  avatarUrl: string;
}

export interface Review {
  _id: string;
  listing: string;
  booking: string;
  guest: ReviewGuest;
  rating: number;
  cleanliness?: number;
  accuracy?: number;
  checkInRating?: number;
  communication?: number;
  location?: number;
  value?: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewPayload {
  booking: string;
  rating: number;
  cleanliness?: number;
  accuracy?: number;
  checkInRating?: number;
  communication?: number;
  location?: number;
  value?: number;
  comment: string;
}

export const fetchListingReviews = (listingId: string) =>
  apiClient.get<Review[]>(`/reviews/listing/${listingId}`);

export const createReview = (payload: CreateReviewPayload) =>
  apiClient.post<Review>('/reviews', payload);

export const deleteReview = (id: string) =>
  apiClient.delete(`/reviews/${id}`);

export const fetchPendingReviews = () =>
  apiClient.get<Booking[]>('/reviews/me/pending');
