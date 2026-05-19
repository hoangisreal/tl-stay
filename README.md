# TL-Stay

Homestay booking platform (Airbnb-style) — Academic Project.

## Tech Stack

### Backend
- Node.js, Express.js
- MongoDB (Mongoose ODM)
- JWT Authentication (httpOnly cookies)
- Multer (File upload)
- Zod (Validation)

### Frontend
- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- Zustand (State management)
- React Router v6
- React Hook Form + Zod (Form validation)

## Project Structure

```
tl-stay/
├── backend/
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── controllers/  # Business logic
│   │   ├── middlewares/  # Auth, error handling
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API routes
│   │   ├── utils/        # Helpers (pricing, availability, upload, JWT)
│   │   ├── app.js        # Express app setup
│   │   └── server.js     # Server entry point
│   ├── uploads/          # Uploaded images
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/   # React components
    │   ├── hooks/        # Custom hooks
    │   ├── layouts/      # Page layouts
    │   ├── lib/          # Utilities (categories, images)
    │   ├── pages/        # Page components
    │   ├── routes/       # React Router config
    │   ├── services/     # API services
    │   ├── store/        # Zustand store
    │   ├── App.tsx       # Root component
    │   └── main.tsx      # Entry point
    └── package.json
```

## Installation

### 1. Requirements

- Node.js 20+
- npm 10+
- MongoDB is optional for local demo mode. Without `MONGO_URI`, the backend uses an
  in-memory MongoDB database and seeds demo data automatically.

### 2. NixOS / Nix development shell

On NixOS, enter the dev shell before installing dependencies. The flake provides
Node.js 22, npm, MongoDB, mongosh, and configures `mongodb-memory-server` to use
the Nix-provided `mongod` binary.

```bash
nix develop
npm run install:all
npm run doctor
npm run dev
```

If you use `direnv`, run this once:

```bash
direnv allow
```

### 3. Clone and install dependencies

```bash
npm run install:all
npm run doctor
```

### 4. Environment configuration

For a quick local demo, `.env` files are optional. If `backend/.env` does not define
`MONGO_URI`, the backend starts with an in-memory MongoDB database and seeds demo data
automatically when the database is empty.

For persistent local data, copy the example files and edit them:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

On Windows PowerShell, the same commands work as:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

**backend/.env**
```env
PORT=5000
# Leave MONGO_URI commented for zero-setup demo mode.
# Uncomment only if you have a local MongoDB server running.
# MONGO_URI=mongodb://localhost:27017/tl-stay
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
NODE_ENV=development
SEED_DEMO_ON_EMPTY=true
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Seed demo data (optional)

In development, TL-Stay seeds demo data automatically when the database is
empty. Run the seed command manually when you want to reset the local demo
database.

```bash
cd backend
npm run seed
```

Demo dataset after seed:
- 14 users: 1 admin, 5 hosts, 8 guests
- 26 listings across Vietnam, including 24 active listings and 2 inactive
  listings for Admin Panel moderation
- 49 bookings with confirmed, pending, cancelled, past, and future scenarios
- 24 reviews plus guest wishlists for client-side and admin demos
- 10 host-guest conversations with 40 messages for inbox/chat demos
- Listing coordinates for OpenStreetMap previews on detail pages

Demo accounts (password: `password123`):
- **Admin:** admin@tlstay.com / password123
- **Host:** host@tlstay.com / password123
- **Host:** mai.host@tlstay.com / password123
- **Guest:** guest@tlstay.com / password123
- **Guest:** binh.guest@tlstay.com / password123

### 6. Run the application

Run both backend and frontend from the project root:

```bash
npm run dev
```

Or run them in two terminals:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

Quick health check:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/listings
```

## Features

### Authentication
- User registration (Guest/Host roles)
- Login with JWT (httpOnly cookies)
- Forgot/reset password with local development reset link
- Change password for logged-in users
- Protected routes with role-based access control
- Auto-redirect on 401 errors

### Listings
- Search by location, dates, price, guests
- Filter by category (Beach, Mountain, City, Cabin, etc.)
- Price range filtering
- Availability check for date ranges
- Listing coordinates and OpenStreetMap location preview
- Host dashboard: Create, update, delete listings
- Image upload (up to 10 images, 5MB each, JPEG/PNG/WebP)

