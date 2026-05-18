# TL-Stay Project Context

## Project Overview
A homestay booking platform (Airbnb-style clone) built as an academic project. Users can search, filter, and book homestays. Hosts can manage their listings and bookings.

## Tech Stack

### Backend
- Node.js, Express.js
- MongoDB with Mongoose ODM
- JWT Authentication (httpOnly cookies)
- Multer for file uploads
- Zod for validation

### Frontend
- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- Zustand for state management
- React Router v6
- React Hook Form + Zod for forms

## Architecture
Monorepo structure with separate `backend/` and `frontend/` directories at repo root.

## Coding Standards
1. Keep code simple and minimal.
2. **DO NOT include comments in generated code.** Use descriptive naming instead.
3. Use ES6+ syntax and modular, single-responsibility components.
4. Wrap API calls in try/catch and show friendly error messages.
5. Use TypeScript for type safety (no `any` types when possible).
6. Follow existing code patterns and conventions.

## File Conventions
- Frontend components/pages: `.tsx` extension
- Frontend services/hooks/stores: `.ts` extension
- Backend: `.js` extension (ES modules)
- Component names: PascalCase
- Function names: camelCase
- File names: camelCase for utilities, PascalCase for components

## Key Patterns

### Backend Controllers
- Use Zod schemas for request validation
- Return early with `res.status(code)` and `next(new Error(message))` for errors
- Use async/await with try/catch
- Populate related documents where needed

### Frontend Services
- Use axios instance from `apiClient.ts`
- Type all API responses with TypeScript interfaces
- Handle errors at the component level with try/catch

### Frontend Components
- Use TypeScript interfaces for props
- Use React Hook Form + Zod for forms
- Use Zustand for global state
- Use custom hooks for reusable logic

### State Management
- Auth state: Zustand store (`authStore.ts`)
- Local component state: React `useState`
- Form state: React Hook Form

## Authentication Flow
- JWT stored in httpOnly cookie
- `requireAuth` middleware protects routes
- `requireRole(role)` middleware for role-based access (guest/host)
- Auto-redirect to login on 401 errors (handled in apiClient interceptor)

## Database Models

### User
- name, email (unique), passwordHash, role (guest/host), avatarUrl, favoriteListings

### Listing
- host (ref), title, description, pricePerNight, cleaningFee, maxGuests, bedrooms, beds, bathrooms
- location (country, city, address), amenities, images, category
- avgRating, reviewCount, isActive

### Booking
- listing (ref), guest (ref), checkIn, checkOut, guests
- nights, subtotal, cleaningFee, serviceFee, tax, totalPrice
- status (pending/confirmed/cancelled)

### Review
- listing (ref), booking (ref, unique), guest (ref)
- rating, cleanliness, accuracy, checkInRating, communication, location, value, comment

## API Response Format
Success: `{ data: ... }` or direct object
Error: `{ message: string, code?: string }`

## Environment Variables

### Backend (.env)
- PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_ORIGIN, NODE_ENV

### Frontend (.env)
- VITE_API_URL

## Development Workflow
1. Review `PLAN.md` to understand current phase and requirements
2. Implement features following existing patterns
3. Test the implementation
4. Update `PLAN.md` by checking off completed tasks
5. Commit and push changes

## Common Commands

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

## Known Patterns to Follow
- Image URLs: Use `resolveImageUrl()` or `resolveFirstImage()` from `lib/images.ts`
- Form validation: Use react-hook-form with zodResolver
- API calls: Use service functions from `services/` directory
- Navigation: Use React Router's `useNavigate` and `Link`
- Loading states: Use skeleton components or loading spinners
- Error handling: Use try/catch with user-friendly error messages

## Security Considerations
- Passwords are hashed with bcryptjs
- JWT tokens in httpOnly cookies (not accessible via JS)
- File uploads validated for type and size
- Input validation with Zod schemas
- Protected routes require authentication
- Role-based access control for host-only features