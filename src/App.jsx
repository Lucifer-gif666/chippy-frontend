import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css';

import Login from "./pages/Login";
import StaffLogin from "./pages/StaffLogin";
import StaffDashboard from "./pages/StaffDashboard";
import RaiseTicket from "./pages/RaiseTicket";
import ZoneManagement from "./pages/ZoneManagement";
import AllTickets from "./pages/AllTickets";
import AssignTickets from "./pages/AssignTickets";
import StaffManagement from "./pages/StaffManagement";
import MyTickets from "./pages/MyTickets";
import TicketHistory from "./pages/TicketHistory";
import MaintenanceScreen from "./pages/Maintenance";

// ⭐ New Pages
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import SetPassword from "./pages/SetPassword";
import SignUp from "./pages/SignUp";

// ProtectedRoute and AdminRoute remain the same
const ProtectedRoute = ({ children }) => {
  const staff = JSON.parse(localStorage.getItem("currentStaff"));
  return staff ? children : <Navigate to="/staff-login" />;
};

const AdminRoute = ({ children }) => {
  const staff = JSON.parse(localStorage.getItem("currentStaff"));

  if (!staff) return <Navigate to="/staff-login" />;

  if (!["admin", "super_admin"].includes(staff.role)) {
    return <Navigate to="/staff-dashboard" />;
  }

  return children;
};

const MAINTENANCE_MODE = false; // 🔁 change to false when done

const App = () => {

   if (MAINTENANCE_MODE) {
    return <MaintenanceScreen />;
  }
  return (
    
    <BrowserRouter>
      <Routes>
        {/* Public login pages */}
        <Route index element={<Login />} />
        <Route path="staff-login" element={<StaffLogin />} />
        <Route path="signup" element={<SignUp/>}/>

        {/* ⭐ NEW Public Auth Routes */}
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
        <Route path="set-password" element={<SetPassword />} />

        {/* Protected staff pages */}
        <Route
          path="staff-dashboard"
          element={
            <ProtectedRoute>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="raise-ticket"
          element={
            <ProtectedRoute>
              <RaiseTicket />
            </ProtectedRoute>
          }
        />
        <Route
          path="all-tickets"
          element={
            <ProtectedRoute>
              <AllTickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-tickets"
          element={
            <ProtectedRoute>
              <MyTickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="ticket-history"
          element={
            <ProtectedRoute>
              <TicketHistory />
            </ProtectedRoute>
          }
        />

        {/* Admin-only pages */}
        <Route
          path="zone-management"
          element={
            <AdminRoute>
              <ZoneManagement />
            </AdminRoute>
          }
        />
        <Route
          path="assign-tickets"
          element={
            <AdminRoute>
              <AssignTickets />
            </AdminRoute>
          }
        />
        <Route
          path="staff-management"
          element={
            <AdminRoute>
              <StaffManagement />
            </AdminRoute>
          }
        />

        {/* ⭐ New Settings page (staff protected) */}
       
      </Routes>

      {/* Global Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  );
};

export default App;
