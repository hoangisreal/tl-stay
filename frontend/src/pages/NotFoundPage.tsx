import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-xl text-gray-600">Trang không tìm thấy</p>
      <Link to="/" className="text-rose-500 hover:underline font-medium">
        Về trang chủ
      </Link>
    </div>
  );
}
