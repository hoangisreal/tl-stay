import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1d';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.MONGOMS_DISTRO = process.env.MONGOMS_DISTRO || 'ubuntu-22.04';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Listing } = await import('../src/models/Listing.js');
const { default: Booking } = await import('../src/models/Booking.js');
const { default: BookingHold } = await import('../src/models/BookingHold.js');
const { default: PaymentEvent } = await import('../src/models/PaymentEvent.js');
const { default: Notification } = await import('../src/models/Notification.js');
const { default: Review } = await import('../src/models/Review.js');
const { default: PasswordResetToken } = await import('../src/models/PasswordResetToken.js');
const { default: Conversation } = await import('../src/models/Conversation.js');
const { default: Message } = await import('../src/models/Message.js');
const { default: ActivityLog } = await import('../src/models/ActivityLog.js');
const { seedDemoData, demoUsers, demoListings } = await import('../src/utils/seed.js');

let mongod;

const dateFromNow = (days) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const registerAgent = async (email, role = 'guest') => {
  const agent = request.agent(app);
  await agent
    .post('/api/auth/register')
    .send({ name: `${role} user`, email, password: 'password123', role })
    .expect(201);
  const user = await User.findOne({ email });
  return { agent, user };
};

const registerAdminAgent = async (email) => {
  const { agent, user } = await registerAgent(email, 'guest');
  user.role = 'admin';
  await user.save();
  return { agent, user };
};

const registerRoleAgent = async (email, role) => {
  const { agent, user } = await registerAgent(email, 'guest');
  user.role = role;
  await user.save();
  return { agent, user };
};

const createListing = (host, overrides = {}) =>
  Listing.create({
    host: host._id,
    title: 'Test stay',
    description: 'A valid test stay description',
    pricePerNight: 100000,
    cleaningFee: 10000,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    location: { country: 'Viet Nam', city: 'Da Nang', address: '123 Test Street' },
    amenities: ['WiFi'],
    images: [],
    category: 'city',
    ...overrides,
  });

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([
    User.init(),
    Listing.init(),
    Booking.init(),
    BookingHold.init(),
    PaymentEvent.init(),
    Notification.init(),
    Review.init(),
    PasswordResetToken.init(),
    Conversation.init(),
    Message.init(),
    ActivityLog.init(),
  ]);
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Listing.deleteMany({}),
    Booking.deleteMany({}),
    BookingHold.deleteMany({}),
    PaymentEvent.deleteMany({}),
    Notification.deleteMany({}),
    Review.deleteMany({}),
    PasswordResetToken.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);
});

test('auth payloads include verification metadata, preferences and permissions', async () => {
  const agent = request.agent(app);
  const registerRes = await agent
    .post('/api/auth/register')
    .send({ name: 'Guest User', email: 'guest@example.com', password: 'password123', role: 'guest' })
    .expect(201);

  assert.deepEqual(registerRes.body.verified, { email: false, phone: false, id: false });
  assert.deepEqual(registerRes.body.preferences, { language: 'vi', currency: 'VND' });
  assert.ok(registerRes.body.permissions.includes('bookings:create'));
  assert.ok(Array.isArray(registerRes.body.favoriteListings));

  const meRes = await agent.get('/api/auth/me').expect(200);
  assert.deepEqual(meRes.body.verified, registerRes.body.verified);
  assert.deepEqual(meRes.body.preferences, registerRes.body.preferences);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'guest@example.com', password: 'password123' })
    .expect(200);
  assert.ok(loginRes.body.permissions.includes('reviews:create'));
});

test('users can update profile fields without changing protected auth fields', async () => {
  const { agent, user } = await registerAgent('guest@example.com');

  const res = await agent
    .patch('/api/auth/me/profile')
    .send({
      name: 'Guest Updated',
      phone: '+84900000000',
      avatarUrl: 'https://example.com/avatar.png',
      preferences: { language: 'en', currency: 'USD' },
      email: 'attacker@example.com',
      role: 'admin',
      permissions: ['*'],
    })
    .expect(200);

  assert.equal(res.body.name, 'Guest Updated');
  assert.equal(res.body.phone, '+84900000000');
  assert.equal(res.body.avatarUrl, 'https://example.com/avatar.png');
  assert.deepEqual(res.body.preferences, { language: 'en', currency: 'USD' });
  assert.equal(res.body.email, 'guest@example.com');
  assert.equal(res.body.role, 'guest');
  assert.ok(!res.body.permissions.includes('*'));

  const saved = await User.findById(user._id);
  assert.equal(saved.email, 'guest@example.com');
  assert.equal(saved.role, 'guest');
});

