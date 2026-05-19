import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';
import AccountMenu from './AccountMenu.tsx';

export default function Navbar() {
  const { user, loading } = useAuth();

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="text-rose-500 font-bold text-xl tracking-tight">
          TL-Stay
        </Link>
        <div className="flex items-center gap-4">
          {!loading && (
            user ? (
              <>
                {user.role === 'guest' && (
                  <Link to="/wishlist" className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1">
                    <span aria-hidden="true">♥</span>
                    <span className="hidden sm:inline">Yêu thích</span>
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                    Admin
                  </Link>
                )}
                <Link to="/messages" className="hidden sm:inline text-sm font-medium text-gray-700 hover:text-gray-900">
                  Tin nhắn
                </Link>
                <AccountMenu />
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-rose-500 text-white px-4 py-2 rounded-full hover:bg-rose-600 transition-colors"
                >
                  Đăng ký
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
