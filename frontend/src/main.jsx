import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import "./index.css";

import App from "./App.jsx";
import Booking from "./Booking.jsx";
import ManageBooking from "./ManageBooking.jsx";
import Admin from "./Admin.jsx";
import SystemFeatures from "./SystemFeatures.jsx";
import ServiceDesk from "./ServiceDesk.jsx";
import { AuthProvider } from "./AuthContext.jsx";
import { AdminRoute } from "./ProtectedRoute.jsx";
import { Login, Signup } from "./AuthPages.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/manage-booking" element={<ManageBooking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/system" element={<SystemFeatures />} />
          <Route path="/services" element={<ServiceDesk />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);