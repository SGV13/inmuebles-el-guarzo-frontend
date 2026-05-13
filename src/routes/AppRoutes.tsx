import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "../pages/admin/auth/LoginPage.tsx";
import ForgotPasswordPage from "../pages/admin/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/admin/auth/ResetPasswordPage";
import Dashboard from "../pages/Dashboard";
import Home from "../pages/Home";
import LeadForm from "../pages/LeadForm";
import Success from "../pages/Success";
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/publish-property" element={<LeadForm />} />
        <Route path="/success" element={<Success />} />

        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin/forgot-password"
          element={<ForgotPasswordPage />}
        />
        <Route
          path="/admin/reset-password"
          element={<ResetPasswordPage />}
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
