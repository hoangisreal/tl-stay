# TL-Stay

Homestay booking website (Airbnb-style) — đồ án học phần.

## Tech Stack
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Zustand

## Cấu trúc project

```
tl-stay/
  backend/    Express API
  frontend/   React + TypeScript
```

## Cài đặt & chạy

### 1. Clone và cài dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Cấu hình môi trường

```bash
# backend/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/tl-stay
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173

# frontend/.env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed dữ liệu mẫu (tuỳ chọn)

```bash
cd backend
npm run seed
```

Tài khoản mẫu sau khi seed:
- **Host:** host@tlstay.com / password123
- **Guest:** guest@tlstay.com / password123

### 4. Chạy project

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api

## Tính năng

- **Đăng ký / Đăng nhập** (Guest / Host)
- **Tìm kiếm & Lọc** phòng (địa điểm, ngày, giá, số khách)
- **CRUD listings** dành cho Host (tạo/sửa/xoá phòng, upload ảnh)
- **Đặt phòng** với kiểm tra lịch trùng
- **Quản lý đặt phòng** (Guest: xem + huỷ, Host: xem đặt phòng từ khách)
