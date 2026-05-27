import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';
import AccountMenu from './AccountMenu.tsx';
import { fetchUnreadNotificationCount } from '../services/notificationService.ts';

export default function Navbar() {
  const { user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    const loadUnread = () => {
      fetchUnreadNotificationCount()
        .then((res) => {
          if (!cancelled) setUnreadCount(res.data.count);
        })
        .catch(() => {
          if (!cancelled) setUnreadCount(0);
        });
    };
    loadUnread();
    const id = window.setInterval(loadUnread, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [user?._id]);

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
                  <>
                    <Link to="/admin" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                      Admin
                    </Link>
                    <Link to="/activity-logs" className="hidden sm:inline text-sm font-medium text-gray-700 hover:text-gray-900">
                      Nhật ký
                    </Link>
                  </>
                )}
                {['customer_support', 'content_moderator', 'finance_manager', 'operations_manager'].includes(user.role) && (
                  <Link to="/staff" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                    Nhân viên
                  </Link>
                )}
                {['admin', 'finance_manager', 'operations_manager'].includes(user.role) && (
                  <Link to="/analytics" className="hidden sm:inline text-sm font-medium text-gray-700 hover:text-gray-900">
                    Phân tích
                  </Link>
                )}
                <Link to="/messages" className="hidden sm:inline text-sm font-medium text-gray-700 hover:text-gray-900">
                  Tin nhắn
                </Link>
                <Link to="/notifications" className="relative hidden sm:inline text-sm font-medium text-gray-700 hover:text-gray-900">
                  Thông báo
                  {unreadCount > 0 && (
                    <span className="absolute -right-3 -top-2 min-w-5 h-5 rounded-full bg-rose-500 px-1 text-[11px] leading-5 text-white text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <AccountMenu unreadCount={unreadCount} />
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
