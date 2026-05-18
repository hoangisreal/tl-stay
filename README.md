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
- Vite 8
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

### 1. Clone and install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment configuration

Create `.env` files:

**backend/.env**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/tl-stay
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed demo data (optional)

```bash
cd backend
npm run seed
```

Demo accounts after seed:
- **Host:** host@tlstay.com / password123
- **Guest:** guest@tlstay.com / password123

### 4. Run the application

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

## Features

### Authentication
- User registration (Guest/Host roles)
- Login with JWT (httpOnly cookies)
- Protected routes with role-based access control
- Auto-redirect on 401 errors

### Listings
- Search by location, dates, price, guests
- Filter by category (Beach, Mountain, City, Cabin, etc.)
- Price range filtering
- Availability check for date ranges
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

## Database Models

### User
- name, email, passwordHash
- role (guest/host)
- avatarUrl
- favoriteListings (array of listing IDs)

### Listing
- host (User reference)
- title, description
- pricePerNight, cleaningFee
- maxGuests, bedrooms, beds, bathrooms
- location (country, city, address)
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

## Development Scripts

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
