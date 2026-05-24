import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "../pages/admin/auth/LoginPage.tsx";
import ForgotPasswordPage from "../pages/admin/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/admin/auth/ResetPasswordPage";
import Dashboard from "../pages/Dashboard";
import Home from "../pages/Home";
import Success from "../pages/Success";
import ProtectedRoute from "../components/ProtectedRoute";
import PublishPropertyPage from "../pages/public/PublishPropertyPage";
import PublishPropertySuccessPage from "../pages/public/PublishPropertySuccessPage";
import PublicationsListPage from '../pages/admin/publications/PublicationsListPage';
import PublicationDetailPage from '../pages/admin/publications/PublicationDetailPage';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/publish-property" element={<PublishPropertyPage />} />
        <Route path="/publish-property/success" element={<PublishPropertySuccessPage />} />
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
        <Route path="/admin/publications" element={<ProtectedRoute><PublicationsListPage /></ProtectedRoute>} />
        <Route path="/admin/publications/:id" element={<ProtectedRoute><PublicationDetailPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
