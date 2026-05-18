import { Link } from 'react-router-dom';

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <span className="text-5xl">⚠️</span>
      <h1 className="text-2xl font-bold text-gray-700">Đã có lỗi xảy ra</h1>
      <p className="text-gray-500 text-sm">Vui lòng thử lại sau.</p>
      <Link to="/" className="text-rose-500 hover:underline font-medium">
        Về trang chủ
      </Link>
    </div>
  );
}
