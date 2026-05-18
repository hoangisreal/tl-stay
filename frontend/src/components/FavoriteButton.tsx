import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.ts';
import { toggleFavorite } from '../services/wishlistService.ts';

interface FavoriteButtonProps {
  listingId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function FavoriteButton({ listingId, size = 'md', className = '' }: FavoriteButtonProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setFavorites = useAuthStore((s) => s.setFavorites);
  const [busy, setBusy] = useState(false);

  const favorited = !!user?.favoriteListings?.includes(listingId);
  const dim = size === 'sm' ? 'w-7 h-7 text-base' : 'w-9 h-9 text-xl';

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      const { data } = await toggleFavorite(listingId);
      const current = user.favoriteListings || [];
      const next = data.favorited
        ? [...new Set([...current, listingId])]
        : current.filter((id) => id !== listingId);
      setFavorites(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={favorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      className={`flex items-center justify-center rounded-full bg-white/85 backdrop-blur hover:bg-white transition-colors disabled:opacity-60 ${dim} ${className}`}
    >
      <span className={favorited ? 'text-rose-500' : 'text-gray-500'}>
        {favorited ? '♥' : '♡'}
      </span>
    </button>
  );
}
