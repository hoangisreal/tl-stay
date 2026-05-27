# Nghiệp vụ theo actor cho TL-Stay

Tài liệu này mô tả phạm vi nghiệp vụ hiện tại của TL-Stay theo 8 actor chính. Các quyền chi tiết được thực thi bằng `role` và `permissions` ở backend.

## Visitor

### Mục tiêu
- Tìm nơi lưu trú phù hợp theo địa điểm, ngày, số khách, giá và category.
- Xem thông tin listing trước khi đăng ký hoặc đăng nhập.

### Quyền
- Xem/search listing active.
- Xem chi tiết listing active, ảnh, tiện nghi, đánh giá, điều kiện đặt phòng.
- Lấy báo giá công khai cho khoảng ngày hợp lệ.

### Màn hình/API liên quan
- `/`
- `/listings/:id`
- `GET /api/listings`
- `GET /api/listings/:id`
- `GET /api/listings/:id/availability`
- `GET /api/bookings/quote`
- `GET /api/reviews/listing/:listingId`

### Luồng nghiệp vụ chính
- Visitor nhập tiêu chí tìm kiếm, hệ thống trả listing active có khả dụng.
- Visitor mở trang chi tiết để xem ảnh, giá, review, bản đồ và điều kiện xác thực guest.
- Visitor chọn đăng ký hoặc đăng nhập khi muốn wishlist, nhắn tin, hoặc đặt phòng.

### Điều kiện lỗi
- Listing inactive hoặc ID không hợp lệ trả lỗi.
- Khoảng ngày không hợp lệ, ngày trong quá khứ, hoặc đêm nghỉ không đúng rule sẽ bị từ chối khi báo giá.

### Dữ liệu được phép xem/sửa
- Xem dữ liệu public của listing, review và availability.
- Không được sửa dữ liệu.

### Gap ngoài phạm vi
- Không có checkout dành cho anonymous user.
- Không có tracking marketing, coupon public hoặc SEO nâng cao.

## Guest

### Mục tiêu
- Quản lý hồ sơ, xác thực demo, wishlist, nhắn tin với host, đặt phòng, thanh toán mock và hủy booking.

### Quyền
- `bookings:create`, `bookings:read`, `bookings:update`
- `messages:read`, `messages:create`
- `reviews:create`, `reviews:read`

### Màn hình/API liên quan
- `/account/profile`
- `/notifications`
- `/wishlist`
- `/my-bookings`
- `/bookings/:id/confirmation`
- `/messages`, `/messages/:id`
- `PATCH /api/auth/me/profile`
- `PATCH /api/auth/me/verification`
- `GET/PATCH /api/notifications`
- `POST /api/bookings`
- `POST /api/bookings/:id/payments/mock`
- `PATCH /api/bookings/:id/cancel`
- `POST /api/reviews`

### Luồng nghiệp vụ chính
- Guest cập nhật tên, số điện thoại, avatar và preferences.
- Guest bật xác thực demo cho email/phone/ID, sau đó đặt được listing có `guestRequirements`.
- Guest tạo booking, hệ thống giữ ngày, tạo payment intent mock và gửi notification.
- Guest thanh toán mock thành công/thất bại, hủy booking theo policy, xem notification và đánh dấu đã đọc.
- Guest nhắn tin với host và đánh giá booking đủ điều kiện.

### Điều kiện lỗi
- Không được đổi email, role hoặc permissions qua profile API.
- Không được tự gỡ xác thực đã bật.
- Không đặt được listing inactive, ngày trùng, quá số khách, hoặc thiếu verification.
- Không xem/sửa booking, conversation hoặc notification của user khác.

### Dữ liệu được phép xem/sửa
- Xem/sửa hồ sơ cá nhân giới hạn ở `name`, `phone`, `avatarUrl`, `preferences.language`, `preferences.currency`.
- Xem booking, wishlist, conversation, review pending và notification của chính mình.
- Không xem dữ liệu quản trị hoặc dữ liệu guest khác.

