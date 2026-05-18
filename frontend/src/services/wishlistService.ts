import apiClient from './apiClient.ts';
import type { Listing } from './listingService.ts';

export const fetchWishlist = () =>
  apiClient.get<Listing[]>('/wishlist');

export const toggleFavorite = (listingId: string) =>
  apiClient.post<{ favorited: boolean; count: number }>(`/wishlist/${listingId}/toggle`);
