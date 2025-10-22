import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';

const AppLayout = lazy(() => import('./layouts/AppLayout'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const VerifyOtpPage = lazy(() => import('./pages/auth/VerifyOtpPage'));
const OverviewPage = lazy(() => import('./pages/dashboard/OverviewPage'));
const RequestsPage = lazy(() => import('./pages/dashboard/RequestsPage'));
const DeliveriesPage = lazy(() => import('./pages/dashboard/DeliveriesPage'));
const AppointmentsPage = lazy(() => import('./pages/dashboard/AppointmentsPage'));
const BloodBanksPage = lazy(() => import('./pages/dashboard/BloodBanksPage'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'));
const NotificationsPage = lazy(() => import('./pages/dashboard/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));

const App = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
        <Route path="/auth">
          <Route index element={<Navigate to="/auth/login" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<AppLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="deliveries" element={<DeliveriesPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="blood-banks" element={<BloodBanksPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
