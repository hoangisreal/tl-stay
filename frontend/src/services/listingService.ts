import apiClient from './apiClient.ts';

export interface ListingLocation {
  country: string;
  city: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface ListingHost {
  _id: string;
  name: string;
  avatarUrl: string;
}

export type ListingCategory =
  | 'beach' | 'mountain' | 'city' | 'cabin' | 'countryside'
  | 'lakeside' | 'tropical' | 'pool' | 'design';

export interface Listing {
  _id: string;
  host: ListingHost;
  title: string;
  description: string;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  location: ListingLocation;
  amenities: string[];
  images: string[];
  category: ListingCategory;
  avgRating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ListingsResponse {
  listings: Listing[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ListingFilters {
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  guests?: string;
  category?: string;
  checkIn?: string;
  checkOut?: string;
  page?: string;
  limit?: string;
}

export const fetchListings = (filters: ListingFilters = {}) =>
  apiClient.get<ListingsResponse>('/listings', { params: filters });

export const fetchListingById = (id: string) =>
  apiClient.get<Listing>(`/listings/${id}`);

export const fetchMyListings = () =>
  apiClient.get<Listing[]>('/listings/host/me');

export const createListing = (formData: FormData) =>
  apiClient.post<Listing>('/listings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateListing = (id: string, formData: FormData) =>
  apiClient.put<Listing>(`/listings/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteListing = (id: string) =>
  apiClient.delete(`/listings/${id}`);

export const fetchAvailability = (id: string) =>
  apiClient.get<{ checkIn: string; checkOut: string }[]>(`/listings/${id}/availability`);
