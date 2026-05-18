import type { Review } from '../services/reviewService.ts';
import RatingStars from './RatingStars.tsx';
import { resolveImageUrl } from '../lib/images.ts';

interface ReviewListProps {
  reviews: Review[];
  avgRating: number;
  reviewCount: number;
}

export default function ReviewList({ reviews, avgRating, reviewCount }: ReviewListProps) {
  if (reviewCount === 0) {
    return (
      <p className="text-sm text-gray-500">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-gray-900">★ {avgRating.toFixed(1)}</span>
        <span className="text-gray-500 text-sm">· {reviewCount} đánh giá</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {reviews.map((r) => (
          <div key={r._id} className="border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              {r.guest.avatarUrl ? (
                <img
                  src={resolveImageUrl(r.guest.avatarUrl)}
                  alt={r.guest.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-bold">
                  {r.guest.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">{r.guest.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
            <RatingStars value={r.rating} size="sm" readOnly />
            <p className="text-sm text-gray-700 mt-2 leading-relaxed whitespace-pre-line">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
