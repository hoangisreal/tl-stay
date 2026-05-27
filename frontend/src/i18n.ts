import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  vi: {
    translation: {
      nav: {
        home: 'Trang chủ',
        myListings: 'Listings của tôi',
        myBookings: 'Đặt phòng của tôi',
        wishlist: 'Yêu thích',
        inbox: 'Tin nhắn',
        admin: 'Quản trị',
        login: 'Đăng nhập',
        register: 'Đăng ký',
        logout: 'Đăng xuất',
      },
      search: {
        location: 'Địa điểm',
        checkIn: 'Nhận phòng',
        checkOut: 'Trả phòng',
        guests: 'Khách',
        search: 'Tìm kiếm',
      },
      listing: {
        perNight: '/đêm',
        guests: 'khách',
        bedrooms: 'phòng ngủ',
        beds: 'giường',
        bathrooms: 'phòng tắm',
        amenities: 'Tiện nghi',
        reviews: 'đánh giá',
      },
      booking: {
        bookNow: 'Đặt ngay',
        totalPrice: 'Tổng cộng',
        nights: 'đêm',
        cleaningFee: 'Phí dọn dẹp',
        serviceFee: 'Phí dịch vụ',
        tax: 'Thuế',
      },
    },
  },
  en: {
    translation: {
      nav: {
        home: 'Home',
        myListings: 'My Listings',
        myBookings: 'My Bookings',
        wishlist: 'Wishlist',
        inbox: 'Inbox',
        admin: 'Admin',
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
      },
      search: {
        location: 'Location',
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        guests: 'Guests',
        search: 'Search',
      },
      listing: {
        perNight: '/night',
        guests: 'guests',
        bedrooms: 'bedrooms',
        beds: 'beds',
        bathrooms: 'bathrooms',
        amenities: 'Amenities',
        reviews: 'reviews',
      },
      booking: {
        bookNow: 'Book Now',
        totalPrice: 'Total',
        nights: 'nights',
        cleaningFee: 'Cleaning fee',
        serviceFee: 'Service fee',
        tax: 'Tax',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    supportedLngs: ['vi', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
