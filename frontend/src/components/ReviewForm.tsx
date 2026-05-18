import { useState } from 'react';
import RatingStars from './RatingStars.tsx';

interface ReviewFormProps {
  onSubmit: (data: { rating: number; comment: string }) => Promise<void>;
  onCancel?: () => void;
}

export default function ReviewForm({ onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 5) {
      setError('Nhận xét phải có ít nhất 5 ký tự');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await onSubmit({ rating, comment: comment.trim() });
      setComment('');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || 'Gửi đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Đánh giá của bạn</p>
        <RatingStars value={rating} onChange={setRating} size="lg" />
      </div>
      <div>
        <label htmlFor="comment" className="text-sm font-medium text-gray-700 block mb-1">
          Nhận xét
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400 resize-none"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Huỷ
          </button>
        )}
      </div>
    </form>
  );
}
