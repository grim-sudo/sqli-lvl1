import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

// ── Icon helpers (inline SVG snippets) ───────────────────────────────────────

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d={d} />
  </svg>
);

export default function Layout({ children, active }) {
  const [user, setUser]   = useState(null);
  const [ddOpen, setDd]   = useState(false);
  const ddRef             = useRef(null);
  const nav               = useNavigate();

  useEffect(() => {
    api.get('/api/me').then(r => {
      if (!r.ok) nav('/login');
      else setUser(r.data.user);
    });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDd(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = async () => {
    await api.post('/api/auth/logout');
    nav('/login');
  };

  const initials = user
    ? user.full_name.split(' ').map(p => p[0]).join('').slice(0, 2)
    : '?';

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <Link to="/dashboard" className="topbar-logo">
          <div className="topbar-mark">M</div>
          <span className="topbar-name">Meridian Consulting Group</span>
          <span className="topbar-app">MeridianHR</span>
        </Link>

        <div ref={ddRef} style={{ position: 'relative' }}>
          <div className="topbar-pill" onClick={() => setDd(o => !o)}>
            <div className="topbar-avatar">{initials}</div>
            <span className="topbar-uname">{user?.full_name ?? '…'}</span>
          </div>

          <div className={`dd${ddOpen ? ' open' : ''}`}>
            <div className="dd-head">
              <div className="dd-head-name">{user?.full_name}</div>
              <div className="dd-head-dept">{user?.department}</div>
            </div>
            <Link to="/profile"  className="dd-item" onClick={() => setDd(false)}>My Profile</Link>
            <Link to="/payslips" className="dd-item" onClick={() => setDd(false)}>My Payslips</Link>
            <div className="dd-divider" />
            <div className="dd-item danger" onClick={logout}>Sign Out</div>
          </div>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar */}
        <nav className="sidebar">
          <div className="sb-section">Self-Service</div>
          <Link to="/dashboard" className={`sb-link${active === 'dashboard' ? ' active' : ''}`}>
            <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" /> Dashboard
          </Link>
          <Link to="/payslips" className={`sb-link${active === 'payslips' ? ' active' : ''}`}>
            <Icon d="M3 4h18a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2zM7 9h10M7 13h6" /> My Payslips
          </Link>
          <Link to="/profile" className={`sb-link${active === 'profile' ? ' active' : ''}`}>
            <Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100 8 4 4 0 000-8z" /> My Profile
          </Link>

          <div className="sb-section" style={{ marginTop: 12 }}>Company</div>
          <span className="sb-link disabled">
            <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            Employee Directory
          </span>
          <span className="sb-link disabled">
            <Icon d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            Policies &amp; Forms
          </span>

          {user?.role === 'hr_admin' && (
            <>
              <div className="sb-section" style={{ marginTop: 12 }}>Administration</div>
              <Link to="/admin" className={`sb-link admin${active === 'admin' ? ' active' : ''}`}>
                <Icon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9 4.04v11.032A8 8 0 0012 22a8 8 0 009-5.984V6.928z" />
                HR Admin Panel
              </Link>
            </>
          )}
        </nav>

        {/* Page content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