test('self verification only enables flags and satisfies guest booking requirements', async () => {
  const { user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent } = await registerAgent('guest@example.com');
  const listing = await createListing(host, {
    guestRequirements: { verifiedEmail: true, verifiedPhone: true, verifiedId: true },
  });

  await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(10),
      checkOut: dateFromNow(12),
      guests: 1,
    })
    .expect(400);

  await guestAgent.patch('/api/auth/me/verification').send({ email: false }).expect(400);

  const verifyRes = await guestAgent
    .patch('/api/auth/me/verification')
    .send({ email: true, phone: true, id: true })
    .expect(200);
  assert.deepEqual(verifyRes.body.verified, { email: true, phone: true, id: true });

  const bookingRes = await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(10),
      checkOut: dateFromNow(12),
      guests: 1,
    })
    .expect(201);
  assert.equal(bookingRes.body.status, 'unpaid');
});

test('password reset and change password flows are token-safe', async () => {
  const { agent: guestAgent } = await registerAgent('guest@example.com');

  const missingRes = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'missing@example.com' })
    .expect(200);
  assert.equal(typeof missingRes.body.message, 'string');
  assert.equal(missingRes.body.resetLink, undefined);

  const forgotRes = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'guest@example.com' })
    .expect(200);
  assert.match(forgotRes.body.resetLink, /\/reset-password\//);
  const token = forgotRes.body.resetLink.split('/reset-password/')[1];

  await request(app)
    .post('/api/auth/reset-password')
    .send({ token, password: 'newpassword123' })
    .expect(200);

  await request(app)
    .post('/api/auth/reset-password')
    .send({ token, password: 'anotherpass123' })
    .expect(400);

  await request(app)
    .post('/api/auth/login')
    .send({ email: 'guest@example.com', password: 'password123' })
    .expect(401);

  await request(app)
    .post('/api/auth/login')
    .send({ email: 'guest@example.com', password: 'newpassword123' })
    .expect(200);

  await guestAgent
    .patch('/api/auth/change-password')
    .send({ currentPassword: 'wrong', newPassword: 'changed123' })
    .expect(400);

  await guestAgent
    .post('/api/auth/login')
    .send({ email: 'guest@example.com', password: 'newpassword123' })
    .expect(200);

  await guestAgent
    .patch('/api/auth/change-password')
    .send({ currentPassword: 'newpassword123', newPassword: 'changed123' })
    .expect(200);
});

test('conversation messages are only visible to participants', async () => {
  const { agent: hostAgent, user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent } = await registerAgent('guest@example.com');
  const { agent: otherGuestAgent } = await registerAgent('other@example.com');
  const listing = await createListing(host);

  const conversationRes = await guestAgent
    .post('/api/conversations')
    .send({ listing: listing._id.toString() })
    .expect(201);

  const messageRes = await guestAgent
    .post(`/api/conversations/${conversationRes.body._id}/messages`)
    .send({ body: 'Chào host, phòng còn trống không?' })
    .expect(201);
  assert.equal(messageRes.body.body, 'Chào host, phòng còn trống không?');

  await otherGuestAgent.get(`/api/conversations/${conversationRes.body._id}/messages`).expect(403);
  const hostMessages = await hostAgent.get(`/api/conversations/${conversationRes.body._id}/messages`).expect(200);
  assert.equal(hostMessages.body.length, 1);

  await hostAgent
    .post(`/api/conversations/${conversationRes.body._id}/messages`)
    .send({ body: 'Chào bạn, phòng đang sẵn sàng.' })
    .expect(201);

  const guestInbox = await guestAgent.get('/api/conversations').expect(200);
  assert.equal(guestInbox.body.length, 1);
  assert.equal(guestInbox.body[0].unreadCount, 1);

  await guestAgent.patch(`/api/conversations/${conversationRes.body._id}/read`).expect(200);
  const afterRead = await guestAgent.get('/api/conversations').expect(200);
  assert.equal(afterRead.body[0].unreadCount, 0);
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('booking details are visible only to the booking guest or listing host', async () => {
  const { agent: hostAgent, user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent } = await registerAgent('guest@example.com');
  const { agent: otherGuestAgent } = await registerAgent('other@example.com');
  const listing = await createListing(host);

  const createRes = await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(10),
      checkOut: dateFromNow(12),
      guests: 1,
    })
    .expect(201);

  await otherGuestAgent.get(`/api/bookings/${createRes.body._id}`).expect(403);
  await guestAgent.get(`/api/bookings/${createRes.body._id}`).expect(200);
  await hostAgent.get(`/api/bookings/${createRes.body._id}`).expect(200);
});

