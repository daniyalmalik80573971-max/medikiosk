import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PatientDashboard from './pages/patient/Dashboard';
import NewCase from './pages/patient/NewCase';
import MyCases from './pages/patient/MyCases';
import CaseDetail from './pages/patient/CaseDetail';
import PatientDocuments from './pages/patient/Documents';
import PatientProfile from './pages/patient/Profile';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorQueue from './pages/doctor/Queue';
import DoctorCaseReview from './pages/doctor/CaseReview';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCases from './pages/admin/Cases';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Register />} />
      
      {/* Patient Routes */}
      <Route path="/patient/dashboard" element={<PrivateRoute roles={['patient']}><PatientDashboard /></PrivateRoute>} />
      <Route path="/patient/new-case" element={<PrivateRoute roles={['patient']}><NewCase /></PrivateRoute>} />
      <Route path="/patient/cases" element={<PrivateRoute roles={['patient']}><MyCases /></PrivateRoute>} />
      <Route path="/patient/cases/:id" element={<PrivateRoute roles={['patient']}><CaseDetail /></PrivateRoute>} />
      <Route path="/patient/documents" element={<PrivateRoute roles={['patient']}><PatientDocuments /></PrivateRoute>} />
      <Route path="/patient/profile" element={<PrivateRoute roles={['patient']}><PatientProfile /></PrivateRoute>} />
      
      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={<PrivateRoute roles={['doctor']}><DoctorDashboard /></PrivateRoute>} />
      <Route path="/doctor/queue" element={<PrivateRoute roles={['doctor']}><DoctorQueue /></PrivateRoute>} />
      <Route path="/doctor/cases/:id" element={<PrivateRoute roles={['doctor']}><DoctorCaseReview /></PrivateRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
      <Route path="/admin/cases" element={<PrivateRoute roles={['admin']}><AdminCases /></PrivateRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '10px', background: '#333', color: '#fff' } }} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
