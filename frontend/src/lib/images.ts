const PLACEHOLDER = 'https://placehold.co/600x400?text=No+Image';

const apiOrigin = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

export const resolveImageUrl = (image?: string | null): string => {
  if (!image) return PLACEHOLDER;
  if (/^https?:\/\//i.test(image)) return image;
  return `${apiOrigin()}${image.startsWith('/') ? '' : '/'}${image}`;
};

export const resolveFirstImage = (images?: string[] | null): string =>
  resolveImageUrl(images && images.length ? images[0] : null);
