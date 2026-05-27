import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';

interface AccountMenuProps {
  unreadCount?: number;
}

export default function AccountMenu({ unreadCount = 0 }: AccountMenuProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-1.5 hover:shadow-md transition-shadow"
      >
        <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        {unreadCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-rose-500" aria-label={`${unreadCount} thông báo chưa đọc`} />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <p className="px-4 py-2 text-sm font-semibold text-gray-700 truncate border-b border-gray-100">
            {user?.name}
          </p>
          <Link
            to="/account/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Hồ sơ tài khoản
          </Link>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          {user?.role === 'host' && (
            <>
              <Link
                to="/host/dashboard"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Quản lý phòng
              </Link>
              <Link
                to="/host/bookings"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Đặt phòng từ khách
              </Link>
            </>
          )}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Admin Panel
            </Link>
          )}
          <Link
            to="/messages"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Tin nhắn
          </Link>
          {user?.role === 'guest' && (
            <Link
              to="/my-bookings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Đặt phòng của tôi
            </Link>
          )}
          <Link
            to="/change-password"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Đổi mật khẩu
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
