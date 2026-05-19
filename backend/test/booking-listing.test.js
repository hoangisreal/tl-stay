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
  ]);
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

test('admin pagination returns correct page metadata', async () => {
  const { agent: adminAgent } = await registerAdminAgent('admin@example.com');

  const res = await adminAgent.get('/api/admin/users?page=1&limit=2').expect(200);
  assert.equal(res.body.page, 1);
  assert.equal(res.body.limit, 2);
  assert.ok(typeof res.body.total === 'number');
  assert.ok(typeof res.body.pages === 'number');
  assert.ok(Array.isArray(res.body.users));
});
