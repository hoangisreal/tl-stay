import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import BookingHold from '../models/BookingHold.js';
import Review from '../models/Review.js';
import { enumerateStayNights } from './availability.js';
import { computeBreakdown } from './pricing.js';

const daysFromNow = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

const u = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

const demoUsers = [
  { key: 'admin', name: 'TL-Stay Admin', email: 'admin@tlstay.com', role: 'admin' },
  { key: 'hostMinh', name: 'Nguyễn Minh', email: 'host@tlstay.com', role: 'host' },
  { key: 'hostLan', name: 'Trần Thị Lan', email: 'lan.host@tlstay.com', role: 'host' },
  { key: 'hostTuan', name: 'Phạm Tuấn', email: 'tuan.host@tlstay.com', role: 'host' },
  { key: 'hostMai', name: 'Hoàng Mai', email: 'mai.host@tlstay.com', role: 'host' },
  { key: 'hostSon', name: 'Lê Sơn', email: 'son.host@tlstay.com', role: 'host' },
  { key: 'guestAn', name: 'Lê Hoàng An', email: 'guest@tlstay.com', role: 'guest' },
  { key: 'guestBinh', name: 'Đỗ Thanh Bình', email: 'binh.guest@tlstay.com', role: 'guest' },
  { key: 'guestChi', name: 'Vũ Linh Chi', email: 'chi.guest@tlstay.com', role: 'guest' },
  { key: 'guestDung', name: 'Nguyễn Quốc Dũng', email: 'dung.guest@tlstay.com', role: 'guest' },
  { key: 'guestHa', name: 'Phạm Thu Hà', email: 'ha.guest@tlstay.com', role: 'guest' },
  { key: 'guestKhoa', name: 'Trần Minh Khoa', email: 'khoa.guest@tlstay.com', role: 'guest' },
  { key: 'guestLinh', name: 'Mai Khánh Linh', email: 'linh.guest@tlstay.com', role: 'guest' },
  { key: 'guestNam', name: 'Bùi Hải Nam', email: 'nam.guest@tlstay.com', role: 'guest' },
];

