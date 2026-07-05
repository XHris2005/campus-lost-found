import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import ReportLostItem from './pages/ReportLostItem/ReportLostItem';
import ReportFoundItem from './pages/ReportFoundItem/ReportFoundItem';
import Listings from './pages/Listings/Listings';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import Chat from './pages/Chat/Chat';
import MyChats from './pages/MyChats/MyChats';
import AppLayout from './components/AppLayout/AppLayout';
import NotFound from './pages/NotFound/NotFound';
import Privacy from './pages/Privacy/Privacy';
import VerifyEmail from './pages/VerifyEmail/VerifyEmail';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import LecturerLogin from './pages/LecturerLogin/LecturerLogin';
import RegisterLecturer from './pages/RegisterLecturer/RegisterLecturer';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-lecturer" element={<RegisterLecturer />} />
            <Route path="/lecturer-login" element={<LecturerLogin />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout> <Dashboard /> </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/report-lost" element={
              <ProtectedRoute>
                <AppLayout> <ReportLostItem /> </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/report-found" element={
              <ProtectedRoute>
                <AppLayout> <ReportFoundItem /> </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/listings" element={
              <ProtectedRoute>
                <AppLayout> <Listings /> </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout> <AdminDashboard /> </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/chat/:chatId" element={
              <ProtectedRoute>
                <AppLayout> <Chat /> </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/my-chats" element={
              <ProtectedRoute>
                <AppLayout> <MyChats /> </AppLayout>
              </ProtectedRoute>
            } />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}