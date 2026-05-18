interface RatingStarsProps {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

const sizeClasses = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };

export default function RatingStars({ value, onChange, size = 'md', readOnly }: RatingStarsProps) {
  const interactive = !readOnly && onChange;
  return (
    <div className={`inline-flex gap-0.5 ${sizeClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(n)}
          className={`leading-none ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
            n <= value ? 'text-yellow-400' : 'text-gray-300'
          }`}
          aria-label={`${n} sao`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
