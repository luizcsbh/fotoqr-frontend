import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { ColdStartBanner } from './components/ColdStartBanner';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { PublicUploadPage } from './pages/PublicUploadPage';
import { SuccessPage } from './pages/SuccessPage';
import { EventGalleryPage } from './pages/EventGalleryPage';
import { PresentationPage } from './pages/PresentationPage';
import { ProfilePage } from './pages/ProfilePage';
import { PasswordRecoveryPage } from './pages/PasswordRecoveryPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Standard App Layout with Header and Footer
const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <ColdStartBanner />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Routes wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<PasswordRecoveryPage />} />
        <Route path="/reset-password" element={<PasswordRecoveryPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/event/:id"
          element={
            <ProtectedRoute>
              <EventDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/evento/:id"
          element={
            <ProtectedRoute>
              <EventDetailPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Public Guest Mobile Routes & Presentation Mode (Standalone layout) */}
      <Route path="/evento/:uuid" element={<PublicUploadPage />} />
      <Route path="/evento/:uuid/sucesso" element={<SuccessPage />} />
      <Route path="/evento/:uuid/galeria" element={<EventGalleryPage />} />
      <Route path="/evento/:uuid/apresentacao" element={<PresentationPage />} />
      <Route path="/evento/:uuid/telao" element={<PresentationPage />} />
      <Route path="/e/:uuid" element={<PublicUploadPage />} />
      <Route path="/e/:uuid/sucesso" element={<SuccessPage />} />
      <Route path="/e/:uuid/galeria" element={<EventGalleryPage />} />
      <Route path="/e/:uuid/apresentacao" element={<PresentationPage />} />
      <Route path="/e/:uuid/telao" element={<PresentationPage />} />
    </Routes>
  );
};

export default App;
