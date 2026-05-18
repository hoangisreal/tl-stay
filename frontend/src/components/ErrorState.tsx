interface ErrorStateProps {
  message?: string;
}

export default function ErrorState({ message = 'Đã có lỗi xảy ra. Vui lòng thử lại.' }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <span className="text-5xl">⚠️</span>
      <p className="text-sm text-red-500">{message}</p>
    </div>
  );
}
