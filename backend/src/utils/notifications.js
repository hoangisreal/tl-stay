import Notification from '../models/Notification.js';

export const notifyUser = async ({ user, type, title, body, booking, listing }) => {
  if (!user) return null;
  const notification = await Notification.create({ user, type, title, body, booking, listing });

  if (process.env.NODE_ENV !== 'test') {
    console.info(`[notification:${type}] ${title}`);
  }

  return notification;
};

export const notifyBookingEvent = async ({ booking, listing, guest, host, type }) => {
  const titleByType = {
    booking_created: 'Đặt phòng đang chờ thanh toán',
    booking_paid: 'Đặt phòng đã thanh toán',
    booking_cancelled: 'Đặt phòng đã huỷ',
    booking_refunded: 'Đặt phòng đã hoàn tiền',
    booking_failed: 'Thanh toán đặt phòng thất bại',
  };
  const listingTitle = listing?.title || 'phòng của bạn';
  const title = titleByType[type] || 'Cập nhật đặt phòng';

  const notifications = [];
  if (guest?._id || guest) {
    notifications.push(
      notifyUser({
        user: guest._id || guest,
        type,
        title,
        body: `${title} cho ${listingTitle}.`,
        booking: booking._id,
        listing: listing?._id || booking.listing,
      })
    );
  }
  if (host?._id || host) {
    notifications.push(
      notifyUser({
        user: host._id || host,
        type,
        title,
        body: `${listingTitle} có cập nhật đặt phòng mới.`,
        booking: booking._id,
        listing: listing?._id || booking.listing,
      })
    );
  }

  await Promise.all(notifications);
};
