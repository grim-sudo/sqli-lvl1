import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) { setError('Please enter both username and password.'); return; }
    setLoading(true);
    try {
      const r = await api.post('/api/auth/login', { username: username.trim(), password });
      if (r.data.success) { nav('/dashboard'); }
      else { setError(r.data.message || 'Authentication failed.'); }
    } catch (err) {
      setError(err.response?.data?.message || 'A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <header className="login-topbar">
        <div className="login-mark">M</div>
        <span className="login-brand">Meridian Consulting Group</span>
        <span className="login-brand-sub">Employee Self-Service</span>
      </header>

      <div className="login-body">
        <div className="login-card">
          <h1 className="login-title">Sign in to MeridianHR</h1>
          <p className="login-sub">Use your network credentials to access the portal.</p>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={submit} autoComplete="off">
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username" type="text" className="form-control"
                placeholder="firstname.lastname"
                value={username} onChange={e => setUsername(e.target.value)}
                autoComplete="username" spellCheck={false}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" type="password" className="form-control"
                placeholder="••••••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer-note">
            This system is for authorised Meridian Consulting Group employees only.<br />
            All access is monitored and logged. Unauthorised access is prohibited.<br />
            For account issues, contact <strong>IT Helpdesk</strong> on ext.&nbsp;4400.
          </div>
        </div>
      </div>

      <footer className="login-pg-footer">
        &copy; 2026 Meridian Consulting Group Ltd — MeridianHR v3.2.1 — Confidential
      </footer>
    </div>
  );
}
