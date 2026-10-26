import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Traveler pages
import SearchPage from "../pages/traveler/SearchPage.jsx";
import PropertyDetailPage from "../pages/traveler/PropertyDetailPage.jsx";
import BookingPage from "../pages/traveler/BookingPage.jsx";
import PaymentPage from "../pages/traveler/PaymentPage.jsx";
import BookingConfirmedPage from "../pages/traveler/BookingConfirmedPage.jsx";
import MyBookingsPage from "../pages/traveler/MyBookingsPage.jsx";

// Owner pages
import OwnerDashboardPage from "../pages/owner/OwnerDashboardPage.jsx";
import CreateListingPage from "../pages/owner/CreateListingPage.jsx";
import ManageAvailabilityPage from "../pages/owner/ManageAvailabilityPage.jsx";
import BookingsListPage from "../pages/owner/BookingsListPage.jsx";
import PayoutLedgerPage from "../pages/owner/PayoutLedgerPage.jsx";

// Auth pages
import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";

import ProtectedRoute from "../components/layout/ProtectedRoute.jsx";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / traveler-facing */}
        <Route path="/" element={<SearchPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Traveler, requires auth */}
        <Route path="/book/:roomId" element={<ProtectedRoute role="TRAVELER"><BookingPage /></ProtectedRoute>} />
        <Route path="/pay/:bookingId" element={<ProtectedRoute role="TRAVELER"><PaymentPage /></ProtectedRoute>} />
        <Route path="/booking/:bookingId/confirmed" element={<ProtectedRoute role="TRAVELER"><BookingConfirmedPage /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute role="TRAVELER"><MyBookingsPage /></ProtectedRoute>} />

        {/* Owner, requires auth */}
        <Route path="/owner/dashboard" element={<ProtectedRoute role="OWNER"><OwnerDashboardPage /></ProtectedRoute>} />
        <Route path="/owner/listings/new" element={<ProtectedRoute role="OWNER"><CreateListingPage /></ProtectedRoute>} />
        <Route path="/owner/availability" element={<ProtectedRoute role="OWNER"><ManageAvailabilityPage /></ProtectedRoute>} />
        <Route path="/owner/bookings" element={<ProtectedRoute role="OWNER"><BookingsListPage /></ProtectedRoute>} />
        <Route path="/owner/payouts" element={<ProtectedRoute role="OWNER"><PayoutLedgerPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
