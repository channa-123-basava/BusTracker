import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin pages
import AdminLayout from './pages/admin/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import BusesPage from './pages/admin/Buses';
import RoutesPage from './pages/admin/Routes';
import StudentsPage from './pages/admin/Students';
import DriversPage from './pages/admin/Drivers';
import TripsPage from './pages/admin/Trips';
import AdminNotifications from './pages/admin/Notifications';

// Driver pages
import DriverLayout from './pages/driver/Layout';
import DriverDashboard from './pages/driver/Dashboard';
import DriverNotifications from './pages/driver/Notifications';
import DriverProfile from './pages/driver/Profile';

// Student pages
import StudentLayout from './pages/student/Layout';
import StudentDashboard from './pages/student/Dashboard';
import StudentNotifications from './pages/student/Notifications';
import StudentProfile from './pages/student/Profile';

// 404
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#1e293b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                },
                success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
              }}
            />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="buses" element={<BusesPage />} />
                <Route path="routes" element={<RoutesPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="drivers" element={<DriversPage />} />
                <Route path="trips" element={<TripsPage />} />
                <Route path="notifications" element={<AdminNotifications />} />
              </Route>

              {/* Driver routes */}
              <Route path="/driver" element={
                <ProtectedRoute roles={['driver']}>
                  <DriverLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DriverDashboard />} />
                <Route path="notifications" element={<DriverNotifications />} />
                <Route path="profile" element={<DriverProfile />} />
              </Route>

              {/* Student routes */}
              <Route path="/student" element={
                <ProtectedRoute roles={['student']}>
                  <StudentLayout />
                </ProtectedRoute>
              }>
                <Route index element={<StudentDashboard />} />
                <Route path="notifications" element={<StudentNotifications />} />
                <Route path="profile" element={<StudentProfile />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
