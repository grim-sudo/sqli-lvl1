import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login     from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Payslips  from './pages/Payslips.jsx';
import Profile   from './pages/Profile.jsx';
import Admin     from './pages/Admin.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/payslips"  element={<Payslips />} />
        <Route path="/profile"   element={<Profile />} />
        <Route path="/admin"     element={<Admin />} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
