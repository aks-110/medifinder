import { Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import TestDetail from "./pages/TestDetail.jsx";
import ProviderProfile from "./pages/ProviderProfile.jsx";
import BookingFlow from "./pages/BookingFlow.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import Reports from "./pages/Reports.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import ProviderProtectedRoute from "./pages/provider/ProviderProtectedRoute.jsx";
import ProviderLogin from "./pages/provider/ProviderLogin.jsx";
import ProviderLayout from "./pages/provider/ProviderLayout.jsx";
import ProviderDashboardHome from "./pages/provider/ProviderDashboardHome.jsx";
import ProviderTests from "./pages/provider/ProviderTests.jsx";
import ProviderBookings from "./pages/provider/ProviderBookings.jsx";

import AdminProtectedRoute from "./pages/admin/AdminProtectedRoute.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboardHome from "./pages/admin/AdminDashboardHome.jsx";
import AdminProviders from "./pages/admin/AdminProviders.jsx";
import AdminBookings from "./pages/admin/AdminBookings.jsx";

function PatientLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Patient-facing site */}
      <Route element={<PatientLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/tests/:slug" element={<TestDetail />} />
        <Route path="/providers/:id" element={<ProviderProfile />} />
        <Route path="/book/:slug" element={<ProtectedRoute><BookingFlow /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Provider portal */}
      <Route path="/provider/login" element={<ProviderLogin />} />
      <Route
        path="/provider"
        element={
          <ProviderProtectedRoute>
            <ProviderLayout />
          </ProviderProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ProviderDashboardHome />} />
        <Route path="tests" element={<ProviderTests />} />
        <Route path="bookings" element={<ProviderBookings />} />
      </Route>

      {/* Admin dashboard */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardHome />} />
        <Route path="providers" element={<AdminProviders />} />
        <Route path="bookings" element={<AdminBookings />} />
      </Route>
    </Routes>
  );
}
