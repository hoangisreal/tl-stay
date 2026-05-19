# TL-Stay

Nền tảng đặt phòng homestay.

## Công nghệ sử dụng

### Backend
- Node.js, Express.js
- MongoDB (Mongoose ODM)
- JWT Authentication (httpOnly cookies)
- Multer (Tải lên file)
- Zod (Validation)

### Frontend
- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- Zustand (Quản lý state)
- React Router v6
- React Hook Form + Zod (Validation form)

## Cấu trúc dự án

```
tl-stay/
├── backend/
│   ├── src/
│   │   ├── config/       # Cấu hình database
│   │   ├── controllers/  # Logic nghiệp vụ
│   │   ├── middlewares/  # Auth, xử lý lỗi
│   │   ├── models/       # Schema Mongoose
│   │   ├── routes/       # API routes
│   │   ├── utils/        # Helpers (giá, khả dụng, upload, JWT)
│   │   ├── app.js        # Cấu hình Express app
│   │   └── server.js     # Entry point server
│   ├── uploads/          # Hình ảnh đã tải lên
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/   # React components
    │   ├── hooks/        # Custom hooks
    │   ├── layouts/      # Layout trang
    │   ├── lib/          # Utilities (categories, images)
    │   ├── pages/        # Components trang
    │   ├── routes/       # Cấu hình React Router
    │   ├── services/     # API services
    │   ├── store/        # Zustand store
    │   ├── App.tsx       # Root component
    │   └── main.tsx      # Entry point
    └── package.json
```

## Cài đặt

### 1. Yêu cầu hệ thống

- Node.js 20+
- npm 10+
- MongoDB là tùy chọn cho chế độ demo local. Nếu không có `MONGO_URI`, backend sử dụng
  database MongoDB trong bộ nhớ và tự động thêm dữ liệu demo.

### 2. Cấu hình Windows PowerShell

Nếu bạn gặp lỗi execution policy khi chạy npm commands trên Windows:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

Lệnh này cho phép chạy script trong phiên PowerShell hiện tại. Bạn cần chạy lệnh này mỗi khi mở cửa sổ PowerShell mới.

Hoặc bạn có thể sử dụng Git Bash hoặc Command Prompt thay vì PowerShell để tránh vấn đề này.

### 3. Clone và cài đặt dependencies

```bash
npm run install:all
npm run doctor
```

### 4. Cấu hình môi trường

Để chạy demo nhanh, file `.env` là tùy chọn. Nếu `backend/.env` không định nghĩa
`MONGO_URI`, backend sẽ khởi động với database MongoDB trong bộ nhớ và tự động thêm dữ liệu demo
khi database trống.

Để lưu dữ liệu local, copy file example và chỉnh sửa:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Trên Windows PowerShell, các lệnh tương tự:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

**backend/.env**
```env
PORT=5000
# Để MONGO_URI comment để dùng chế độ demo zero-setup.
# Bỏ comment chỉ khi bạn có local MongoDB server đang chạy.
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

### 5. Thêm dữ liệu demo (tùy chọn)

Trong môi trường development, TL-Stay tự động thêm dữ liệu demo khi database trống.
Chạy lệnh seed thủ công khi bạn muốn reset database demo local.

```bash
cd backend
npm run seed
```

Dataset demo sau khi seed:
- 14 users: 1 admin, 5 hosts, 8 guests
- 26 listings trên khắp Việt Nam, bao gồm 24 listings active và 2 listings
  inactive cho Admin Panel moderation
- 49 bookings với các tình huống confirmed, pending, cancelled, past, và future
- 24 reviews plus guest wishlists cho demos client-side và admin
- 10 cuộc hội thoại host-guest với 40 messages cho demos inbox/chat
- Tọa độ listings để xem trước vị trí trên OpenStreetMap ở trang chi tiết

Tài khoản demo (password: `password123`):
- **Admin:** admin@tlstay.com / password123
- **Host:** host@tlstay.com / password123
- **Host:** mai.host@tlstay.com / password123
- **Guest:** guest@tlstay.com / password123
- **Guest:** binh.guest@tlstay.com / password123

### 6. Chạy ứng dụng

Chạy cả backend và frontend từ thư mục gốc dự án:

```bash
npm run dev
```

Hoặc chạy trong 2 terminal riêng biệt:

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

Kiểm tra nhanh:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/listings
```

## Tính năng

### Xác thực
- Đăng ký người dùng (Vai trò Guest/Host)
- Đăng nhập với JWT (httpOnly cookies)
- Quên/reset mật khẩu với link reset local development
- Đổi mật khẩu cho người dùng đã đăng nhập
- Routes được bảo vệ với role-based access control
- Tự động redirect khi lỗi 401

### Listings
- Tìm kiếm theo vị trí, ngày, giá, số khách
- Lọc theo category (Bãi biển, Núi, Thành phố, Cabin, v.v.)
- Lọc theo khoảng giá
- Kiểm tra khả dụng cho khoảng ngày
- Tọa độ listing và xem trước vị trí trên OpenStreetMap
- Dashboard Host: Tạo, cập nhật, xóa listings
- Tải lên hình ảnh (tối đa 10 hình, 5MB mỗi hình, JPEG/PNG/WebP)

