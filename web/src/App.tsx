import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SmsPage } from './pages/SmsPage';
import { EmailPage } from './pages/EmailPage';
import { ClientsPage } from './pages/ClientsPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ItpStatusPage } from './pages/ItpStatusPage';
import { NotificationsLogsPage } from './pages/NotificationsLogsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { HomePage } from './pages/HomePage';
import { ClientPortalPage } from './pages/ClientPortalPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { PricingPage } from './pages/PricingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PublicMarketplacePage } from './pages/PublicMarketplacePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Marketing Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/cauta" element={<PublicMarketplacePage />} />
          <Route path="/marketplace" element={<PublicMarketplacePage />} />

          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Public Pages - Tenant Specific */}
          <Route path="/app" element={<HomePage />} />
          <Route path="/programare" element={<HomePage />} />
          <Route path="/programarile-mele" element={<ClientPortalPage />} />
          <Route path="/verificare" element={<ClientPortalPage />} />

          {/* Admin Calendar - Zile Blocate (Public for now) */}
          <Route path="/admin-calendar" element={<AdminPage />} />

          {/* Protected Admin Pages */}
          <Route path="/admin" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/appointments" element={<ProtectedRoute><Layout><AppointmentsPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/clients" element={<ProtectedRoute><Layout><ClientsPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/vehicles" element={<ProtectedRoute><Layout><VehiclesPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/templates" element={<ProtectedRoute><Layout><TemplatesPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/itp-status" element={<ProtectedRoute><Layout><ItpStatusPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute><Layout><NotificationsLogsPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/sms" element={<ProtectedRoute><Layout><SmsPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/email" element={<ProtectedRoute><Layout><EmailPage /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
