# TL-Stay Development Plan

A homestay booking demo (Airbnb-style) built with the MERN stack and Tailwind CSS, scoped for an academic project.

## Project Rules
- Code must be simple and clean.
- **Strictly NO comments** in the codebase; use descriptive naming instead.
- Use modular, single-responsibility components.
- ES6+ syntax; wrap API calls in try/catch and show friendly errors.
- Tech stack: **MongoDB, Express.js, React 19 + TypeScript (Vite 8), Node.js, Tailwind CSS v4**.
- Monorepo layout: `frontend/` and `backend/` at repo root.
- State & forms: **Zustand**, **react-router-dom v6**, **react-hook-form + zod**.
- Image storage: **Multer → `backend/uploads/`** served as static files.
- Env-driven config; never hardcode secrets, ports, or URLs.
- Frontend file extensions: `.tsx` for components/pages, `.ts` for logic/services/stores.

---

## Phase 1 — Project Setup & Architecture

### Backend
- [x] Init repo root: `package.json`, `.gitignore`, `.prettierrc`.
- [x] Create `backend/`, install all dependencies.
- [x] Folders: `backend/src/{config,routes,controllers,models,middlewares,utils}`.
- [x] Create `backend/uploads/listings/`.
- [x] `config/db.js` — Mongoose connect.
- [x] `app.js` — express app, CORS w/ credentials, JSON, cookies, static `/uploads`, route mounting.
- [x] `server.js` — load env, listen on `PORT`.
- [x] `.env.example`: `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`.
- [x] `GET /api/health` route.
- [x] `notFound` + central error-handler middlewares.

### Frontend
- [x] `vite.config.ts` — React plugin + `@tailwindcss/vite` plugin.
- [x] `index.html` — update title, mount point.
- [x] `src/index.css` — replace with `@import "tailwindcss"`.
- [x] `src/main.tsx` — React 19 `createRoot` mount.
- [x] Folders: `src/{pages,components,layouts,hooks,store,services,routes}`.
- [x] `services/apiClient.ts` — axios w/ baseURL + `withCredentials`.
- [x] `routes/AppRouter.tsx` — pages: `Home`, `Login`, `Register`, `ListingDetails`, `HostDashboard`, `MyBookings`, `NotFound`.
- [x] `layouts/MainLayout.tsx` with modular `Navbar` + `Footer`.
- [x] `.env.example`: `VITE_API_URL`.

---

## Phase 2 — Authentication & User Management

### Backend
- [x] `User` model: `name`, `email` (unique), `passwordHash`, `role` (`guest` | `host`), `avatarUrl`, timestamps.
- [x] Install `bcryptjs`, `jsonwebtoken`.
- [x] `authController`: `register`, `login`, `logout`, `me`.
- [x] Validate payloads with `zod`.
- [x] Routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- [x] `requireAuth` middleware (JWT from httpOnly cookie).
- [x] `requireRole(role)` middleware for host-only routes.
- [x] Set JWT in httpOnly + sameSite cookie.

### Frontend
- [x] `RegisterPage` with role selector (Guest/Host) — `react-hook-form` + `zod`.
- [x] `LoginPage` with same form stack.
- [x] `authStore` (Zustand): `user`, `login`, `register`, `logout`, `fetchMe`.
- [x] `useAuth` hook.
- [x] `ProtectedRoute` + `RoleRoute` guards.
- [x] Update `Navbar` for auth state and role-based links.
- [x] `AccountMenu` dropdown.
- [x] Reusable `FormField` + `FormError` components.

---

## Phase 3 — Core Entities (Listings)

### Backend
- [x] `Listing` model: `host` (ref), `title`, `description`, `pricePerNight`, `maxGuests`, `bedrooms`, `beds`, `bathrooms`, `location` (`country`, `city`, `address`), `amenities` ([String]), `images` ([String]), `isActive`, timestamps.
- [x] Install `multer`; disk storage to `backend/uploads/listings/` with size/type check.
- [x] `listingController`: `create`, `getAll`, `getById`, `update`, `delete`, `getByHost`.
- [x] Routes: POST/GET/PUT/DELETE /api/listings, GET /api/listings/host/me.
- [x] Ownership-check middleware.
- [x] Validate listing payloads with `zod`.

### Frontend
- [x] `ListingCard` (image, title, location, price).
- [x] `ListingGrid`.
- [x] `HomePage` — fetch & render listings.
- [x] `ListingDetailsPage` — image gallery, amenities, host info, BookingWidget.
- [x] `HostDashboardPage` — listings table + create/edit/delete actions.
- [x] Modular `ListingForm` (create + edit) with `AmenityPicker` + `ImageUploader` (multipart).
- [x] `listingService` for all listing API calls.

---

## Phase 4 — Search & Filtering

### Backend
- [x] Extend `GET /api/listings` with query params: `location`, `minPrice`, `maxPrice`, `guests`, `checkIn`, `checkOut`, `page`, `limit`.
- [x] Query-builder helper for Mongo filters.
- [x] When `checkIn`/`checkOut` provided, exclude listings with overlapping bookings.
- [x] Return pagination metadata: `page`, `limit`, `total`, `pages`.

### Frontend
- [x] `SearchBar` (location, date range, guests) on `HomePage`.
- [x] `FiltersPanel` (price range, guests).
- [x] Sync filters to URL query params via `react-router`.
- [x] `Pagination` component.
- [x] `useListingsQuery` hook.
- [x] Reusable `EmptyState`, `LoadingSkeleton`, `ErrorState`.

---

## Phase 5 — Booking System

### Backend
- [x] `Booking` model: `listing` (ref), `guest` (ref), `checkIn`, `checkOut`, `guests`, `totalPrice`, `status`, timestamps.
- [x] `availability` helper — detect date-range overlaps.
- [x] `pricing` helper — `nights × pricePerNight`.
- [x] `bookingController`: `create`, `getMyBookings`, `getHostBookings`, `cancel`, `getById`.
- [x] Routes: POST /api/bookings, GET /me, GET /host, PATCH /:id/cancel, GET availability.
- [x] Validate dates (checkIn < checkOut, not in past, guests ≤ maxGuests).
- [x] Re-check overlap inside `create` to prevent double-booking.

### Frontend
- [x] `BookingWidget` on `ListingDetailsPage` (dates via native inputs, guests, total, confirm).
- [x] `BookingConfirmationPage`.
- [x] `MyBookingsPage` (guest).
- [x] `HostBookingsPage` (host).
- [x] `Badge` component for booking status.

---

## Phase 6 — UI Polish & Finalization

### Backend
- [x] Standardize error response: `{ message, code? }`.
- [x] Seed script for demo users, listings, bookings.
- [x] README with setup + run instructions.

### Frontend
- [x] Reusable components: `Badge`, `LoadingSkeleton`, `EmptyState`, `ErrorState`, `Pagination`.
- [x] Global `ErrorBoundary`.
- [x] Mobile-first responsive Tailwind layouts.
- [x] `NotFoundPage` + `ErrorPage`.
- [x] Loading states across pages.

---

## Done Criteria
- [ ] Guests can register, search, filter, view, and book a homestay.
- [ ] Hosts can register, create/edit/delete listings, and view their bookings.
- [ ] No double-booking possible.
- [ ] Responsive Tailwind UI with consistent components and error handling.
- [ ] Codebase contains zero comments and uses descriptive naming throughout.