### Hệ thống Đặt phòng
- Đặt phòng với khoảng ngày và số lượng khách
- Ngăn chặn đặt trùng với xử lý race condition
- Phân tích giá chi tiết (subtotal, phí dọn, phí dịch vụ, thuế, tổng)
- Guest: Xem và hủy bookings
- Host: Xem bookings đến và hủy

### Đánh giá & Xếp hạng
- Guest có thể đánh giá bookings đã hoàn thành
- Hệ thống xếp hạng (1-5 sao)
- Hiển thị xếp hạng trung bình và số đánh giá mỗi listing
- Xem tất cả đánh giá cho một listing

### Danh sách yêu thích
- Thêm/xóa listings vào favorites
- Xem trang wishlist với bố cục lưới
- Favorites lưu trữ qua các phiên

### Nhắn tin
- Guest có thể nhắn tin cho host listing từ trang chi tiết
- Host có thể nhắn tin cho guest từ bookings đến
- Trang inbox và hội thoại sử dụng REST polling cho demos chat local-friendly
- Admin có thể kiểm tra tin nhắn gần đây và số lượng tin nhắn

### UI/UX
- Thiết kế responsive với Tailwind CSS
- Lightbox hình ảnh để xem photos listing
- Tab category để lọc nhanh
- Hiển thị sao xếp hạng
- Nút favorite trên card listing
- Loading skeletons và empty states
- Validation form với thông báo lỗi

## API Endpoints

### Auth
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy user hiện tại
- `POST /api/auth/forgot-password` - Tạo link reset mật khẩu
- `POST /api/auth/reset-password` - Reset mật khẩu với token
- `PATCH /api/auth/change-password` - Đổi mật khẩu khi đã đăng nhập

### Listings
- `GET /api/listings` - Lấy tất cả listings với filters
- `GET /api/listings/:id` - Lấy listing theo ID
- `GET /api/listings/host/me` - Lấy listings của host
- `GET /api/listings/:id/availability` - Lấy khoảng ngày đã đặt
- `POST /api/listings` - Tạo listing (Chỉ Host)
- `PUT /api/listings/:id` - Cập nhật listing (Chỉ Host)
- `DELETE /api/listings/:id` - Xóa listing (Chỉ Host)

### Bookings
- `POST /api/bookings` - Tạo booking (Chỉ Guest)
- `GET /api/bookings/me` - Lấy bookings của guest (Chỉ Guest)
- `GET /api/bookings/host` - Lấy bookings của host (Chỉ Host)
- `GET /api/bookings/:id` - Lấy booking theo ID
- `GET /api/bookings/quote` - Lấy báo giá (public)
- `PATCH /api/bookings/:id/cancel` - Hủy booking

### Reviews
- `GET /api/reviews/listing/:listingId` - Lấy đánh giá cho listing
- `POST /api/reviews` - Tạo đánh giá
- `DELETE /api/reviews/:id` - Xóa đánh giá
- `GET /api/reviews/me/pending` - Lấy đánh giá đang chờ

### Wishlist
- `GET /api/wishlist` - Lấy wishlist của user
- `POST /api/wishlist/:listingId/toggle` - Toggle favorite

### Conversations
- `GET /api/conversations` - Lấy hội thoại của user hiện tại
- `POST /api/conversations` - Tạo hoặc lấy hội thoại listing
- `GET /api/conversations/:id/messages` - Lấy tin nhắn
- `POST /api/conversations/:id/messages` - Gửi tin nhắn
- `PATCH /api/conversations/:id/read` - Đánh dấu hội thoại đã đọc

### Admin
- `GET /api/admin/stats` - Thống kê dashboard
- `GET /api/admin/users` - Quản lý users
- `PATCH /api/admin/users/:id/role` - Cập nhật vai trò user
- `GET /api/admin/listings` - Quản lý listings
- `PATCH /api/admin/listings/:id/status` - Hiện/ẩn listing
- `GET /api/admin/bookings` - Quản lý bookings
- `PATCH /api/admin/bookings/:id/cancel` - Hủy booking
- `GET /api/admin/reviews` - Quản lý đánh giá
- `DELETE /api/admin/reviews/:id` - Xóa đánh giá
- `GET /api/admin/messages` - Kiểm tra tin nhắn gần đây

## Database Models

### User
- name, email, passwordHash
- role (guest/host/admin)
- avatarUrl
- favoriteListings (mảng listing IDs)

### Listing
- host (User reference)
- title, description
- pricePerNight, cleaningFee
- maxGuests, bedrooms, beds, bathrooms
- location (country, city, address, tọa độ lat/lng tùy chọn)
- amenities (mảng)
- images (mảng)
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
npm run install:all # Cài đặt dependencies backend và frontend
npm run doctor      # Kiểm tra prerequisites cài đặt local
npm run dev         # Chạy backend và frontend cùng nhau
npm test            # Chạy tests backend và build frontend
```

### Backend
```bash
npm run dev      # Chạy với nodemon
npm start        # Chạy với node
npm run seed     # Thêm dữ liệu demo
```

### Frontend
```bash
npm run dev      # Chạy Vite dev server
npm run build    # Build cho production
npm run preview  # Xem trước build production
```

## Xem xét Bảo mật

- Mật khẩu được hash với bcryptjs
- JWT tokens được lưu trong httpOnly cookies
- CORS được cấu hình cho các origins được phép
- Validation tải lên file (type, size)
- Validation input với Zod schemas
- Routes được bảo vệ với authentication middleware
- Role-based access control
