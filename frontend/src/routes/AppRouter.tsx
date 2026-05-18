import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.tsx';
import ProtectedRoute from './ProtectedRoute.tsx';
import RoleRoute from './RoleRoute.tsx';
import HomePage from '../pages/HomePage.tsx';
import LoginPage from '../pages/LoginPage.tsx';
import RegisterPage from '../pages/RegisterPage.tsx';
import ListingDetailsPage from '../pages/ListingDetailsPage.tsx';
import HostDashboardPage from '../pages/HostDashboardPage.tsx';
import MyBookingsPage from '../pages/MyBookingsPage.tsx';
import HostBookingsPage from '../pages/HostBookingsPage.tsx';
import BookingConfirmationPage from '../pages/BookingConfirmationPage.tsx';
import NotFoundPage from '../pages/NotFoundPage.tsx';
import ErrorPage from '../pages/ErrorPage.tsx';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/listings/:id" element={<ListingDetailsPage />} />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/dashboard"
            element={
              <RoleRoute role="host">
                <HostDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/host/bookings"
            element={
              <RoleRoute role="host">
                <HostBookingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/bookings/:id/confirmation"
            element={
              <ProtectedRoute>
                <BookingConfirmationPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
