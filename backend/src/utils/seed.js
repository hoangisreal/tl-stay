import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';

const seedData = async () => {
  await connectDB();

  await User.deleteMany({});
  await Listing.deleteMany({});
  await Booking.deleteMany({});

  const hostHash = await bcrypt.hash('password123', 10);
  const guestHash = await bcrypt.hash('password123', 10);

  const host = await User.create({
    name: 'Nguyễn Văn Host',
    email: 'host@tlstay.com',
    passwordHash: hostHash,
    role: 'host',
  });
  const guest = await User.create({
    name: 'Trần Thị Guest',
    email: 'guest@tlstay.com',
    passwordHash: guestHash,
    role: 'guest',
  });

  const listings = await Listing.insertMany([
    {
      host: host._id,
      title: 'Căn hộ view biển Đà Nẵng',
      description: 'Căn hộ hiện đại với view biển tuyệt đẹp, đầy đủ tiện nghi cho gia đình hoặc nhóm bạn.',
      pricePerNight: 850000,
      maxGuests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 1,
      location: { country: 'Việt Nam', city: 'Đà Nẵng', address: '123 Võ Nguyên Giáp' },
      amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh'],
      images: [],
    },
    {
      host: host._id,
      title: 'Villa yên tĩnh Đà Lạt',
      description: 'Villa nhỏ xinh giữa vườn hoa Đà Lạt, không gian lãng mạn và bình yên.',
      pricePerNight: 1200000,
      maxGuests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2,
      location: { country: 'Việt Nam', city: 'Đà Lạt', address: '45 Trần Phú' },
      amenities: ['WiFi', 'Bếp', 'Ban công', 'Chỗ đậu xe', 'Lò vi sóng'],
      images: [],
    },
    {
      host: host._id,
      title: 'Homestay phố cổ Hội An',
      description: 'Nhà gỗ truyền thống ngay giữa phố cổ Hội An, đi bộ đến mọi điểm tham quan.',
      pricePerNight: 600000,
      maxGuests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      location: { country: 'Việt Nam', city: 'Hội An', address: '8 Nguyễn Thị Minh Khai' },
      amenities: ['WiFi', 'Điều hòa', 'TV'],
      images: [],
    },
  ]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);

  await Booking.create({
    listing: listings[0]._id,
    guest: guest._id,
    checkIn: tomorrow,
    checkOut: dayAfter,
    guests: 2,
    totalPrice: 1700000,
    status: 'confirmed',
  });

  console.log('Seed completed!');
  console.log('Host login: host@tlstay.com / password123');
  console.log('Guest login: guest@tlstay.com / password123');
  process.exit(0);
};

seedData().catch((err) => { console.error(err); process.exit(1); });