test('inactive listings cannot be quoted or booked', async () => {
  const { user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent } = await registerAgent('guest@example.com');
  const listing = await createListing(host, { isActive: false });

  await guestAgent
    .get('/api/bookings/quote')
    .query({ listing: listing._id.toString(), checkIn: dateFromNow(10), checkOut: dateFromNow(12) })
    .expect(400);

  await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(10),
      checkOut: dateFromNow(12),
      guests: 1,
    })
    .expect(400);
});

test('booking payment lifecycle confirms only after payment success and releases failed holds', async () => {
  const { user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent } = await registerAgent('guest@example.com');
  const listing = await createListing(host);

  const createRes = await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(13),
      checkOut: dateFromNow(15),
      guests: 1,
    })
    .expect(201);
  assert.equal(createRes.body.status, 'unpaid');
  assert.equal(createRes.body.payment.status, 'requires_payment');
  assert.equal(await BookingHold.countDocuments({ booking: createRes.body._id }), 2);

  const payRes = await guestAgent
    .post(`/api/bookings/${createRes.body._id}/payments/mock`)
    .send({ outcome: 'success' })
    .expect(200);
  assert.equal(payRes.body.status, 'paid');
  assert.equal(payRes.body.payment.status, 'paid');
  assert.equal(await BookingHold.countDocuments({ booking: createRes.body._id }), 2);

  const paidBooking = await Booking.findById(createRes.body._id);
  const webhookPayload = {
    eventId: 'evt_duplicate_test',
    type: 'payment.succeeded',
    paymentIntentId: paidBooking.payment.intentId,
  };
  await request(app).post('/api/bookings/payments/webhook').send(webhookPayload).expect(200);
  const duplicateRes = await request(app).post('/api/bookings/payments/webhook').send(webhookPayload).expect(200);
  assert.equal(duplicateRes.body.duplicate, true);
  assert.equal(await PaymentEvent.countDocuments({ eventId: webhookPayload.eventId }), 1);

  const failedRes = await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(16),
      checkOut: dateFromNow(18),
      guests: 1,
    })
    .expect(201);
  await guestAgent
    .post(`/api/bookings/${failedRes.body._id}/payments/mock`)
    .send({ outcome: 'failure' })
    .expect(200);
  assert.equal(await BookingHold.countDocuments({ booking: failedRes.body._id }), 0);

  const retryRes = await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(16),
      checkOut: dateFromNow(18),
      guests: 1,
    })
    .expect(201);
  assert.equal(retryRes.body.status, 'unpaid');
});

test('notification endpoints are paginated and scoped to the current user', async () => {
  const { user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent, user: guest } = await registerAgent('guest@example.com');
  const { agent: otherAgent, user: otherGuest } = await registerAgent('other@example.com');
  const listing = await createListing(host);

  const guestNotification = await Notification.create({
    user: guest._id,
    type: 'booking_created',
    title: 'Guest notice',
    body: 'Only the guest should read this.',
    listing: listing._id,
  });
  await Notification.create({
    user: otherGuest._id,
    type: 'booking_paid',
    title: 'Other notice',
    body: 'Only the other guest should read this.',
    listing: listing._id,
  });

  const listRes = await guestAgent.get('/api/notifications?page=1&limit=10').expect(200);
  assert.equal(listRes.body.notifications.length, 1);
  assert.equal(listRes.body.notifications[0]._id, guestNotification._id.toString());
  assert.equal(listRes.body.total, 1);
  assert.equal(listRes.body.unreadCount, 1);

  const countRes = await guestAgent.get('/api/notifications/unread-count').expect(200);
  assert.equal(countRes.body.count, 1);

  await otherAgent.patch(`/api/notifications/${guestNotification._id}/read`).expect(404);
  const readRes = await guestAgent.patch(`/api/notifications/${guestNotification._id}/read`).expect(200);
  assert.ok(readRes.body.readAt);
  assert.equal((await guestAgent.get('/api/notifications/unread-count').expect(200)).body.count, 0);

  await guestAgent.patch('/api/notifications/read-all').expect(200);
});