const demoListings = [
  {
    host: 'hostMinh',
    category: 'beach',
    title: 'Căn hộ view biển Đà Nẵng - Mỹ Khê',
    description:
      'Căn hộ studio hiện đại tại tòa nhà ven biển Mỹ Khê. Ban công rộng, bếp đầy đủ, gần cầu Rồng và phố ăn vặt Trần Phú.',
    pricePerNight: 850000,
    cleaningFee: 100000,
    maxGuests: 4,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Đà Nẵng', address: '123 Võ Nguyên Giáp, Phước Mỹ, Sơn Trà' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Máy giặt', 'Ban công', 'Chỗ đậu xe'],
    images: [u('1582719478250-c89cae4dc85b'), u('1502672260266-1c1ef2d93688'), u('1560448204-e02f11c3d0e2')],
  },
  {
    host: 'hostMinh',
    category: 'pool',
    title: 'Villa hồ bơi riêng - Bãi Dài Nha Trang',
    description:
      'Villa 3 phòng ngủ với hồ bơi riêng hướng biển, sân vườn rộng và khu BBQ. Phù hợp gia đình hoặc nhóm bạn 6-8 người.',
    pricePerNight: 3200000,
    cleaningFee: 350000,
    maxGuests: 8,
    bedrooms: 3,
    beds: 4,
    bathrooms: 3,
    location: { country: 'Việt Nam', city: 'Nha Trang', address: 'Khu Bãi Dài, Cam Lâm, Khánh Hòa' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Hồ bơi', 'Chỗ đậu xe', 'Máy giặt', 'Ban công'],
    images: [u('1568605114967-8130f3a36994'), u('1571896349842-33c89424de2d'), u('1613490493576-7fde63acd811')],
  },
  {
    host: 'hostLan',
    category: 'mountain',
    title: 'Villa thông Đà Lạt - view đồi chè',
    description:
      'Ngôi nhà gỗ giữa rừng thông, có lò sưởi và ban công nhìn xuống đồi chè Cầu Đất. Không gian yên tĩnh cho nghỉ dưỡng.',
    pricePerNight: 1200000,
    cleaningFee: 150000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Đà Lạt', address: '45 Trần Hưng Đạo, Phường 10' },
    amenities: ['WiFi', 'Bếp', 'TV', 'Tủ lạnh', 'Lò vi sóng', 'Ban công', 'Chỗ đậu xe', 'Bàn làm việc'],
    images: [u('1518733057094-95b53143d2a7'), u('1542718610-a1d656d1884c'), u('1520250497591-112f2f40a3f4')],
  },
  {
    host: 'hostLan',
    category: 'design',
    title: 'Homestay phố cổ Hội An - sân gỗ truyền thống',
    description:
      'Nhà cổ 80 năm tuổi đã được phục dựng, nằm trong khu phố cổ. Đi bộ 2 phút đến Chùa Cầu và chợ đêm.',
    pricePerNight: 600000,
    cleaningFee: 80000,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Hội An', address: '8 Nguyễn Thị Minh Khai, Minh An' },
    amenities: ['WiFi', 'Điều hòa', 'TV', 'Tủ lạnh', 'Máy sấy tóc'],
    images: [u('1528127269322-539801943592'), u('1564013799919-ab600027ffc6')],
  },
  {
    host: 'hostTuan',
    category: 'city',
    title: 'Apartment cao cấp Landmark 81 - Sài Gòn',
    description:
      'Căn hộ 2 phòng ngủ tầng cao với view sông Sài Gòn. Tòa nhà có hồ bơi, gym, nhà hàng và trung tâm thương mại.',
    pricePerNight: 2500000,
    cleaningFee: 250000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    location: { country: 'Việt Nam', city: 'Hồ Chí Minh', address: '720A Điện Biên Phủ, Bình Thạnh' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Máy giặt', 'Hồ bơi', 'Bàn làm việc', 'Chỗ đậu xe'],
    images: [u('1522708323590-d24dbb6b0267'), u('1502672023488-70e25813eb80'), u('1560185007-cde436f6a4d0')],
  },
  {
    host: 'hostTuan',
    category: 'lakeside',
    title: 'Studio gần Hồ Tây - Hà Nội',
    description:
      'Studio thiết kế Bắc Âu, ban công ngắm hoàng hôn Hồ Tây. Gần phố Tô Ngọc Vân, nhiều quán cafe và nhà hàng.',
    pricePerNight: 700000,
    cleaningFee: 100000,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Hà Nội', address: '32 Tô Ngọc Vân, Tây Hồ' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Bàn làm việc', 'Máy giặt'],
    images: [u('1522156373667-4c7234bbd804'), u('1505693416388-ac5ce068fe85')],
  },
  {
    host: 'hostMinh',
    category: 'tropical',
    title: 'Bungalow ven biển Phú Quốc',
    description:
      'Bungalow gỗ riêng biệt gần Bãi Sao, có hồ bơi chung và lối đi bộ ra biển. Phù hợp cặp đôi hoặc gia đình nhỏ.',
    pricePerNight: 1500000,
    cleaningFee: 150000,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Phú Quốc', address: 'Bãi Sao, An Thới' },
    amenities: ['WiFi', 'Điều hòa', 'TV', 'Tủ lạnh', 'Hồ bơi', 'Ban công'],
    images: [u('1540541338287-41700207dee6'), u('1571003123894-1f0594d2b5d9')],
  },
  {
    host: 'hostLan',
    category: 'countryside',
    title: 'Nhà sàn Mai Châu - view ruộng bậc thang',
    description:
      'Nhà sàn người Thái truyền thống tại bản Lác, bao gồm bữa tối địa phương và xe đạp khám phá bản làng.',
    pricePerNight: 450000,
    cleaningFee: 50000,
    maxGuests: 6,
    bedrooms: 1,
    beds: 4,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Hòa Bình', address: 'Bản Lác, Mai Châu' },
    amenities: ['WiFi', 'Bếp', 'Ban công'],
    images: [u('1587974928442-77dc3e0dba72'), u('1505144808419-1957a94ca61e')],
  },
  {
    host: 'hostTuan',
    category: 'design',
    title: 'Penthouse view sông Hàn - Đà Nẵng',
    description:
      'Penthouse 3 phòng ngủ có sân thượng riêng, jacuzzi và khu BBQ. View 360 độ toàn cảnh trung tâm Đà Nẵng.',
    pricePerNight: 4000000,
    cleaningFee: 400000,
    maxGuests: 8,
    bedrooms: 3,
    beds: 5,
    bathrooms: 3,
    location: { country: 'Việt Nam', city: 'Đà Nẵng', address: 'Tòa Vinpearl Riverfront, Hải Châu' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Máy giặt', 'Hồ bơi', 'Ban công', 'Chỗ đậu xe', 'Bàn làm việc'],
    images: [u('1512917774080-9991f1c4c750'), u('1600585154340-be6161a56a0c'), u('1600596542815-ffad4c1539a9')],
  },
  {
    host: 'hostMinh',
    category: 'cabin',
    title: 'Cabin Sa Pa - view Fansipan',
    description:
      'Cabin nhỏ trên sườn đồi, nhìn thẳng đỉnh Fansipan vào sáng sớm. Có bàn làm việc, cafe sáng và sân ngắm mây.',
    pricePerNight: 650000,
    cleaningFee: 70000,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Sa Pa', address: '15 Mường Hoa, thị xã Sa Pa, Lào Cai' },
    amenities: ['WiFi', 'TV', 'Bàn làm việc', 'Ban công'],
    images: [u('1551524559-8af4e6624178'), u('1517760444937-f6397edcbbcd')],
  },
  {
    host: 'hostLan',
    category: 'beach',
    title: 'Căn hộ trung tâm Quy Nhơn - view biển',
    description:
      'Căn hộ 1 phòng ngủ ngay đường Xuân Diệu, đi bộ 1 phút ra biển. Khu yên tĩnh, gần quán hải sản địa phương.',
    pricePerNight: 550000,
    cleaningFee: 80000,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Quy Nhơn', address: '88 Xuân Diệu, Trần Phú' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Ban công'],
    images: [u('1564078516393-cf04bd966897'), u('1521783988139-89397d761dce')],
  },
  {
    host: 'hostTuan',
    category: 'city',
    title: 'Loft nghệ sĩ - Quận 3 Sài Gòn',
    description:
      'Loft 2 tầng phong cách industrial, đầy đủ tiện nghi cho khách lưu trú dài ngày. Gần cafe, gallery và tuyến food tour.',
    pricePerNight: 1100000,
    cleaningFee: 120000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    location: { country: 'Việt Nam', city: 'Hồ Chí Minh', address: '24 Nguyễn Đình Chiểu, Quận 3' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Máy giặt', 'Bàn làm việc'],
    images: [u('1502005229762-cf1b2da7c5d6'), u('1493809842364-78817add7ffb')],
  },
  {
    host: 'hostMai',
    category: 'design',
    title: 'Nhà vườn An Bàng - Hội An',
    description:
      'Nhà vườn một tầng với sân hiên rộng, cách biển An Bàng 5 phút đi bộ. Nội thất mây tre, bếp mở và khu đọc sách.',
    pricePerNight: 980000,
    cleaningFee: 120000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    location: { country: 'Việt Nam', city: 'Hội An', address: 'Lô 12 Nguyễn Phan Vinh, Cẩm An' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Ban công', 'Máy sấy tóc'],
    images: [u('1510798831971-661eb04b3739'), u('1484154218962-a197022b5858')],
  },
  {
    host: 'hostMai',
    category: 'mountain',
    title: 'Farmstay Mộc Châu - đồi chè xanh',
    description:
      'Farmstay giữa đồi chè, có bữa sáng nông trại và góc làm việc nhìn ra thung lũng. Không gian mát mẻ quanh năm.',
    pricePerNight: 720000,
    cleaningFee: 70000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 3,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Mộc Châu', address: 'Tiểu khu Pa Khen, Sơn La' },
    amenities: ['WiFi', 'Bếp', 'TV', 'Bàn làm việc', 'Ban công', 'Chỗ đậu xe'],
    images: [u('1500530855697-b586d89ba3ee'), u('1500534314209-a25ddb2bd429')],
  },
  {
    host: 'hostMai',
    category: 'lakeside',
    title: 'Nhà ven hồ Tràng An - Ninh Bình',
    description:
      'Nhà nhỏ ven hồ, sáng có thuyền chèo qua trước hiên. Gần Tràng An, Hang Múa và khu ăn uống địa phương.',
    pricePerNight: 780000,
    cleaningFee: 90000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Ninh Bình', address: 'Xã Ninh Xuân, Hoa Lư' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'Ban công', 'Chỗ đậu xe'],
    images: [u('1506744038136-46273834b3fb'), u('1549880338-65ddcdfd017b')],
  },
  {
    host: 'hostSon',
    category: 'city',
    title: 'Nhà phố cổ Huế - gần Đại Nội',
    description:
      'Nhà phố cải tạo trong hẻm yên tĩnh, đi bộ đến Đại Nội và cầu Trường Tiền. Có xe đạp miễn phí cho khách.',
    pricePerNight: 520000,
    cleaningFee: 60000,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Huế', address: '19 Đặng Thái Thân, Phú Hậu' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Máy giặt'],
    images: [u('1600585154526-990dced4db0d'), u('1554995207-c18c203602cb')],
  },
  {
    host: 'hostSon',
    category: 'countryside',
    title: 'Mekong garden homestay - Cần Thơ',
    description:
      'Homestay trong vườn trái cây ven sông, có tour chợ nổi Cái Răng sáng sớm và bữa tối gia đình miền Tây.',
    pricePerNight: 430000,
    cleaningFee: 50000,
    maxGuests: 5,
    bedrooms: 2,
    beds: 3,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Cần Thơ', address: 'Cồn Sơn, Bình Thủy' },
    amenities: ['WiFi', 'Bếp', 'TV', 'Ban công'],
    images: [u('1520250497591-112f2f40a3f4'), u('1500534314209-a25ddb2bd429')],
  },
  {
    host: 'hostSon',
    category: 'beach',
    title: 'Căn hộ biển Vũng Tàu - Bãi Sau',
    description:
      'Căn hộ 2 phòng ngủ gần Bãi Sau, phù hợp gia đình cuối tuần. Có bếp, máy giặt và chỗ đậu xe trong hầm.',
    pricePerNight: 900000,
    cleaningFee: 100000,
    maxGuests: 5,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    location: { country: 'Việt Nam', city: 'Vũng Tàu', address: '149 Võ Thị Sáu, Thắng Tam' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Máy giặt', 'Chỗ đậu xe'],
    images: [u('1499793983690-e29da59ef1c2'), u('1500530855697-b586d89ba3ee')],
  },
  {
    host: 'hostMai',
    category: 'pool',
    title: 'Resort mini Phan Thiết - hồ bơi xanh',
    description:
      'Cụm phòng nghỉ yên tĩnh có hồ bơi trung tâm, sân nướng BBQ và khu chơi trẻ em. Gần làng chài Mũi Né.',
    pricePerNight: 1350000,
    cleaningFee: 140000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    location: { country: 'Việt Nam', city: 'Phan Thiết', address: '90 Nguyễn Đình Chiểu, Hàm Tiến' },
    amenities: ['WiFi', 'Điều hòa', 'TV', 'Tủ lạnh', 'Hồ bơi', 'Chỗ đậu xe'],
    images: [u('1600607687939-ce8a6c25118c'), u('1566073771259-6a8506099945')],
  },
  {
    host: 'hostMinh',
    category: 'cabin',
    title: 'Cabin suối khoáng Ba Vì',
    description:
      'Cabin gỗ trong khu vườn rộng, gần suối khoáng và đường trekking nhẹ. Có bếp nhỏ, sân lửa trại và bàn làm việc.',
    pricePerNight: 680000,
    cleaningFee: 70000,
    maxGuests: 4,
    bedrooms: 1,
    beds: 3,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Hà Nội', address: 'Xã Vân Hòa, Ba Vì' },
    amenities: ['WiFi', 'Bếp', 'Bàn làm việc', 'Chỗ đậu xe'],
    images: [u('1449158743715-0a90ebb6d2d8'), u('1505693416388-ac5ce068fe85')],
  },
  {
    host: 'hostLan',
    category: 'tropical',
    title: 'Nhà dừa Côn Đảo - gần bãi Đầm Trầu',
    description:
      'Nhà một tầng giữa vườn dừa, cách bãi Đầm Trầu 7 phút đi xe máy. Không gian riêng tư và nhiều góc nghỉ ngoài trời.',
    pricePerNight: 1250000,
    cleaningFee: 120000,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Côn Đảo', address: 'Đường Cỏ Ống, Bà Rịa - Vũng Tàu' },
    amenities: ['WiFi', 'Điều hòa', 'TV', 'Tủ lạnh', 'Ban công'],
    images: [u('1507525428034-b723cf961d3e'), u('1519046904884-53103b34b206')],
  },
  {
    host: 'hostTuan',
    category: 'design',
    title: 'Duplex tối giản Thảo Điền',
    description:
      'Duplex nhiều ánh sáng, nội thất tối giản và bàn làm việc lớn. Phù hợp khách công tác hoặc nhóm nhỏ ở dài ngày.',
    pricePerNight: 1800000,
    cleaningFee: 180000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    location: { country: 'Việt Nam', city: 'Hồ Chí Minh', address: '12 Nguyễn Văn Hưởng, Thảo Điền' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Máy giặt', 'Bàn làm việc'],
    images: [u('1505693416388-ac5ce068fe85'), u('1524758631624-e2822e304c36')],
  },
  {
    host: 'hostSon',
    category: 'mountain',
    title: 'Nhà mây Tà Xùa - săn bình minh',
    description:
      'Nhà gỗ trên sườn núi Tà Xùa, sân hiên rộng để ngắm mây và bình minh. Có bếp chung và tour trekking theo yêu cầu.',
    pricePerNight: 560000,
    cleaningFee: 60000,
    maxGuests: 4,
    bedrooms: 1,
    beds: 3,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Sơn La', address: 'Xã Tà Xùa, Bắc Yên' },
    amenities: ['WiFi', 'Bếp', 'Ban công', 'Chỗ đậu xe'],
    images: [u('1500534314209-a25ddb2bd429'), u('1470770841072-f978cf4d019e')],
  },
  {
    host: 'hostMai',
    category: 'pool',
    title: 'Villa Lăng Cô - hồ bơi sát biển',
    description:
      'Villa 2 phòng ngủ giữa Huế và Đà Nẵng, có hồ bơi riêng, sân cỏ nhỏ và lối đi bộ ra bãi biển Lăng Cô.',
    pricePerNight: 2200000,
    cleaningFee: 220000,
    maxGuests: 6,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    location: { country: 'Việt Nam', city: 'Huế', address: 'Vịnh Lăng Cô, Phú Lộc' },
    amenities: ['WiFi', 'Điều hòa', 'Bếp', 'TV', 'Tủ lạnh', 'Hồ bơi', 'Ban công', 'Chỗ đậu xe'],
    images: [u('1613490493576-7fde63acd811'), u('1568605114967-8130f3a36994')],
  },
  {
    host: 'hostMai',
    category: 'city',
    title: 'Suite phố đi bộ Nguyễn Huệ',
    description:
      'Suite nhỏ ở trung tâm Quận 1, thuận tiện đi bộ đến phố Nguyễn Huệ, Nhà hát Thành phố và các quán ăn đêm.',
    pricePerNight: 1050000,
    cleaningFee: 100000,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    location: { country: 'Việt Nam', city: 'Hồ Chí Minh', address: '42 Nguyễn Huệ, Quận 1' },
    amenities: ['WiFi', 'Điều hòa', 'TV', 'Tủ lạnh', 'Bàn làm việc'],
    images: [u('1502672023488-70e25813eb80'), u('1484154218962-a197022b5858')],
    isActive: false,
  },
  {
    host: 'hostSon',
    category: 'lakeside',
    title: 'Nhà hồ Tuyền Lâm - Đà Lạt',
    description:
      'Nhà riêng gần hồ Tuyền Lâm, có sân vườn, bếp và lối đi dạo quanh rừng thông. Đang tạm ẩn để admin demo bật lại.',
    pricePerNight: 1450000,
    cleaningFee: 150000,
    maxGuests: 5,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    location: { country: 'Việt Nam', city: 'Đà Lạt', address: 'Khu hồ Tuyền Lâm, Phường 4' },
    amenities: ['WiFi', 'Bếp', 'TV', 'Tủ lạnh', 'Ban công', 'Chỗ đậu xe'],
    images: [u('1506744038136-46273834b3fb'), u('1518733057094-95b53143d2a7')],
    isActive: false,
  },
];

const bookingSpecs = [
  ['Căn hộ view biển Đà Nẵng', 'guestAn', 5, 8, 2, 'confirmed'],
  ['Villa hồ bơi riêng', 'guestAn', 20, 23, 6, 'confirmed'],
  ['Homestay phố cổ Hội An', 'guestBinh', 2, 4, 2, 'confirmed'],
  ['Villa thông Đà Lạt', 'guestBinh', 14, 17, 4, 'pending'],
  ['Studio gần Hồ Tây', 'guestChi', 7, 10, 2, 'confirmed'],
  ['Bungalow ven biển Phú Quốc', 'guestChi', 30, 34, 2, 'confirmed'],
  ['Apartment cao cấp Landmark 81', 'guestDung', 40, 43, 4, 'cancelled'],
  ['Cabin Sa Pa', 'guestHa', 9, 12, 2, 'confirmed'],
  ['Nhà vườn An Bàng', 'guestKhoa', 18, 21, 3, 'confirmed'],
  ['Farmstay Mộc Châu', 'guestLinh', 25, 28, 2, 'pending'],
  ['Nhà ven hồ Tràng An', 'guestNam', 32, 35, 3, 'confirmed'],
  ['Nhà phố cổ Huế', 'guestAn', 45, 48, 2, 'confirmed'],
  ['Mekong garden homestay', 'guestBinh', 52, 55, 4, 'confirmed'],
  ['Căn hộ biển Vũng Tàu', 'guestChi', 60, 62, 5, 'confirmed'],
  ['Resort mini Phan Thiết', 'guestDung', 70, 73, 4, 'confirmed'],
  ['Cabin suối khoáng Ba Vì', 'guestHa', 16, 18, 3, 'confirmed'],
  ['Nhà dừa Côn Đảo', 'guestKhoa', 82, 85, 2, 'confirmed'],
  ['Duplex tối giản Thảo Điền', 'guestLinh', 90, 94, 2, 'pending'],
  ['Nhà mây Tà Xùa', 'guestNam', 100, 103, 3, 'confirmed'],
  ['Căn hộ trung tâm Quy Nhơn', 'guestDung', 75, 78, 2, 'confirmed'],
  ['Loft nghệ sĩ', 'guestHa', 110, 113, 2, 'confirmed'],
  ['Penthouse view sông Hàn', 'guestKhoa', 120, 123, 6, 'confirmed'],
  ['Nhà sàn Mai Châu', 'guestLinh', 130, 132, 5, 'confirmed'],
  ['Căn hộ view biển Đà Nẵng', 'guestNam', -95, -92, 2, 'confirmed'],
  ['Villa hồ bơi riêng', 'guestBinh', -85, -82, 5, 'confirmed'],
  ['Homestay phố cổ Hội An', 'guestChi', -78, -76, 2, 'confirmed'],
  ['Villa thông Đà Lạt', 'guestDung', -70, -66, 3, 'confirmed'],
  ['Studio gần Hồ Tây', 'guestHa', -64, -61, 2, 'confirmed'],
  ['Bungalow ven biển Phú Quốc', 'guestKhoa', -58, -54, 2, 'confirmed'],
  ['Apartment cao cấp Landmark 81', 'guestLinh', -52, -49, 4, 'confirmed'],
  ['Cabin Sa Pa', 'guestNam', -46, -43, 2, 'confirmed'],
  ['Nhà vườn An Bàng', 'guestAn', -40, -37, 3, 'confirmed'],
  ['Farmstay Mộc Châu', 'guestBinh', -35, -32, 2, 'confirmed'],
  ['Nhà ven hồ Tràng An', 'guestChi', -30, -27, 3, 'confirmed'],
  ['Nhà phố cổ Huế', 'guestDung', -25, -22, 2, 'confirmed'],
  ['Mekong garden homestay', 'guestHa', -20, -17, 4, 'confirmed'],
  ['Căn hộ biển Vũng Tàu', 'guestKhoa', -16, -13, 5, 'confirmed'],
  ['Resort mini Phan Thiết', 'guestLinh', -12, -9, 4, 'confirmed'],
  ['Cabin suối khoáng Ba Vì', 'guestNam', -8, -5, 3, 'confirmed'],
  ['Nhà dừa Côn Đảo', 'guestAn', -110, -107, 2, 'confirmed'],
  ['Duplex tối giản Thảo Điền', 'guestBinh', -120, -116, 2, 'confirmed'],
  ['Nhà mây Tà Xùa', 'guestChi', -130, -127, 3, 'confirmed'],
  ['Căn hộ trung tâm Quy Nhơn', 'guestDung', -140, -137, 2, 'confirmed'],
  ['Loft nghệ sĩ', 'guestHa', -150, -147, 2, 'confirmed'],
  ['Penthouse view sông Hàn', 'guestKhoa', -160, -156, 6, 'confirmed'],
  ['Nhà sàn Mai Châu', 'guestLinh', -170, -168, 5, 'confirmed'],
  ['Villa Lăng Cô', 'guestNam', -180, -177, 4, 'confirmed'],
  ['Căn hộ view biển Đà Nẵng', 'guestBinh', -30, -28, 2, 'cancelled'],
  ['Suite phố đi bộ Nguyễn Huệ', 'guestNam', -24, -22, 2, 'cancelled'],
];

const reviewTemplates = [
  { rating: 5, comment: 'Phòng sạch sẽ, view đẹp như hình. Chủ nhà thân thiện, hỗ trợ check-in rất nhanh.' },
  { rating: 5, comment: 'Vị trí thuận tiện, đi lại dễ. Nội thất mới và bếp có đủ đồ để nấu bữa nhẹ.' },
  { rating: 4, comment: 'Không gian yên tĩnh, đúng mô tả. WiFi có lúc hơi yếu nhưng tổng thể rất ổn.' },
  { rating: 5, comment: 'Rất đáng tiền, ảnh thật và phòng thơm sạch. Gia đình mình sẽ quay lại.' },
  { rating: 4, comment: 'Host phản hồi nhanh, hướng dẫn chi tiết. Chỗ đậu xe hơi nhỏ nhưng chấp nhận được.' },
  { rating: 5, comment: 'View buổi sáng rất đẹp, tiện nghi đầy đủ. Phù hợp để nghỉ dưỡng cuối tuần.' },
  { rating: 5, comment: 'Khu vực an toàn, gần nhiều quán ăn. Quy trình nhận phòng đơn giản.' },
  { rating: 4, comment: 'Phòng đẹp, điều hòa mát, giường êm. Nên bổ sung thêm khăn tắm dự phòng.' },
  { rating: 5, comment: 'Trải nghiệm tốt hơn mong đợi. Nhà có nhiều góc đẹp để chụp ảnh.' },
  { rating: 4, comment: 'Giá hợp lý so với vị trí. Phòng sạch và đầy đủ tiện nghi cơ bản.' },
  { rating: 5, comment: 'Host chuẩn bị chu đáo, có gợi ý địa điểm ăn uống rất hữu ích.' },
  { rating: 5, comment: 'Không gian riêng tư, phù hợp làm việc từ xa vài ngày. Bàn làm việc thoải mái.' },
  { rating: 4, comment: 'Đường vào hơi nhỏ nhưng nhà rất yên tĩnh. Buổi tối ngủ ngon.' },
  { rating: 5, comment: 'Hồ bơi sạch, khu bếp tiện. Nhóm mình có kỳ nghỉ rất vui.' },
  { rating: 5, comment: 'Gần biển và nhiều dịch vụ xung quanh. Check-out linh hoạt.' },
  { rating: 4, comment: 'Nội thất đẹp, vị trí tốt. Một vài vật dụng bếp nên được thay mới.' },
  { rating: 5, comment: 'Rất phù hợp cho gia đình có trẻ nhỏ. Không gian thoáng và an toàn.' },
  { rating: 5, comment: 'Cảnh quan đẹp, nhân viên hỗ trợ nhiệt tình. Mọi thứ đúng như mô tả.' },
  { rating: 4, comment: 'Phòng sạch, giá tốt. Cách âm ở cửa chính chưa thật sự tốt.' },
  { rating: 5, comment: 'Một trong những homestay tốt nhất mình từng đặt ở khu vực này.' },
  { rating: 5, comment: 'Thiết kế đẹp, nhiều ánh sáng tự nhiên. Rất tiện cho chuyến công tác ngắn.' },
  { rating: 4, comment: 'Vị trí hơi xa trung tâm nhưng bù lại rất yên bình và sạch sẽ.' },
  { rating: 5, comment: 'Chủ nhà thân thiện, hỗ trợ thuê xe và gợi ý lịch trình hợp lý.' },
  { rating: 4, comment: 'Tổng thể tốt, phòng giống ảnh. Nên có thêm ổ cắm gần giường.' },
];

const wishlistSpecs = {
  guestAn: ['Villa hồ bơi riêng', 'Penthouse view sông Hàn', 'Nhà ven hồ Tràng An', 'Nhà dừa Côn Đảo'],
  guestBinh: ['Bungalow ven biển Phú Quốc', 'Farmstay Mộc Châu', 'Duplex tối giản Thảo Điền'],
  guestChi: ['Studio gần Hồ Tây', 'Căn hộ biển Vũng Tàu', 'Nhà phố cổ Huế'],
  guestDung: ['Căn hộ view biển Đà Nẵng', 'Resort mini Phan Thiết', 'Cabin suối khoáng Ba Vì'],
  guestHa: ['Homestay phố cổ Hội An', 'Nhà vườn An Bàng', 'Nhà mây Tà Xùa'],
  guestKhoa: ['Apartment cao cấp Landmark 81', 'Loft nghệ sĩ', 'Cabin Sa Pa'],
  guestLinh: ['Nhà sàn Mai Châu', 'Mekong garden homestay', 'Căn hộ trung tâm Quy Nhơn'],
  guestNam: ['Villa thông Đà Lạt', 'Nhà ven hồ Tràng An', 'Căn hộ biển Vũng Tàu'],
};

const makeRatingDetail = (rating, offset) => Math.max(1, Math.min(5, rating - (offset ? 1 : 0)));

export const seedDemoData = async ({ reset = true, log = true } = {}) => {
  if (reset) {
    await Promise.all([
      User.deleteMany({}),
      Listing.deleteMany({}),
      Booking.deleteMany({}),
      BookingHold.deleteMany({}),
      Review.deleteMany({}),
    ]);
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const users = await User.insertMany(demoUsers.map(({ key, ...user }) => ({ ...user, passwordHash })));
  const userByKey = Object.fromEntries(demoUsers.map((user, index) => [user.key, users[index]]));

  const listings = await Listing.insertMany(
    demoListings.map(({ host, ...listing }) => ({
      ...listing,
      host: userByKey[host]._id,
      isActive: listing.isActive ?? true,
    }))
  );
  const findListing = (titleStart) => {
    const listing = listings.find((item) => item.title.startsWith(titleStart));
    if (!listing) throw new Error(`Seed listing not found: ${titleStart}`);
    return listing;
  };

  const buildBooking = ([titleStart, guestKey, checkInOffset, checkOutOffset, guests, status]) => {
    const listing = findListing(titleStart);
    const breakdown = computeBreakdown(
      daysFromNow(checkInOffset),
      daysFromNow(checkOutOffset),
      listing.pricePerNight,
      listing.cleaningFee
    );
    return {
      listing: listing._id,
      guest: userByKey[guestKey]._id,
      checkIn: daysFromNow(checkInOffset),
      checkOut: daysFromNow(checkOutOffset),
      guests,
      status,
      ...breakdown,
    };
  };

  const bookings = await Booking.insertMany(bookingSpecs.map(buildBooking));
  const holds = bookings
    .filter((booking) => booking.status !== 'cancelled')
    .flatMap((booking) =>
      enumerateStayNights(booking.checkIn, booking.checkOut).map((date) => ({
        listing: booking.listing,
        booking: booking._id,
        date,
      }))
    );
  if (holds.length) await BookingHold.insertMany(holds);

  const pastBookings = bookings.filter((booking) => booking.status !== 'cancelled' && booking.checkOut < new Date());
  const reviews = pastBookings.slice(0, 24).map((booking, index) => {
    const template = reviewTemplates[index % reviewTemplates.length];
    return {
      listing: booking.listing,
      booking: booking._id,
      guest: booking.guest,
      rating: template.rating,
      cleanliness: makeRatingDetail(template.rating, index % 7 === 0),
      accuracy: makeRatingDetail(template.rating, index % 6 === 0),
      checkInRating: makeRatingDetail(template.rating, index % 5 === 0),
      communication: template.rating,
      location: makeRatingDetail(template.rating, index % 8 === 0),
      value: makeRatingDetail(template.rating, index % 4 === 0),
      comment: template.comment,
    };
  });
  await Review.insertMany(reviews);

  const ratingStats = await Review.aggregate([
    { $group: { _id: '$listing', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Promise.all(
    ratingStats.map(({ _id, avg, count }) =>
      Listing.findByIdAndUpdate(_id, {
        avgRating: Math.round(avg * 10) / 10,
        reviewCount: count,
      })
    )
  );

  await Promise.all(
    Object.entries(wishlistSpecs).map(([guestKey, titleStarts]) =>
      User.findByIdAndUpdate(userByKey[guestKey]._id, {
        favoriteListings: titleStarts.map((titleStart) => findListing(titleStart)._id),
      })
    )
  );

  if (log) {
    console.log('Seed completed.');
    console.log(`  Users:    ${await User.countDocuments()}`);
    console.log(`  Listings: ${await Listing.countDocuments()}`);
    console.log(`  Active:   ${await Listing.countDocuments({ isActive: true })}`);
    console.log(`  Bookings: ${await Booking.countDocuments()}`);
    console.log(`  Reviews:  ${await Review.countDocuments()}`);
    console.log('');
    console.log('Demo accounts (password: password123):');
    console.log('  Admin: admin@tlstay.com');
    console.log('  Host:  host@tlstay.com  (Nguyễn Minh)');
    console.log('  Host:  lan.host@tlstay.com  (Trần Thị Lan)');
    console.log('  Host:  tuan.host@tlstay.com  (Phạm Tuấn)');
    console.log('  Host:  mai.host@tlstay.com  (Hoàng Mai)');
    console.log('  Host:  son.host@tlstay.com  (Lê Sơn)');
    console.log('  Guest: guest@tlstay.com  (Lê Hoàng An)');
    console.log('  Guest: binh.guest@tlstay.com  (Đỗ Thanh Bình)');
    console.log('  Guest: chi.guest@tlstay.com  (Vũ Linh Chi)');
  }
};

const runSeed = async () => {
  await connectDB();
  await seedDemoData();
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
