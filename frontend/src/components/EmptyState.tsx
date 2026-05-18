interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title = 'Không tìm thấy kết quả',
  description = 'Thử thay đổi bộ lọc hoặc tìm kiếm khác.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <span className="text-5xl">🏠</span>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
