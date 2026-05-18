import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import { computeBreakdown } from './pricing.js';

const daysFromNow = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

const u = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Listing.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
  ]);

  const password = await bcrypt.hash('password123', 10);

  const [hostMinh, hostLan, hostTuan, guestAn, guestBinh, guestChi] = await User.insertMany([
    { name: 'Nguyễn Minh', email: 'host@tlstay.com', passwordHash: password, role: 'host' },
    { name: 'Trần Thị Lan', email: 'lan.host@tlstay.com', passwordHash: password, role: 'host' },
    { name: 'Phạm Tuấn', email: 'tuan.host@tlstay.com', passwordHash: password, role: 'host' },
    { name: 'Lê Hoàng An', email: 'guest@tlstay.com', passwordHash: password, role: 'guest' },
    { name: 'Đỗ Thanh Bình', email: 'binh.guest@tlstay.com', passwordHash: password, role: 'guest' },
    { name: 'Vũ Linh Chi', email: 'chi.guest@tlstay.com', passwordHash: password, role: 'guest' },
  ]);

  const listingsData = [
    {
      host: hostMinh._id, category: 'beach',
      title: 'Căn hộ view biển Đà Nẵng — Mỹ Khê',
      description:
        'Căn hộ studio hiện đại tại tòa nhà Sun Apartment, view biển Mỹ Khê 180°. Đầy đủ tiện nghi, ban công rộng, gần cầu Rồng và phố ăn vặt Trần Phú.',
      pricePerNight: 850000, cleaningFee: 100000,
      maxGuests: 4, bedrooms: 1, beds: 2, bathrooms: 1,
      location: { country: 'Việt Nam', city: 'Đà Nẵng', address: '123 Võ Nguyên Giáp, Phước Mỹ, Sơn Trà' },
      amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Máy giặt', 'Ban công', 'Chỗ đậu xe'],
      images: [u('1582719478250-c89cae4dc85b'), u('1502672260266-1c1ef2d93688'), u('1560448204-e02f11c3d0e2')],
    },
    {
      host: hostMinh._id, category: 'pool',
      title: 'Villa hồ bơi riêng — Bãi Dài Nha Trang',
      description:
        'Villa 3 phòng ngủ với hồ bơi vô cực hướng biển, sân vườn 200m², bếp đầy đủ. Phù hợp cho gia đình hoặc nhóm bạn 6-8 người. Cách sân bay Cam Ranh 15 phút.',
      pricePerNight: 3200000, cleaningFee: 350000,
      maxGuests: 8, bedrooms: 3, beds: 4, bathrooms: 3,
      location: { country: 'Việt Nam', city: 'Nha Trang', address: 'Khu Bãi Dài, Cam Lâm, Khánh Hòa' },
      amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Hồ bơi', 'Chỗ đậu xe', 'Máy giặt', 'Ban công'],
      images: [u('1568605114967-8130f3a36994'), u('1571896349842-33c89424de2d'), u('1613490493576-7fde63acd811')],
    },
    {
      host: hostLan._id, category: 'mountain',
      title: 'Villa thông Đà Lạt — view đồi chè',
      description:
        'Ngôi nhà gỗ nhỏ xinh giữa rừng thông, lò sưởi, ban công view đồi chè Cầu Đất. Rất yên tĩnh, lý tưởng cho cặp đôi muốn nghỉ dưỡng.',
      pricePerNight: 1200000, cleaningFee: 150000,
      maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1,
      location: { country: 'Việt Nam', city: 'Đà Lạt', address: '45 Trần Hưng Đạo, Phường 10' },
      amenities: ['WiFi', 'Bếp', 'TV', 'Tủ lạnh', 'Lò vi sóng', 'Ban công', 'Chỗ đậu xe', 'Bàn làm việc'],
      images: [u('1518733057094-95b53143d2a7'), u('1542718610-a1d656d1884c'), u('1520250497591-112f2f40a3f4')],
    },
    {
      host: hostLan._id, category: 'design',
      title: 'Homestay phố cổ Hội An — sân gỗ truyền thống',
      description:
        'Nhà cổ 80 năm tuổi đã được restore, ngay lòng phố cổ. Đi bộ 2 phút đến Chùa Cầu, gần chợ đêm. Tặng vé tham quan phố cổ.',
      pricePerNight: 600000, cleaningFee: 80000,
      maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
      location: { country: 'Việt Nam', city: 'Hội An', address: '8 Nguyễn Thị Minh Khai, Minh An' },
      amenities: ['WiFi', 'Điều hòa', 'TV', 'Tủ lạnh', 'Máy sấy tóc'],
      images: [u('1528127269322-539801943592'), u('1564013799919-ab600027ffc6')],
    },
    {
      host: hostTuan._id, category: 'city',
      title: 'Apartment cao cấp Landmark 81 — Sài Gòn',
      description:
        'Căn hộ 2PN tại tầng 50 toà Landmark 81, view sông Sài Gòn cực ngoạn. Hồ bơi tầng cao, gym, nhà hàng có sẵn trong tòa nhà.',
      pricePerNight: 2500000, cleaningFee: 250000,
      maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
      location: { country: 'Việt Nam', city: 'Hồ Chí Minh', address: '720A Điện Biên Phủ, Bình Thạnh' },
      amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Máy giặt', 'Hồ bơi', 'Bàn làm việc', 'Chỗ đậu xe'],
      images: [u('1522708323590-d24dbb6b0267'), u('1502672023488-70e25813eb80'), u('1560185007-cde436f6a4d0')],
    },
    {
      host: hostTuan._id, category: 'lakeside',
      title: 'Studio gần Hồ Tây — Hà Nội',
      description:
        'Studio thiết kế Bắc Âu, ban công ngắm hoàng hôn Hồ Tây. Gần phố Tô Ngọc Vân, nhiều quán cafe và nhà hàng. Phù hợp cặp đôi hoặc khách công tác.',
      pricePerNight: 700000, cleaningFee: 100000,
      maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
      location: { country: 'Việt Nam', city: 'Hà Nội', address: '32 Tô Ngọc Vân, Tây Hồ' },
      amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Bàn làm việc', 'Máy giặt'],
      images: [u('1522156373667-4c7234bbd804'), u('1505693416388-ac5ce068fe85')],
    },
    {
      host: hostMinh._id, category: 'tropical',
      title: 'Bungalow ven biển Phú Quốc',
      description:
        'Bungalow gỗ riêng biệt ngay bãi Sao, cát trắng và nước biển trong xanh. Tặng bữa sáng và 1 lần massage chân.',
      pricePerNight: 1500000, cleaningFee: 150000,
      maxGuests: 3, bedrooms: 1, beds: 2, bathrooms: 1,
      location: { country: 'Việt Nam', city: 'Phú Quốc', address: 'Bãi Sao, An Thới' },
      amenities: ['WiFi', 'Điều hòa', 'TV', 'Tủ lạnh', 'Hồ bơi', 'Ban công'],
      images: [u('1540541338287-41700207dee6'), u('1571003123894-1f0594d2b5d9')],
    },
    {
      host: hostLan._id, category: 'countryside',
      title: 'Nhà sàn Mai Châu — view ruộng bậc thang',
      description:
        'Nhà sàn người Thái truyền thống tại bản Lác, Mai Châu. Bao gồm bữa tối với cơm lam, gà nướng. Có thể thuê xe đạp khám phá bản làng.',
      pricePerNight: 450000, cleaningFee: 50000,
      maxGuests: 6, bedrooms: 1, beds: 4, bathrooms: 1,
      location: { country: 'Việt Nam', city: 'Hòa Bình', address: 'Bản Lác, Mai Châu' },
      amenities: ['WiFi', 'Bếp', 'Ban công'],
      images: [u('1587974928442-77dc3e0dba72'), u('1505144808419-1957a94ca61e')],
    },
    {
      host: hostTuan._id, category: 'design',
      title: 'Penthouse view sông Hàn — Đà Nẵng',
      description:
        'Penthouse 3PN view 360° toàn cảnh Đà Nẵng. Có sân thượng riêng, jacuzzi, BBQ. Phù hợp gia đình lớn hoặc team building nhỏ.',
      pricePerNight: 4000000, cleaningFee: 400000,
      maxGuests: 8, bedrooms: 3, beds: 5, bathrooms: 3,
      location: { country: 'Việt Nam', city: 'Đà Nẵng', address: 'Tòa Vinpearl Riverfront, Hải Châu' },
      amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Máy giặt', 'Hồ bơi', 'Ban công', 'Chỗ đậu xe', 'Bàn làm việc'],
      images: [u('1512917774080-9991f1c4c750'), u('1600585154340-be6161a56a0c'), u('1600596542815-ffad4c1539a9')],
    },
    {
      host: hostMinh._id, category: 'cabin',
      title: 'Phòng tập thể Sa Pa — view Fansipan',
      description:
        'Phòng dorm 6 giường tầng cho khách du lịch bụi. View thẳng đỉnh Fansipan vào sáng sớm. Kèm cafe sáng + tour thị trấn miễn phí.',
      pricePerNight: 250000, cleaningFee: 30000,
      maxGuests: 6, bedrooms: 1, beds: 6, bathrooms: 2,
      location: { country: 'Việt Nam', city: 'Sa Pa', address: '15 Mường Hoa, thị xã Sa Pa, Lào Cai' },
      amenities: ['WiFi', 'TV', 'Bàn làm việc'],
      images: [u('1551524559-8af4e6624178'), u('1517760444937-f6397edcbbcd')],
    },
    {
      host: hostLan._id, category: 'beach',
      title: 'Căn hộ trung tâm Quy Nhơn — view biển',
      description:
        'Căn hộ 1PN ngay đường Xuân Diệu, đi bộ 1 phút ra biển Quy Nhơn. Khu yên tĩnh, gần quán hải sản giá tốt.',
      pricePerNight: 550000, cleaningFee: 80000,
      maxGuests: 3, bedrooms: 1, beds: 2, bathrooms: 1,
      location: { country: 'Việt Nam', city: 'Quy Nhơn', address: '88 Xuân Diệu, Trần Phú' },
      amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Ban công'],
      images: [u('1564078516393-cf04bd966897'), u('1521783988139-89397d761dce')],
    },
    {
      host: hostTuan._id, category: 'city',
      title: 'Loft nghệ sĩ — Quận 3 Sài Gòn',
      description:
        'Loft 2 tầng được decor theo phong cách industrial, đầy đủ tiện nghi cho khách lưu trú dài ngày. Khu vực nhiều cafe, gallery, food tour.',
      pricePerNight: 1100000, cleaningFee: 120000,
      maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
      location: { country: 'Việt Nam', city: 'Hồ Chí Minh', address: '24 Nguyễn Đình Chiểu, Quận 3' },
      amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Máy giặt', 'Bàn làm việc'],
      images: [u('1502005229762-cf1b2da7c5d6'), u('1493809842364-78817add7ffb')],
    },
  ];

  const listings = await Listing.insertMany(listingsData);
  const findListing = (titleStart) => listings.find((l) => l.title.startsWith(titleStart));

  const buildBooking = (listing, guest, checkIn, checkOut, guests, status) => {
    const breakdown = computeBreakdown(checkIn, checkOut, listing.pricePerNight, listing.cleaningFee);
    return { listing: listing._id, guest, checkIn, checkOut, guests, status, ...breakdown };
  };

  const bookingsData = [
    buildBooking(findListing('Căn hộ view biển Đà Nẵng'), guestAn._id, daysFromNow(5), daysFromNow(8), 2, 'confirmed'),
    buildBooking(findListing('Villa hồ bơi'), guestAn._id, daysFromNow(20), daysFromNow(23), 6, 'confirmed'),
    buildBooking(findListing('Homestay phố cổ Hội An'), guestBinh._id, daysFromNow(2), daysFromNow(4), 2, 'confirmed'),
    buildBooking(findListing('Villa thông Đà Lạt'), guestBinh._id, daysFromNow(14), daysFromNow(17), 4, 'pending'),
    buildBooking(findListing('Studio gần Hồ Tây'), guestChi._id, daysFromNow(7), daysFromNow(10), 2, 'confirmed'),
    buildBooking(findListing('Bungalow ven biển Phú Quốc'), guestChi._id, daysFromNow(30), daysFromNow(34), 2, 'confirmed'),
    buildBooking(findListing('Apartment cao cấp Landmark 81'), guestBinh._id, daysFromNow(40), daysFromNow(43), 4, 'cancelled'),
    buildBooking(findListing('Phòng tập thể Sa Pa'), guestChi._id, daysFromNow(-10), daysFromNow(-7), 1, 'confirmed'),
    buildBooking(findListing('Villa thông Đà Lạt'), guestAn._id, daysFromNow(-30), daysFromNow(-26), 3, 'confirmed'),
    buildBooking(findListing('Penthouse view sông Hàn'), guestBinh._id, daysFromNow(-20), daysFromNow(-15), 6, 'confirmed'),
    buildBooking(findListing('Loft nghệ sĩ'), guestChi._id, daysFromNow(-45), daysFromNow(-42), 2, 'confirmed'),
    buildBooking(findListing('Căn hộ trung tâm Quy Nhơn'), guestAn._id, daysFromNow(-15), daysFromNow(-12), 2, 'confirmed'),
  ];

  const bookings = await Booking.insertMany(bookingsData);

  const reviewsTemplates = [
    { rating: 5, comment: 'Phòng sạch sẽ, view đẹp như hình. Chủ nhà thân thiện, hỗ trợ nhiệt tình. Sẽ quay lại!' },
    { rating: 5, comment: 'Trải nghiệm tuyệt vời. Vị trí thuận tiện, gần biển và quán ăn ngon.' },
    { rating: 4, comment: 'Phòng đẹp, đầy đủ tiện nghi. WiFi hơi yếu nhưng nhìn chung rất ổn.' },
    { rating: 5, comment: 'Rất đáng tiền. Decor xinh, ảnh đẹp. Host check-in nhanh.' },
    { rating: 4, comment: 'Sạch và yên tĩnh. Buổi sáng dậy view rất chill. Recommend.' },
  ];

  const pastBookings = bookings.filter((b) => b.status !== 'cancelled' && b.checkOut < new Date());
  const reviews = pastBookings.slice(0, 5).map((b, i) => {
    const t = reviewsTemplates[i % reviewsTemplates.length];
    return {
      listing: b.listing,
      booking: b._id,
      guest: b.guest,
      rating: t.rating,
      cleanliness: t.rating, accuracy: t.rating, checkInRating: t.rating,
      communication: t.rating, location: t.rating, value: t.rating - (t.rating === 5 ? 0 : 0),
      comment: t.comment,
    };
  });
  await Review.insertMany(reviews);

  for (const r of reviews) {
    const stats = await Review.aggregate([
      { $match: { listing: r.listing } },
      { $group: { _id: '$listing', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const { avg = 0, count = 0 } = stats[0] || {};
    await Listing.findByIdAndUpdate(r.listing, {
      avgRating: Math.round(avg * 10) / 10,
      reviewCount: count,
    });
  }

  await User.findByIdAndUpdate(guestAn._id, {
    favoriteListings: [
      findListing('Villa hồ bơi')._id,
      findListing('Penthouse view sông Hàn')._id,
      findListing('Villa thông Đà Lạt')._id,
    ],
  });
  await User.findByIdAndUpdate(guestBinh._id, {
    favoriteListings: [findListing('Bungalow ven biển Phú Quốc')._id],
  });

  console.log('Seed completed.');
  console.log(`  Users:    ${await User.countDocuments()}`);
  console.log(`  Listings: ${await Listing.countDocuments()}`);
  console.log(`  Bookings: ${await Booking.countDocuments()}`);
  console.log(`  Reviews:  ${await Review.countDocuments()}`);
  console.log('');
  console.log('Demo accounts (password: password123):');
  console.log('  Host:  host@tlstay.com  (Nguyễn Minh)');
  console.log('  Host:  lan.host@tlstay.com  (Trần Thị Lan)');
  console.log('  Host:  tuan.host@tlstay.com  (Phạm Tuấn)');
  console.log('  Guest: guest@tlstay.com  (Lê Hoàng An)');
  console.log('  Guest: binh.guest@tlstay.com  (Đỗ Thanh Bình)');
  console.log('  Guest: chi.guest@tlstay.com  (Vũ Linh Chi)');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
