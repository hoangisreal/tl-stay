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
import WishlistPage from '../pages/WishlistPage.tsx';
import NotFoundPage from '../pages/NotFoundPage.tsx';
import ErrorPage from '../pages/ErrorPage.tsx';
import AdminPanelPage from '../pages/AdminPanelPage.tsx';
import ForgotPasswordPage from '../pages/ForgotPasswordPage.tsx';
import ResetPasswordPage from '../pages/ResetPasswordPage.tsx';
import ChangePasswordPage from '../pages/ChangePasswordPage.tsx';
import AccountProfilePage from '../pages/AccountProfilePage.tsx';
import NotificationsPage from '../pages/NotificationsPage.tsx';
import MessagesPage from '../pages/MessagesPage.tsx';
import ConversationPage from '../pages/ConversationPage.tsx';
import StaffDashboard from '../components/StaffDashboard.tsx';
import AnalyticsDashboard from '../components/AnalyticsDashboard.tsx';
import ActivityLogViewer from '../components/ActivityLogViewer.tsx';

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
            path="/wishlist"
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:id"
            element={
              <ProtectedRoute>
                <ConversationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/profile"
            element={
              <ProtectedRoute>
                <AccountProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
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
            path="/admin"
            element={
              <RoleRoute role="admin">
                <AdminPanelPage />
              </RoleRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <RoleRoute roles={['customer_support', 'content_moderator', 'finance_manager', 'operations_manager']}>
                <StaffDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <RoleRoute roles={['admin', 'finance_manager', 'operations_manager']}>
                <AnalyticsDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/activity-logs"
            element={
              <RoleRoute role="admin">
                <ActivityLogViewer />
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
