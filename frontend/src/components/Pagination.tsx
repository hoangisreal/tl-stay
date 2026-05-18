interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pages, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
      >
        ←
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 rounded-lg text-sm border ${
            p === page
              ? 'bg-rose-500 text-white border-rose-500'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
      >
        →
      </button>
    </div>
  );
}
