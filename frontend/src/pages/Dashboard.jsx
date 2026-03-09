import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { api } from '../api/client.js';

export default function Dashboard() {
  const [user,  setUser]  = useState(null);
  const [anns,  setAnns]  = useState(null);
  const [slip,  setSlip]  = useState(null);

  useEffect(() => {
    api.get('/api/me').then(r => { if (r.ok) setUser(r.data.user); });
    api.get('/api/announcements').then(r => { if (r.ok) setAnns(r.data); });
    api.get('/api/payslips').then(r => { if (r.ok && r.data.payslips?.length) setSlip(r.data.payslips[0].period); });
  }, []);

  return (
    <Layout active="dashboard">
      <div className="page-heading">
        <h1 className="page-title">Welcome back{user ? `, ${user.full_name.split(' ')[0]}` : ''}</h1>
        <p className="page-subtitle">Here is your MeridianHR overview for today.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Department</div>
          <div className="stat-value">{user?.department ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Employee ID</div>
          <div className="stat-value">{user?.employee_id ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Latest Payslip</div>
          <div className="stat-value">{slip ?? '—'}</div>
          <div className="stat-note"><Link to="/payslips">View all payslips →</Link></div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Company Announcements</div>
        {anns === null ? (
          <div className="loading-block"><div className="spinner" /> Loading…</div>
        ) : anns.length === 0 ? (
          <div className="empty-state">No announcements at this time.</div>
        ) : anns.map(a => (
          <div className="ann-item" key={a.id}>
            <div className="ann-header">
              <span className="ann-title">{a.title}</span>
              <span className={`badge badge-${a.priority === 'high' ? 'high' : 'normal'}`}>
                {a.priority === 'high' ? 'Important' : 'General'}
              </span>
            </div>
            <div className="ann-body">{a.body}</div>
            <div className="ann-meta">Posted by {a.author} — {a.created_date}</div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