test('host blocked dates and stay rules are enforced in quotes, search and booking', async () => {
  const { user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent } = await registerAgent('guest@example.com');
  const listing = await createListing(host, {
    minNights: 2,
    maxNights: 5,
    blockedDates: [new Date(`${dateFromNow(25)}T00:00:00.000Z`)],
  });

  await guestAgent
    .get('/api/bookings/quote')
    .query({ listing: listing._id.toString(), checkIn: dateFromNow(20), checkOut: dateFromNow(21) })
    .expect(400);

  await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(24),
      checkOut: dateFromNow(26),
      guests: 1,
    })
    .expect(400);

  const searchRes = await request(app)
    .get('/api/listings')
    .query({ checkIn: dateFromNow(24), checkOut: dateFromNow(26) })
    .expect(200);
  assert.equal(searchRes.body.listings.some((item) => item._id === listing._id.toString()), false);

  const availabilityRes = await request(app).get(`/api/listings/${listing._id}/availability`).expect(200);
  assert.deepEqual(availabilityRes.body.blockedDates, [dateFromNow(25)]);
  assert.equal(availabilityRes.body.rules.minNights, 2);
});

test('overlapping concurrent bookings reserve dates only once', async () => {
  const { user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestA } = await registerAgent('guest-a@example.com');
  const { agent: guestB } = await registerAgent('guest-b@example.com');
  const listing = await createListing(host);

  const payload = {
    listing: listing._id.toString(),
    checkIn: dateFromNow(20),
    checkOut: dateFromNow(23),
    guests: 1,
  };

  const responses = await Promise.all([
    guestA.post('/api/bookings').send(payload),
    guestB.post('/api/bookings').send(payload),
  ]);
  const statuses = responses.map((res) => res.status).sort((a, b) => a - b);

  assert.deepEqual(statuses, [201, 409]);
  assert.equal(await Booking.countDocuments({ listing: listing._id }), 1);
  assert.equal(await BookingHold.countDocuments({ listing: listing._id }), 3);
});

test('deleting a listing with booking history deactivates it and preserves history', async () => {
  const { agent: hostAgent, user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent } = await registerAgent('guest@example.com');
  const listing = await createListing(host);

  await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(30),
      checkOut: dateFromNow(32),
      guests: 1,
    })
    .expect(201);

  const deleteRes = await hostAgent.delete(`/api/listings/${listing._id}`).expect(200);
  assert.equal(deleteRes.body.message, 'Listing deactivated');

  const deactivated = await Listing.findById(listing._id);
  assert.equal(deactivated.isActive, false);
  assert.equal(await Booking.countDocuments({ listing: listing._id }), 1);
  assert.equal(await BookingHold.countDocuments({ listing: listing._id }), 2);

  await request(app).get(`/api/listings/${listing._id}`).expect(404);
  const hostListings = await hostAgent.get('/api/listings/host/me').expect(200);
  assert.equal(hostListings.body.length, 0);
});

test('invalid ids and listing filters return 400 instead of server errors', async () => {
  const { agent: guestAgent } = await registerAgent('guest@example.com');

  await guestAgent.get('/api/bookings/not-an-id').expect(400);
  await request(app).get('/api/listings').query({ sort: 'host' }).expect(400);
  await request(app)
    .get('/api/listings')
    .query({ checkIn: dateFromNow(10) })
    .expect(400);
});

test('wishlist only exposes active listings', async () => {
  const { user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent, user: guest } = await registerAgent('guest@example.com');
  const activeListing = await createListing(host, { title: 'Active stay' });
  const inactiveListing = await createListing(host, { title: 'Inactive stay', isActive: false });

  guest.favoriteListings.push(activeListing._id, inactiveListing._id);
  await guest.save();

  const wishlist = await guestAgent.get('/api/wishlist').expect(200);
  assert.deepEqual(wishlist.body.map((l) => l._id), [activeListing._id.toString()]);

  await guestAgent.post(`/api/wishlist/${inactiveListing._id}/toggle`).expect(404);
});

