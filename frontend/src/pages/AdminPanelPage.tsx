import { useEffect, useMemo, useRef, useState } from 'react';
import Badge from '../components/Badge.tsx';
import {
  cancelAdminBooking,
  deleteAdminReview,
  fetchAdminBookings,
  fetchAdminListings,
  fetchAdminMessages,
  fetchAdminReviews,
  fetchAdminStats,
  fetchAdminUsers,
  updateAdminListingStatus,
  updateAdminUserRole,
  type AdminReview,
  type AdminStats,
  type AdminUser,
} from '../services/adminService.ts';
import type { Booking } from '../services/bookingService.ts';
import type { AdminMessage } from '../services/conversationService.ts';
import type { Listing } from '../services/listingService.ts';

type TabKey = 'users' | 'listings' | 'bookings' | 'reviews' | 'messages';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'users', label: 'Người dùng' },
  { key: 'listings', label: 'Phòng' },
  { key: 'bookings', label: 'Đặt phòng' },
  { key: 'reviews', label: 'Đánh giá' },
  { key: 'messages', label: 'Tin nhắn' },
];

const roleLabels = {
  guest: 'Khách',
  host: 'Chủ nhà',
  admin: 'Admin',
};

const fmtMoney = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
const fmtDate = (value: string) => new Date(value).toLocaleDateString('vi-VN');

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('users');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Per-tab state: data is null until the tab is first visited
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [reviews, setReviews] = useState<AdminReview[] | null>(null);
  const [messages, setMessages] = useState<AdminMessage[] | null>(null);

  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  // Track which tabs have been loaded so we don't refetch unless refresh is clicked
  const loadedTabs = useRef<Set<TabKey>>(new Set());

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetchAdminStats();
      setStats(res.data);
    } catch {
      setError('Không thể tải thống kê');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTab = async (tab: TabKey, force = false) => {
    if (!force && loadedTabs.current.has(tab)) return;
    setTabLoading(true);
    setError('');
    try {
      switch (tab) {
        case 'users': {
          const res = await fetchAdminUsers();
          setUsers(res.data.users);
          break;
        }
        case 'listings': {
          const res = await fetchAdminListings();
          setListings(res.data.listings);
          break;
        }
        case 'bookings': {
          const res = await fetchAdminBookings();
          setBookings(res.data.bookings);
          break;
        }
        case 'reviews': {
          const res = await fetchAdminReviews();
          setReviews(res.data.reviews);
          break;
        }
        case 'messages': {
          const res = await fetchAdminMessages();
          setMessages(res.data.messages);
          break;
        }
      }
      loadedTabs.current.add(tab);
    } catch {
      setError(`Không thể tải dữ liệu tab ${tab}`);
    } finally {
      setTabLoading(false);
    }
  };

  const handleRefresh = async () => {
    loadedTabs.current.clear();
    await Promise.all([loadStats(), loadTab(activeTab, true)]);
  };

  // Load stats once on mount and load the initial (users) tab
  useEffect(() => {
    loadStats();
    loadTab('users');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    loadTab(tab);
  };

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Người dùng', value: stats.users.toLocaleString('vi-VN'), sub: `${stats.admins} admin · ${stats.hosts} host · ${stats.guests} guest` },
      { label: 'Phòng', value: stats.listings.toLocaleString('vi-VN'), sub: `${stats.activeListings} đang hiển thị · ${stats.inactiveListings} tạm ẩn` },
      { label: 'Đặt phòng', value: stats.bookings.toLocaleString('vi-VN'), sub: `${stats.confirmedBookings} hiệu lực · ${stats.cancelledBookings} đã huỷ` },
      { label: 'Doanh thu', value: fmtMoney(stats.revenue), sub: `${stats.reviews} đánh giá` },
      { label: 'Tin nhắn', value: stats.messages.toLocaleString('vi-VN'), sub: `${stats.conversations} hội thoại` },
    ];
  }, [stats]);

  const changeRole = async (userId: string, role: AdminUser['role']) => {
    setBusyId(userId);
    try {
      const { data } = await updateAdminUserRole(userId, role);
      setUsers((prev) => prev ? prev.map((u) => (u._id === userId ? data : u)) : prev);
    } finally {
      setBusyId('');
    }
  };

  const changeListingStatus = async (listingId: string, isActive: boolean) => {
    setBusyId(listingId);
    try {
      const { data } = await updateAdminListingStatus(listingId, isActive);
      setListings((prev) => prev ? prev.map((l) => (l._id === listingId ? data : l)) : prev);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              activeListings: prev.activeListings + (isActive ? 1 : -1),
              inactiveListings: prev.inactiveListings + (isActive ? -1 : 1),
            }
          : prev
      );
    } finally {
      setBusyId('');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Huỷ đặt phòng này?')) return;
    setBusyId(bookingId);
    try {
      const { data } = await cancelAdminBooking(bookingId);
      setBookings((prev) => prev ? prev.map((b) => (b._id === bookingId ? data : b)) : prev);
    } finally {
      setBusyId('');
    }
  };

  const removeReview = async (reviewId: string) => {
    if (!confirm('Xoá đánh giá này?')) return;
    setBusyId(reviewId);
    try {
      await deleteAdminReview(reviewId);
      setReviews((prev) => prev ? prev.filter((r) => r._id !== reviewId) : prev);
      setStats((prev) => (prev ? { ...prev, reviews: Math.max(0, prev.reviews - 1) } : prev));
    } finally {
      setBusyId('');
    }
  };

  if (statsLoading) return <div className="flex justify-center py-20">Đang tải...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500">Quản lý dữ liệu, thống kê và phân quyền hệ thống.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="w-full sm:w-auto border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          Làm mới
        </button>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.key
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {tabLoading && <div className="text-sm text-gray-500 py-4 text-center">Đang tải...</div>}

      {!tabLoading && activeTab === 'users' && users !== null && (
        <AdminTable>
          <thead className="bg-gray-50">
            <tr>
              <Th>Tên</Th>
              <Th>Email</Th>
              <Th>Quyền</Th>
              <Th>Ngày tạo</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((user) => (
              <tr key={user._id}>
                <Td>{user.name}</Td>
                <Td>{user.email}</Td>
                <Td>
                  <select
                    value={user.role}
                    disabled={busyId === user._id}
                    onChange={(e) => changeRole(user._id, e.target.value as AdminUser['role'])}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  >
                    {(['guest', 'host', 'admin'] as const).map((role) => (
                      <option key={role} value={role}>{roleLabels[role]}</option>
                    ))}
                  </select>
                </Td>
                <Td>{fmtDate(user.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}

      {!tabLoading && activeTab === 'listings' && listings !== null && (
        <AdminTable>
          <thead className="bg-gray-50">
            <tr>
              <Th>Phòng</Th>
              <Th>Host</Th>
              <Th>Giá</Th>
              <Th>Trạng thái</Th>
              <Th>Thao tác</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {listings.map((listing) => (
              <tr key={listing._id}>
                <Td>
                  <div className="font-medium text-gray-900">{listing.title}</div>
                  <div className="text-xs text-gray-500">{listing.location.city}, {listing.location.country}</div>
                </Td>
                <Td>{listing.host.name}</Td>
                <Td>{fmtMoney(listing.pricePerNight)}</Td>
                <Td>{listing.isActive ? 'Đang hiển thị' : 'Tạm ẩn'}</Td>
                <Td>
                  <button
                    disabled={busyId === listing._id}
                    onClick={() => changeListingStatus(listing._id, !listing.isActive)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    {listing.isActive ? 'Tạm ẩn' : 'Hiển thị'}
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}

      {!tabLoading && activeTab === 'bookings' && bookings !== null && (
        <AdminTable>
          <thead className="bg-gray-50">
            <tr>
              <Th>Phòng</Th>
              <Th>Khách</Th>
              <Th>Ngày</Th>
              <Th>Tổng</Th>
              <Th>Trạng thái</Th>
              <Th>Thao tác</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <Td>{booking.listing.title}</Td>
                <Td>
                  <div>{booking.guest.name}</div>
                  <div className="text-xs text-gray-500">{booking.guest.email}</div>
                </Td>
                <Td>{fmtDate(booking.checkIn)} - {fmtDate(booking.checkOut)}</Td>
                <Td>{fmtMoney(booking.totalPrice)}</Td>
                <Td><Badge status={booking.status} /></Td>
                <Td>
                  {booking.status !== 'cancelled' && (
                    <button
                      disabled={busyId === booking._id}
                      onClick={() => cancelBooking(booking._id)}
                      className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-sm hover:bg-red-50 disabled:opacity-60"
                    >
                      Huỷ
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}

      {!tabLoading && activeTab === 'reviews' && reviews !== null && (
        <AdminTable>
          <thead className="bg-gray-50">
            <tr>
              <Th>Phòng</Th>
              <Th>Khách</Th>
              <Th>Điểm</Th>
              <Th>Nội dung</Th>
              <Th>Thao tác</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {reviews.map((review) => (
              <tr key={review._id}>
                <Td>{review.listing?.title || 'Listing đã xoá'}</Td>
                <Td>
                  <div>{review.guest.name}</div>
                  <div className="text-xs text-gray-500">{review.guest.email}</div>
                </Td>
                <Td>{review.rating}/5</Td>
                <Td>
                  <p className="max-w-md text-sm line-clamp-2">{review.comment}</p>
                </Td>
                <Td>
                  <button
                    disabled={busyId === review._id}
                    onClick={() => removeReview(review._id)}
                    className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-sm hover:bg-red-50 disabled:opacity-60"
                  >
                    Xoá
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}

      {!tabLoading && activeTab === 'messages' && messages !== null && (
        <AdminTable>
          <thead className="bg-gray-50">
            <tr>
              <Th>Phòng</Th>
              <Th>Người gửi</Th>
              <Th>Hội thoại</Th>
              <Th>Nội dung</Th>
              <Th>Thời gian</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {messages.map((message) => (
              <tr key={message._id}>
                <Td>{message.conversation?.listing?.title || 'Listing đã xoá'}</Td>
                <Td>
                  <div>{message.sender.name}</div>
                  <div className="text-xs text-gray-500">{message.sender.email}</div>
                </Td>
                <Td>
                  <div className="text-xs text-gray-500">Host: {message.conversation?.host?.name || '-'}</div>
                  <div className="text-xs text-gray-500">Guest: {message.conversation?.guest?.name || '-'}</div>
                </Td>
                <Td>
                  <p className="max-w-md text-sm line-clamp-2">{message.body}</p>
                </Td>
                <Td>{fmtDate(message.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}

function AdminTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-[760px] w-full text-left text-sm">
        {children}
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top text-gray-700">{children}</td>;
}