### Gap ngoài phạm vi
- Xác thực email/SMS/KYC thật.
- Payment provider thật, refund provider thật.
- Push notification hoặc realtime WebSocket.

## Host

### Mục tiêu
- Quản lý listing, lịch khả dụng, giá, điều kiện guest, booking đến, tin nhắn và analytics của chính host.

### Quyền
- `listings:create`, `listings:read`, `listings:update`, `listings:delete`
- `bookings:read`
- `messages:read`, `messages:create`
- `reviews:read`

### Màn hình/API liên quan
- `/host/dashboard`
- `/host/bookings`
- `/messages`, `/messages/:id`
- `/notifications`
- `GET /api/listings/host/me`
- `POST /api/listings`
- `PUT /api/listings/:id`
- `DELETE /api/listings/:id`
- `GET /api/bookings/host`
- `PATCH /api/bookings/:id/cancel`
- `GET /api/analytics/host`

### Luồng nghiệp vụ chính
- Host tạo/cập nhật listing với ảnh, tiện nghi, giá, rule ngày, policy hủy và guest requirements.
- Host xem bookings đến, hủy booking khi cần, và trao đổi qua messages.
- Host dashboard hiển thị analytics thật: số listing active, tổng booking, doanh thu paid/confirmed, rating trung bình.
- Host nhận notification khi booking/payment/cancel/refund thay đổi.

### Điều kiện lỗi
- Host chỉ sửa listing thuộc sở hữu của mình.
- Listing có booking history khi xóa sẽ chuyển inactive để giữ lịch sử.
- Host không truy cập analytics tổng hệ thống hoặc dữ liệu host khác.

### Dữ liệu được phép xem/sửa
- Xem/sửa listing của mình.
- Xem bookings và conversations liên quan listing của mình.
- Xem notification của mình.

### Gap ngoài phạm vi
- Đồng bộ lịch OTA/iCal.
- Payout thật cho host.
- Công cụ quản lý giá tự động.

## Admin

### Mục tiêu
- Quản trị toàn hệ thống, người dùng, vai trò, xác thực, listing, booking, review, messages, analytics và activity logs.

### Quyền
- `*`

