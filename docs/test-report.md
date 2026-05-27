# TL-Stay Test Report

Date: 2026-05-23

## Environment

- OS: Local workspace in `/home/vieth/dev/Project/tl-stay_test01`
- Node.js: `v24.14.1`
- npm: `11.11.0`
- Demo seed mode: MongoDB in-memory when `MONGO_URI` is not set

## Scope

- Verify backend automated coverage with `node:test` and `supertest`
- Verify frontend TypeScript and production build
- Verify repository root test script
- Verify seed flow for demo data
- Verify runtime health with dev server and HTTP smoke checks
- Record setup/runtime defects and risks
- Provide remaining manual browser checklist for visual/responsive flows

## Automated Validation

| Command | Result | Notes |
| --- | --- | --- |
| `npm test --prefix backend` | PASS | `28` tests, `2` suites, `0` failures |
| `npm run build --prefix frontend` | PASS | `tsc` and `vite build` completed successfully |
| `npm test` | PASS | Backend tests passed and frontend build passed |
| `npm run seed` | PASS | In-memory seed completed successfully |
| `npm run doctor` | PASS | Fixed npm detection now reads npm version from the npm runtime environment |
| `npm run smoke` | PASS | `9` runtime smoke checks passed against local dev server |

## Observed Output

- Backend test suite: `28`/`28` passed
- Frontend build: production bundle generated successfully
- Seed summary:
  - Users: `20`
  - Listings: `26`
  - Active listings: `24`
  - Bookings: `49`
  - Reviews: `24`
  - Conversations: `10`
  - Messages: `40`
  - Notifications: `98`
  - Activity logs: `9`
- Runtime smoke summary:
  - Frontend app shell loaded from `http://localhost:5173`
  - Backend health returned `status: ok`
  - Visitor listing search/detail/availability/reviews/quote passed
  - Guest login/profile/notifications/wishlist/bookings/create booking/mock payment passed
  - Host listing/bookings/analytics endpoints passed
  - Admin stats/users/activity logs/analytics endpoints passed
  - Customer Support permission allow/deny checks passed

## Defects

### 1. `npm run doctor` false negative on npm detection

- Severity: Low
- Status: Fixed in `scripts/doctor.mjs`
- Reproduction:
  1. Run `npm run doctor`
  2. Observe `[FAIL] npm not found`
- Expected:
  - Doctor should detect the installed npm version and pass the npm check
- Actual:
  - Doctor previously reported npm missing even though both `npm test` and `npm --version` succeeded in the same environment
- Impact:
  - Local setup guidance was misleading before the fix
  - This was a false negative, not an application runtime defect

## Risks and Notes

- `npm run dev` inside the Codex sandbox failed to bind the Vite dev server with `listen EPERM: operation not permitted ::1:5173`; running outside the sandbox passed. This is an environment sandbox limitation, not an app defect.
- `npm run dev` prints Node warning `DEP0190` because `scripts/dev.mjs` passes arguments to child processes with `shell: true`. Severity: Low. It does not fail runtime testing, but the dev launcher should be hardened later.
- Dev runtime prints `JWT_SECRET is not set. Using a development-only fallback secret.` during authenticated smoke checks. This is acceptable for demo mode, but production and shared staging environments must set `JWT_SECRET`.

## Actor Coverage Verdict

Verdict here reflects automated coverage plus seeded-data integrity, not a live browser session.

| Actor | Verdict | Evidence |
| --- | --- | --- |
| Visitor | PASS | Search, filter, listing detail, inactive listing, quote validation covered by backend tests |
| Guest | PASS | Profile update, verification, booking, payment, notifications, messages, wishlist, review flows covered |
| Host | PASS | Listing CRUD, host bookings, host analytics, messages, notifications covered |
| Admin | PASS | Stats, role changes, listing moderation, booking moderation, pagination, activity logs covered |
| Customer Support | PASS | Permission matrix coverage on user, booking, and message endpoints |
| Content Moderator | PASS | Permission matrix coverage on listing and review moderation endpoints |
| Finance Manager | PASS | Permission matrix coverage on analytics and read-only admin access |
| Operations Manager | PASS | Permission matrix coverage on listing status and user verification actions |

## Runtime Smoke Coverage

The smoke test is implemented in `scripts/smoke.mjs` and exposed as `npm run smoke`. It requires the dev server to be running first with `npm run dev`. Because the smoke test mutates demo data, it only runs against localhost by default.

| Area | Result | Checks |
| --- | --- | --- |
| Frontend | PASS | App shell served and root element present |
| Health | PASS | `GET /api/health` |
| Visitor | PASS | Listings, detail, availability, reviews, quote |
| Guest | PASS | Login, current user, profile, notifications, wishlist, bookings, create booking, mock payment |
| Host | PASS | Host listings, host bookings, host analytics |
| Admin | PASS | Stats, users, activity logs, analytics overview |
| Staff | PASS | Customer Support can read users and is denied listing admin access |

## Manual Browser Checklist

Visual, responsive and keyboard checks were not executed in a real browser automation tool because no browser test dependency is present in the repo. Use the seeded demo accounts from `npm run seed` or `README.md`.

### Visitor

- [ ] Search listings with location, dates, guests, price and category filters
- [ ] Open listing detail and inspect photos, amenities, reviews and guest requirements
- [ ] Verify inactive listing behavior is blocked
- [ ] Request a public quote for a valid stay

### Guest

- [ ] Log in with a seeded guest account
- [ ] Update profile fields and verify protected auth fields stay unchanged
- [ ] Enable demo verification flags
- [ ] Add/remove wishlist items
- [ ] Create booking, complete mock payment, and cancel booking
- [ ] Open notifications and mark them read
- [ ] Send and read conversation messages
- [ ] Submit an eligible review

### Host

- [ ] Log in with a seeded host account
- [ ] Open host dashboard analytics
- [ ] Create, update, and deactivate a listing
- [ ] Review bookings and cancel where allowed
- [ ] Read host messages and notifications

### Admin

- [ ] Open admin panel as admin
- [ ] Confirm stats and management tabs load
- [ ] Change user role and verification state
- [ ] Moderate listings, bookings, reviews, and messages
- [ ] Inspect activity logs and pagination

### Customer Support

- [ ] Confirm support can read users, bookings, and messages
- [ ] Confirm support cannot change roles

### Content Moderator

- [ ] Confirm moderator can manage listings and reviews
- [ ] Confirm moderator cannot access restricted admin data

### Finance Manager

- [ ] Confirm finance can read analytics, users, and bookings
- [ ] Confirm finance cannot moderate listings or bookings

### Operations Manager

- [ ] Confirm operations can manage listing status and verification
- [ ] Confirm operations cannot change roles or access activity logs

### Responsive and Accessibility Smoke

- [ ] Desktop viewport loads without layout breakage
- [ ] Mobile viewport keeps navigation usable
- [ ] Keyboard navigation works for primary forms
- [ ] Validation errors are visible and actionable
- [ ] Protected routes redirect unauthenticated users
- [ ] Unread badge counts update after reading notifications/messages

## Conclusion

- Automated validation: PASS
- Setup doctor: PASS after npm detection fix
- Runtime smoke validation: PASS
- Manual visual/responsive browser matrix: pending
- No application regressions were introduced by the verification work in this run
