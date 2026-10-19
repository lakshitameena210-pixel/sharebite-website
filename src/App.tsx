import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { DemoSwitcher } from './components/common/DemoSwitcher';
import { LandingPage } from './pages/LandingPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { DonatePage } from './pages/DonatePage';
import { FoodDetailPage } from './pages/FoodDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { AdminPage } from './pages/AdminPage';
import { ContactPage } from './pages/ContactPage';
import { LivePickupTrackingPage } from './pages/LivePickupTrackingPage';
import { SignUpPage } from './pages/SignUpPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900 bg-[#fbfbfa] dark:bg-[#0f1715] text-stone-900 dark:text-stone-100 transition-colors duration-200">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/donate" element={<DonatePage />} />
                <Route path="/food/:id" element={<FoodDetailPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/organizations" element={<OrganizationsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/track/:id" element={<LivePickupTrackingPage />} />
                <Route path="/signup" element={<SignUpPage defaultMode="register" />} />
                <Route path="/sign-up" element={<SignUpPage defaultMode="register" />} />
                <Route path="/register" element={<SignUpPage defaultMode="register" />} />
                <Route path="/login" element={<SignUpPage defaultMode="login" />} />
                <Route path="/signin" element={<SignUpPage defaultMode="login" />} />
                <Route path="/sign-in" element={<SignUpPage defaultMode="login" />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
            <DemoSwitcher />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
