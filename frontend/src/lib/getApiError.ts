import axios from 'axios';

/**
 * Extract a user-friendly error message from an Axios error or unknown value.
 */
export const getApiError = (err: unknown, fallback = 'Có lỗi xảy ra'): string => {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string })?.message || fallback;
  }
  return fallback;
};
