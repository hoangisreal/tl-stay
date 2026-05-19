import apiClient from './apiClient.ts';
import type { AuthUser } from './authService.ts';
import type { Listing } from './listingService.ts';

export interface Message {
  _id: string;
  conversation: string;
  sender: Pick<AuthUser, '_id' | 'name' | 'avatarUrl'>;
  body: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  listing: Pick<Listing, '_id' | 'title' | 'images' | 'location' | 'pricePerNight' | 'isActive'>;
  host: Pick<AuthUser, '_id' | 'name' | 'email' | 'avatarUrl'>;
  guest: Pick<AuthUser, '_id' | 'name' | 'email' | 'avatarUrl'>;
  lastMessageAt: string;
  lastMessage?: Message | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMessage extends Omit<Message, 'conversation'> {
  conversation: {
    _id: string;
    listing: Pick<Listing, '_id' | 'title' | 'location'>;
    host: Pick<AuthUser, '_id' | 'name' | 'email' | 'avatarUrl'>;
    guest: Pick<AuthUser, '_id' | 'name' | 'email' | 'avatarUrl'>;
  };
  sender: Pick<AuthUser, '_id' | 'name' | 'email' | 'avatarUrl'>;
}

export const fetchConversations = () =>
  apiClient.get<Conversation[]>('/conversations');

export const createConversation = (data: { listing: string; guest?: string }) =>
  apiClient.post<Conversation>('/conversations', data);

export const fetchConversationMessages = (id: string, params: { limit?: number; after?: string } = {}) =>
  apiClient.get<Message[]>(`/conversations/${id}/messages`, { params });

export const sendConversationMessage = (id: string, body: string) =>
  apiClient.post<Message>(`/conversations/${id}/messages`, { body });

export const markConversationRead = (id: string) =>
  apiClient.patch<{ read: number }>(`/conversations/${id}/read`);