test('admin can inspect stats, manage roles, deactivate listings and cancel bookings', async () => {
  const { agent: adminAgent } = await registerAdminAgent('admin@example.com');
  const { user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent, user: guest } = await registerAgent('guest@example.com');
  const listing = await createListing(host);

  const bookingRes = await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(40),
      checkOut: dateFromNow(42),
      guests: 1,
    })
    .expect(201);
  const conversationRes = await guestAgent
    .post('/api/conversations')
    .send({ listing: listing._id.toString() })
    .expect(201);
  await guestAgent
    .post(`/api/conversations/${conversationRes.body._id}/messages`)
    .send({ body: 'Admin should be able to inspect this message.' })
    .expect(201);

  const stats = await adminAgent.get('/api/admin/stats').expect(200);
  assert.equal(stats.body.users, 3);
  assert.equal(stats.body.bookings, 1);
  assert.equal(stats.body.conversations, 1);
  assert.equal(stats.body.messages, 1);

  // Admin list endpoints now return paginated responses
  const adminMessages = await adminAgent.get('/api/admin/messages').expect(200);
  assert.equal(adminMessages.body.messages.length, 1);
  assert.equal(adminMessages.body.total, 1);

  const adminUsers = await adminAgent.get('/api/admin/users').expect(200);
  assert.equal(adminUsers.body.users.length, 3);
  assert.equal(adminUsers.body.total, 3);

  const adminListings = await adminAgent.get('/api/admin/listings').expect(200);
  assert.equal(adminListings.body.listings.length, 1);

  const adminBookings = await adminAgent.get('/api/admin/bookings').expect(200);
  assert.equal(adminBookings.body.bookings.length, 1);

  const roleRes = await adminAgent
    .patch(`/api/admin/users/${guest._id}/role`)
    .send({ role: 'host' })
    .expect(200);
  assert.equal(roleRes.body.role, 'host');

  const listingRes = await adminAgent
    .patch(`/api/admin/listings/${listing._id}/status`)
    .send({ isActive: false })
    .expect(200);
  assert.equal(listingRes.body.isActive, false);

  const cancelRes = await adminAgent
    .patch(`/api/admin/bookings/${bookingRes.body._id}/cancel`)
    .expect(200);
  assert.equal(cancelRes.body.status, 'cancelled');
  assert.equal(await BookingHold.countDocuments({ booking: bookingRes.body._id }), 0);
});

test('staff admin endpoints honor the permission matrix', async () => {
  const { user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent, user: guest } = await registerAgent('guest@example.com');
  const listing = await createListing(host);

  const bookingRes = await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(45),
      checkOut: dateFromNow(47),
      guests: 1,
    })
    .expect(201);
  const conversationRes = await guestAgent
    .post('/api/conversations')
    .send({ listing: listing._id.toString() })
    .expect(201);
  await guestAgent
    .post(`/api/conversations/${conversationRes.body._id}/messages`)
    .send({ body: 'Staff should inspect this message.' })
    .expect(201);
  const review = await Review.create({
    listing: listing._id,
    booking: bookingRes.body._id,
    guest: guest._id,
    rating: 4,
    comment: 'A review for moderation coverage.',
  });

  const { agent: supportAgent } = await registerRoleAgent('support@example.com', 'customer_support');
  const { agent: moderatorAgent } = await registerRoleAgent('moderator@example.com', 'content_moderator');
  const { agent: financeAgent } = await registerRoleAgent('finance@example.com', 'finance_manager');
  const { agent: operationsAgent } = await registerRoleAgent('operations@example.com', 'operations_manager');

  await supportAgent.get('/api/admin/users').expect(200);
  await supportAgent.get('/api/admin/bookings').expect(200);
  await supportAgent.get('/api/admin/messages').expect(200);
  await supportAgent.get('/api/admin/listings').expect(403);
  await supportAgent.patch(`/api/admin/users/${guest._id}/role`).send({ role: 'host' }).expect(403);
  await supportAgent.patch(`/api/admin/bookings/${bookingRes.body._id}/cancel`).expect(200);

  await moderatorAgent.get('/api/admin/listings').expect(200);
  await moderatorAgent.patch(`/api/admin/listings/${listing._id}/status`).send({ isActive: false }).expect(200);
  await moderatorAgent.get('/api/admin/reviews').expect(200);
  await moderatorAgent.delete(`/api/admin/reviews/${review._id}`).expect(200);
  await moderatorAgent.get('/api/admin/users').expect(403);

  await financeAgent.get('/api/admin/stats').expect(200);
  await financeAgent.get('/api/admin/users').expect(200);
  await financeAgent.get('/api/admin/bookings').expect(200);
  await financeAgent.patch(`/api/admin/listings/${listing._id}/status`).send({ isActive: true }).expect(403);
  await financeAgent.patch(`/api/admin/bookings/${bookingRes.body._id}/cancel`).expect(403);

  await operationsAgent.get('/api/admin/stats').expect(200);
  await operationsAgent.get('/api/admin/listings').expect(200);
  await operationsAgent.patch(`/api/admin/listings/${listing._id}/status`).send({ isActive: true }).expect(200);
  const verifyRes = await operationsAgent
    .patch(`/api/admin/users/${guest._id}/verify`)
    .send({ email: true, phone: true })
    .expect(200);
  assert.equal(verifyRes.body.user.verified.email, true);
  assert.equal(verifyRes.body.user.verified.phone, true);
  await operationsAgent.patch(`/api/admin/users/${guest._id}/role`).send({ role: 'host' }).expect(403);
  await operationsAgent.get('/api/admin/activity-logs').expect(403);
});

