const API_BASE = process.env.SMOKE_API_BASE || 'http://localhost:5000/api';
const WEB_BASE = process.env.SMOKE_WEB_BASE || 'http://localhost:5173';

const apiHost = new URL(API_BASE).hostname;
const isLocalApi = ['localhost', '127.0.0.1', '::1'].includes(apiHost);
if (!isLocalApi && process.env.SMOKE_ALLOW_NONLOCAL !== 'true') {
  throw new Error('Smoke test mutates data and only runs against localhost by default. Set SMOKE_ALLOW_NONLOCAL=true to override.');
}

const results = [];

const record = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const cookieFrom = (response) => {
  const values = response.headers.getSetCookie?.() || [response.headers.get('set-cookie')].filter(Boolean);
  return values.map((value) => value.split(';')[0]).join('; ');
};

const requestJson = async (path, { method = 'GET', body, cookie, expected = 200 } = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  assert(response.status === expected, `${path} returned ${response.status}, expected ${expected}: ${text}`);
  return { response, data };
};

const login = async (email) => {
  const { response, data } = await requestJson('/auth/login', {
    method: 'POST',
    body: { email, password: 'password123' },
  });
  const cookie = cookieFrom(response);
  assert(cookie.includes('token='), `login for ${email} did not return auth cookie`);
  return { cookie, user: data };
};

let listing;
let quoteDates;
let guestSession;
let hostSession;
let adminSession;

await record('frontend serves app shell', async () => {
  const response = await fetch(WEB_BASE);
  const html = await response.text();
  assert(response.ok, `frontend returned ${response.status}`);
  assert(html.includes('<div id="root">'), 'frontend root node missing');
});

await record('backend health responds', async () => {
  const { data } = await requestJson('/health');
  assert(data.status === 'ok', 'health status is not ok');
});

await record('visitor can search active listings', async () => {
  const { data } = await requestJson('/listings?limit=12');
  assert(Array.isArray(data.listings), 'listings payload missing array');
  assert(data.listings.length > 0, 'no active listings returned');
  listing = data.listings[0];
});

await record('visitor can view listing, availability, reviews and quote', async () => {
  assert(listing?._id, 'listing was not loaded');
  const detail = await requestJson(`/listings/${listing._id}`);
  assert(detail.data._id === listing._id, 'listing detail id mismatch');

  const availability = await requestJson(`/listings/${listing._id}/availability`);
  assert(Array.isArray(availability.data.bookedRanges), 'availability bookedRanges missing');

  const reviews = await requestJson(`/reviews/listing/${listing._id}`);
  assert(Array.isArray(reviews.data.reviews || reviews.data), 'reviews payload missing');

  const today = new Date();
  for (let days = 90; days < 180; days += 7) {
    const checkIn = new Date(today);
    checkIn.setUTCDate(checkIn.getUTCDate() + days);
    const checkOut = new Date(checkIn);
    checkOut.setUTCDate(checkOut.getUTCDate() + 2);
    const start = checkIn.toISOString().slice(0, 10);
    const end = checkOut.toISOString().slice(0, 10);
    const response = await fetch(`${API_BASE}/bookings/quote?listing=${listing._id}&checkIn=${start}&checkOut=${end}`);
    if (response.ok) {
      const data = await response.json();
      assert(data.totalPrice > 0, 'quote totalPrice missing');
      quoteDates = { checkIn: start, checkOut: end };
      return;
    }
  }
  throw new Error('could not find quoteable future date range');
});

await record('guest can authenticate and use account endpoints', async () => {
  guestSession = await login('guest@tlstay.com');
  assert(guestSession.user.role === 'guest', 'guest role mismatch');

  const me = await requestJson('/auth/me', { cookie: guestSession.cookie });
  assert(me.data.email === 'guest@tlstay.com', 'guest me email mismatch');

  const profile = await requestJson('/auth/me/profile', {
    method: 'PATCH',
    cookie: guestSession.cookie,
    body: { phone: '+84900000001', preferences: { language: 'vi', currency: 'VND' } },
  });
  assert(profile.data.email === 'guest@tlstay.com', 'profile update changed email unexpectedly');

  const notifications = await requestJson('/notifications?limit=5', { cookie: guestSession.cookie });
  assert(Array.isArray(notifications.data.notifications), 'notifications array missing');

  const unread = await requestJson('/notifications/unread-count', { cookie: guestSession.cookie });
  assert(Number.isInteger(unread.data.count), 'unread count missing');

  const wishlist = await requestJson('/wishlist', { cookie: guestSession.cookie });
  assert(Array.isArray(wishlist.data), 'wishlist array missing');

  const bookings = await requestJson('/bookings/me', { cookie: guestSession.cookie });
  assert(Array.isArray(bookings.data), 'guest bookings array missing');
});

await record('guest can create and pay a mock booking', async () => {
  assert(guestSession?.cookie, 'guest session missing');
  assert(listing?._id && quoteDates, 'listing or quote dates missing');

  const booking = await requestJson('/bookings', {
    method: 'POST',
    cookie: guestSession.cookie,
    body: {
      listing: listing._id,
      checkIn: quoteDates.checkIn,
      checkOut: quoteDates.checkOut,
      guests: 1,
    },
    expected: 201,
  });
  assert(booking.data.status === 'unpaid', 'new booking should be unpaid');

  const payment = await requestJson(`/bookings/${booking.data._id}/payments/mock`, {
    method: 'POST',
    cookie: guestSession.cookie,
    body: { outcome: 'success' },
  });
  assert(payment.data.status === 'paid', 'mock payment did not mark booking paid');
});

await record('host can access host dashboard endpoints', async () => {
  hostSession = await login('host@tlstay.com');
  assert(hostSession.user.role === 'host', 'host role mismatch');

  const listings = await requestJson('/listings/host/me', { cookie: hostSession.cookie });
  assert(Array.isArray(listings.data), 'host listings array missing');

  const bookings = await requestJson('/bookings/host', { cookie: hostSession.cookie });
  assert(Array.isArray(bookings.data), 'host bookings array missing');

  const analytics = await requestJson('/analytics/host', { cookie: hostSession.cookie });
  assert(typeof analytics.data.listings === 'number', 'host analytics listing count missing');
});

await record('admin can access management and analytics endpoints', async () => {
  adminSession = await login('admin@tlstay.com');
  assert(adminSession.user.role === 'admin', 'admin role mismatch');

  const stats = await requestJson('/admin/stats', { cookie: adminSession.cookie });
  assert(typeof stats.data.users === 'number', 'admin stats users missing');

  const users = await requestJson('/admin/users?limit=5', { cookie: adminSession.cookie });
  assert(Array.isArray(users.data.users), 'admin users array missing');

  const activity = await requestJson('/admin/activity-logs?limit=5', { cookie: adminSession.cookie });
  assert(Array.isArray(activity.data.logs), 'activity logs array missing');

  const overview = await requestJson('/analytics/overview', { cookie: adminSession.cookie });
  assert(typeof overview.data.totalUsers === 'number', 'analytics overview totalUsers missing');
});

await record('staff permissions are enforced', async () => {
  const support = await login('hung.support@tlstay.com');
  assert(support.user.role === 'customer_support', 'support role mismatch');

  await requestJson('/admin/users?limit=1', { cookie: support.cookie });
  await requestJson('/admin/listings?limit=1', { cookie: support.cookie, expected: 403 });
});

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  console.error(`\nSmoke test failed: ${failed.length}/${results.length} checks failed.`);
  process.exit(1);
}

console.log(`\nSmoke test passed: ${results.length}/${results.length} checks passed.`);