### Booking System
- Book listings with date range and guest count
- Double-booking prevention with race condition handling
- Detailed price breakdown (subtotal, cleaning fee, service fee, tax, total)
- Guest: View and cancel bookings
- Host: View incoming bookings and cancel

### Reviews & Ratings
- Guests can review completed bookings
- Rating system (1-5 stars)
- Display average rating and review count per listing
- View all reviews for a listing

### Wishlist
- Add/remove listings to favorites
- View wishlist page with grid layout
- Persistent favorites across sessions

### Messaging
- Guest can message the listing host from listing details
- Host can message guests from incoming bookings
- Inbox and conversation pages use REST polling for local-friendly chat demos
- Admin can inspect recent messages and message counts

### UI/UX
- Responsive design with Tailwind CSS
- Image lightbox for viewing listing photos
- Category tabs for quick filtering
- Rating stars display
- Favorite button on listing cards
- Loading skeletons and empty states
- Form validation with error messages

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Create password reset link
- `POST /api/auth/reset-password` - Reset password with token
- `PATCH /api/auth/change-password` - Change password while logged in

### Listings
- `GET /api/listings` - Get all listings with filters
- `GET /api/listings/:id` - Get listing by ID
- `GET /api/listings/host/me` - Get host's listings
- `GET /api/listings/:id/availability` - Get booked date ranges
- `POST /api/listings` - Create listing (Host only)
- `PUT /api/listings/:id` - Update listing (Host only)
- `DELETE /api/listings/:id` - Delete listing (Host only)

### Bookings
- `POST /api/bookings` - Create booking (Guest only)
- `GET /api/bookings/me` - Get guest's bookings (Guest only)
- `GET /api/bookings/host` - Get host's bookings (Host only)
- `GET /api/bookings/:id` - Get booking by ID
- `GET /api/bookings/quote` - Get price quote (public)
- `PATCH /api/bookings/:id/cancel` - Cancel booking

### Reviews
- `GET /api/reviews/listing/:listingId` - Get reviews for listing
- `POST /api/reviews` - Create review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/me/pending` - Get pending reviews

### Wishlist
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist/:listingId/toggle` - Toggle favorite

### Conversations
- `GET /api/conversations` - Get current user's conversations
- `POST /api/conversations` - Create or get listing conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message
- `PATCH /api/conversations/:id/read` - Mark conversation as read

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - Manage users
- `PATCH /api/admin/users/:id/role` - Update user role
- `GET /api/admin/listings` - Manage listings
- `PATCH /api/admin/listings/:id/status` - Show/hide listing
- `GET /api/admin/bookings` - Manage bookings
- `PATCH /api/admin/bookings/:id/cancel` - Cancel booking
- `GET /api/admin/reviews` - Manage reviews
- `DELETE /api/admin/reviews/:id` - Delete review
- `GET /api/admin/messages` - Inspect recent messages

## Database Models

### User
- name, email, passwordHash
- role (guest/host/admin)
- avatarUrl
- favoriteListings (array of listing IDs)

### Listing
- host (User reference)
- title, description
- pricePerNight, cleaningFee
- maxGuests, bedrooms, beds, bathrooms
- location (country, city, address, optional lat/lng)
- amenities (array)
- images (array)
- category (enum)
- avgRating, reviewCount
- isActive (boolean)

### Booking
- listing (Listing reference)
- guest (User reference)
- checkIn, checkOut, guests
- nights, subtotal, cleaningFee, serviceFee, tax, totalPrice
- status (pending/confirmed/cancelled)

### Review
- listing (Listing reference)
- booking (Booking reference, unique)
- guest (User reference)
- rating, cleanliness, accuracy, checkInRating, communication, location, value
- comment

### Conversation
- listing, host, guest
- lastMessageAt

### Message
- conversation, sender
- body, readAt

## Development Scripts

### Root
```bash
npm run install:all # Install backend and frontend dependencies
npm run doctor      # Check local setup prerequisites
npm run dev         # Start backend and frontend together
npm test            # Run backend tests and frontend build
```

### Backend
```bash
npm run dev      # Start with nodemon
npm start        # Start with node
npm run seed     # Seed demo data
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Security Considerations

- Passwords hashed with bcryptjs
- JWT tokens stored in httpOnly cookies
- CORS configured for allowed origins
- File upload validation (type, size)
- Input validation with Zod schemas
- Protected routes with authentication middleware
- Role-based access control

## License

MIT License - Academic Project