test('admin pagination returns correct page metadata', async () => {
  const { agent: adminAgent } = await registerAdminAgent('admin@example.com');

  const res = await adminAgent.get('/api/admin/users?page=1&limit=2').expect(200);
  assert.equal(res.body.page, 1);
  assert.equal(res.body.limit, 2);
  assert.ok(typeof res.body.total === 'number');
  assert.ok(typeof res.body.pages === 'number');
  assert.ok(Array.isArray(res.body.users));
});

test('activity log filters return server-side filtered page metadata', async () => {
  const { agent: adminAgent, user: admin } = await registerAdminAgent('admin@example.com');
  const { user: guest } = await registerAgent('guest@example.com');

  await ActivityLog.insertMany([
    {
      user: admin._id,
      action: 'user.role_updated',
      resource: 'user',
      resourceId: guest._id,
      details: { role: 'host' },
    },
    {
      user: guest._id,
      action: 'payment.succeeded',
      resource: 'booking',
      details: { amount: 1000 },
    },
    {
      user: admin._id,
      action: 'listing.status_updated',
      resource: 'listing',
      details: { isActive: false },
    },
  ]);

  const actionRes = await adminAgent.get('/api/admin/activity-logs?action=payment&page=1&limit=5').expect(200);
  assert.equal(actionRes.body.total, 1);
  assert.equal(actionRes.body.logs[0].action, 'payment.succeeded');
  assert.equal(actionRes.body.page, 1);
  assert.equal(actionRes.body.pages, 1);

  const resourceRes = await adminAgent.get('/api/admin/activity-logs?resource=listing').expect(200);
  assert.equal(resourceRes.body.total, 1);
  assert.equal(resourceRes.body.logs[0].resource, 'listing');

  const userRes = await adminAgent.get('/api/admin/activity-logs?user=guest@example.com').expect(200);
  assert.equal(userRes.body.total, 1);
  assert.equal(userRes.body.logs[0].user.email, 'guest@example.com');
});

test('host analytics and bookings-by-status alias return live data', async () => {
  const { agent: hostAgent, user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent } = await registerAgent('guest@example.com');
  const { agent: adminAgent } = await registerAdminAgent('admin@example.com');
  const listing = await createListing(host);

  const bookingRes = await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(70),
      checkOut: dateFromNow(72),
      guests: 1,
    })
    .expect(201);
  await guestAgent
    .post(`/api/bookings/${bookingRes.body._id}/payments/mock`)
    .send({ outcome: 'success' })
    .expect(200);

  const hostAnalytics = await hostAgent.get('/api/analytics/host').expect(200);
  assert.equal(hostAnalytics.body.listings, 1);
  assert.equal(hostAnalytics.body.bookings, 1);
  assert.ok(hostAnalytics.body.revenue > 0);

  const statusRes = await adminAgent.get('/api/analytics/bookings-by-status').expect(200);
  assert.ok(statusRes.body.some((item) => item._id === 'paid' && item.count === 1));
});