### Màn hình/API liên quan
- `/admin`
- `/analytics`
- `/activity-logs`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/verify`
- `GET/PATCH /api/admin/listings`
- `GET/PATCH /api/admin/bookings`
- `GET/DELETE /api/admin/reviews`
- `GET /api/admin/messages`
- `GET /api/admin/activity-logs`
- `GET /api/analytics/*`

### Luồng nghiệp vụ chính
- Admin xem thống kê, phân trang dữ liệu và thao tác quản trị theo từng tab.
- Admin đổi role user, verify user, ẩn/hiện listing, hủy booking, xóa review.
- Admin xem analytics tổng, revenue theo tháng, bookings by status, top listings.
- Admin lọc activity logs theo action, resource và user.

### Điều kiện lỗi
- Admin không được tự gỡ admin role của chính mình.
- Các API vẫn validate ID, pagination và payload.

### Dữ liệu được phép xem/sửa
- Xem toàn bộ dữ liệu quản trị.
- Sửa role, verification, trạng thái listing, trạng thái booking và review moderation.

### Gap ngoài phạm vi
- Export audit logs.
- Quản trị cấu hình phí/thuế động.
- Workflow phê duyệt nhiều bước.

## Customer Support

### Mục tiêu
- Hỗ trợ khách với tài khoản, xác thực, booking và tin nhắn.

### Quyền
- `users:read`, `users:verify`
- `bookings:read`, `bookings:update`
- `messages:read`, `messages:create`
- `reviews:read`

### Màn hình/API liên quan
- `/staff`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/verify`
- `GET /api/admin/bookings`
- `PATCH /api/admin/bookings/:id/cancel`
- `GET /api/admin/messages`
- `GET /api/admin/reviews`

### Luồng nghiệp vụ chính
- Support tra cứu user, kiểm tra booking/message, hỗ trợ verify demo và hủy booking theo yêu cầu.

### Điều kiện lỗi
- Không được đổi role user.
- Không quản lý listing hoặc analytics nếu thiếu permission.

### Dữ liệu được phép xem/sửa
- Xem user, booking, message, review.
- Sửa verification và booking cancel/refund action theo permission.

### Gap ngoài phạm vi
- Ticketing system, SLA, canned responses.
- Ghi chú nội bộ cho hồ sơ support.

## Content Moderator

### Mục tiêu
- Kiểm duyệt listing, review và messages để bảo vệ chất lượng nội dung.

### Quyền
- `listings:read`, `listings:update`
- `reviews:read`, `reviews:delete`
- `messages:read`

### Màn hình/API liên quan
- `/staff`
- `GET /api/admin/listings`
- `PATCH /api/admin/listings/:id/status`
- `GET /api/admin/reviews`
- `DELETE /api/admin/reviews/:id`
- `GET /api/admin/messages`

### Luồng nghiệp vụ chính
- Moderator xem listing và ẩn/hiện nội dung vi phạm.
- Moderator xem review, xóa review không phù hợp và xem message khi cần điều tra.

### Điều kiện lỗi
- Không xem users/bookings/analytics nếu thiếu permission.
- Không đổi role hoặc verify user.

### Dữ liệu được phép xem/sửa
- Xem listing, review, message phục vụ moderation.
- Sửa trạng thái listing và xóa review.

### Gap ngoài phạm vi
- Hàng đợi report/appeal.
- Phân loại vi phạm tự động.

## Finance Manager

### Mục tiêu
- Theo dõi bookings, doanh thu và số liệu tài chính.

### Quyền
- `bookings:read`
- `users:read`
- `analytics:read`

### Màn hình/API liên quan
- `/staff`
- `/analytics`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/bookings`
- `GET /api/analytics/overview`
- `GET /api/analytics/revenue`
- `GET /api/analytics/bookings-by-status`

### Luồng nghiệp vụ chính
- Finance xem booking và user liên quan, kiểm tra revenue, booking status mix và dashboard analytics.

### Điều kiện lỗi
- Không hủy booking, không ẩn listing, không xóa review.
- Không xem activity logs.

### Dữ liệu được phép xem/sửa
- Xem user, booking và analytics.
- Không sửa dữ liệu nghiệp vụ.

### Gap ngoài phạm vi
- Đối soát payment provider thật.
- Payout, invoice, tax export.

## Operations Manager

### Mục tiêu
- Điều phối vận hành listing, booking, users, verification, review, messages và analytics.

### Quyền
- `listings:read`, `listings:update`
- `bookings:read`, `bookings:update`
- `users:read`, `users:verify`
- `reviews:read`
- `messages:read`
- `analytics:read`

### Màn hình/API liên quan
- `/staff`
- `/analytics`
- `GET /api/admin/stats`
- `GET/PATCH /api/admin/listings`
- `GET/PATCH /api/admin/bookings`
- `GET/PATCH /api/admin/users/:id/verify`
- `GET /api/admin/reviews`
- `GET /api/admin/messages`
- `GET /api/analytics/*`

### Luồng nghiệp vụ chính
- Operations theo dõi dashboard vận hành, xử lý listing visibility, booking cancel/refund action và verification.
- Operations xem analytics để nắm sức khỏe vận hành.

### Điều kiện lỗi
- Không đổi role user.
- Không xóa review nếu không có permission.
- Không xem activity logs trong permission matrix hiện tại.

### Dữ liệu được phép xem/sửa
- Xem/sửa listing status, booking status action và verification.
- Xem users, reviews, messages, analytics.

### Gap ngoài phạm vi
- Workflow phân ca, assignment, checklist vận hành.
- Audit export và dashboard SLA.
