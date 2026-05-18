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
const { default: Review } = await import('../src/models/Review.js');

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
    Review.init(),
  ]);
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Listing.deleteMany({}),
    Booking.deleteMany({}),
    BookingHold.deleteMany({}),
    Review.deleteMany({}),
  ]);
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