test('demo seed includes actor coverage, notifications and booking status mix', async () => {
  await seedDemoData({ reset: true, log: false });

  const roles = await User.distinct('role');
  for (const role of [
    'admin',
    'customer_support',
    'content_moderator',
    'finance_manager',
    'operations_manager',
    'host',
    'guest',
  ]) {
    assert.ok(roles.includes(role), `missing role ${role}`);
  }

  assert.equal(demoUsers.length, 20);
  assert.ok(demoListings.length >= 20);
  assert.ok(await Notification.countDocuments());
  assert.ok(await ActivityLog.countDocuments());

  const statuses = await Booking.distinct('status');
  for (const status of ['unpaid', 'paid', 'failed', 'refunded', 'cancelled', 'pending', 'confirmed']) {
    assert.ok(statuses.includes(status), `missing status ${status}`);
  }
});

test('guest verification requirements are enforced before booking', async () => {
  const { user: host } = await registerAgent('host@example.com', 'host');
  const { agent: guestAgent, user: guest } = await registerAgent('guest@example.com');
  const listing = await createListing(host, {
    title: 'Verified email stay',
    guestRequirements: { verifiedEmail: true },
  });

  await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(55),
      checkOut: dateFromNow(57),
      guests: 1,
    })
    .expect(400);

  guest.verified.email = true;
  await guest.save();

  const bookingRes = await guestAgent
    .post('/api/bookings')
    .send({
      listing: listing._id.toString(),
      checkIn: dateFromNow(55),
      checkOut: dateFromNow(57),
      guests: 1,
    })
    .expect(201);
  assert.equal(bookingRes.body.status, 'unpaid');
});

test('listing filters match Vietnamese amenity values', async () => {
  const { user: host } = await registerAgent('host@example.com', 'host');
  const airconListing = await createListing(host, {
    title: 'Aircon stay',
    amenities: ['WiFi', 'Điều hòa'],
  });
  await createListing(host, {
    title: 'Pool stay',
    amenities: ['Hồ bơi'],
  });

  const res = await request(app)
    .get('/api/listings')
    .query({ amenities: 'Điều hòa' })
    .expect(200);

  assert.deepEqual(res.body.listings.map((listing) => listing._id), [airconListing._id.toString()]);
});

test('demo seed covers accounts, states, verification, wishlists, conversations and logs', async () => {
  await seedDemoData({ log: false });

  const emails = await User.distinct('email');
  for (const expectedEmail of [
    'admin@tlstay.com',
    'hung.support@tlstay.com',
    'quang.moderator@tlstay.com',
    'tai.finance@tlstay.com',
    'duc.operations@tlstay.com',
    'host@tlstay.com',
    'guest@tlstay.com',
  ]) {
    assert.ok(emails.includes(expectedEmail), `${expectedEmail} should be seeded`);
  }

  assert.equal(await User.countDocuments(), demoUsers.length);
  assert.equal(await Listing.countDocuments(), demoListings.length);
  assert.ok(await Listing.countDocuments({ isActive: true }) > 0);
  assert.ok(await Listing.countDocuments({ isActive: false }) > 0);

  const statuses = await Booking.distinct('status');
  for (const status of ['unpaid', 'paid', 'failed', 'refunded', 'cancelled', 'pending', 'confirmed']) {
    assert.ok(statuses.includes(status), `${status} booking should be seeded`);
  }

  const verifiedGuests = await User.countDocuments({ role: 'guest', 'verified.email': true });
  const unverifiedGuests = await User.countDocuments({ role: 'guest', 'verified.email': false });
  assert.ok(verifiedGuests > 0);
  assert.ok(unverifiedGuests > 0);
  const primaryGuest = await User.findOne({ email: 'guest@tlstay.com' });
  assert.equal(primaryGuest.verified.email, true);

  const guests = await User.find({ role: 'guest' });
  assert.ok(guests.some((guest) => guest.favoriteListings.length > 0));
  assert.ok(await Conversation.countDocuments() > 0);
  assert.ok(await Message.countDocuments() > 0);
  assert.ok(await ActivityLog.countDocuments() >= 8);
});
