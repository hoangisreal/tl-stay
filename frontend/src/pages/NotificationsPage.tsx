import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge.tsx';
import Pagination from '../components/Pagination.tsx';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from '../services/notificationService.ts';

const formatDate = (value: string) => new Date(value).toLocaleString('vi-VN');

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const { data } = await fetchNotifications(nextPage, 10);
      setNotifications(data.notifications);
      setPage(data.page);
      setPages(data.pages || 1);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (notification: Notification) => {
    if (notification.readAt) return;
    setBusy(notification._id);
    try {
      const { data } = await markNotificationRead(notification._id);
      setNotifications((prev) => prev.map((item) => (item._id === data._id ? data : item)));
      setUnreadCount((count) => Math.max(0, count - 1));
    } finally {
      setBusy('');
    }
  };

  const markAllRead = async () => {
    setBusy('all');
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setUnreadCount(0);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-sm text-gray-500 mt-1">{unreadCount.toLocaleString('vi-VN')} chưa đọc</p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0 || busy === 'all'}
          className="w-full sm:w-auto border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {busy === 'all' ? 'Đang cập nhật...' : 'Đánh dấu tất cả đã đọc'}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-sm text-gray-500 py-16">Đang tải...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-16 border border-dashed border-gray-300 rounded-lg">
          Không có thông báo
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 sm:p-5 ${notification.readAt ? 'bg-white' : 'bg-rose-50/50'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{notification.title}</h2>
                    {!notification.readAt && (
                      <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-1 rounded-full">Mới</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatDate(notification.createdAt)}</p>
                  {notification.booking && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500">
                      <Badge status={notification.booking.status} />
                      <span>{notification.booking.guests} khách</span>
                      <span>{notification.booking.totalPrice.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {notification.listing && (
                    <Link
                      to={`/listings/${notification.listing._id}`}
                      className="inline-block mt-3 text-sm font-medium text-rose-600 hover:underline"
                    >
                      {notification.listing.title}
                    </Link>
                  )}
                </div>
                {!notification.readAt && (
                  <button
                    onClick={() => markRead(notification)}
                    disabled={busy === notification._id}
                    className="shrink-0 border border-gray-300 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white disabled:opacity-60"
                  >
                    {busy === notification._id ? 'Đang cập nhật...' : 'Đã đọc'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />
    </div>
  );
}
