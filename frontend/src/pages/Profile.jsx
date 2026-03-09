import { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { api } from '../api/client.js';

export default function Profile() {
  const [emp, setEmp] = useState(null);

  useEffect(() => {
    api.get('/api/profile').then(r => { if (r.ok) setEmp(r.data); });
  }, []);

  const initials = emp ? emp.full_name.split(' ').map(p => p[0]).join('').slice(0, 2) : '?';

  const fields = emp ? [
    { label: 'Full Name',   value: emp.full_name   },
    { label: 'Job Title',   value: emp.job_title   },
    { label: 'Department',  value: emp.department  },
    { label: 'Employee ID', value: emp.employee_id },
    { label: 'Email',       value: emp.email       },
    { label: 'Hire Date',   value: emp.hire_date   }
  ] : [];

  return (
    <Layout active="profile">
      <div className="page-heading">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Your employment record held in MeridianHR. Contact HR to update any details.</p>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        {emp ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 56, height: 56, background: 'var(--blue)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>{emp.full_name}</div>
                <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>{emp.job_title}</div>
              </div>
            </div>
            <div className="profile-grid">
              {fields.map(f => (
                <div key={f.label}>
                  <div className="pf-label">{f.label}</div>
                  <div className="pf-value">{f.value || '—'}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="loading-block"><div className="spinner" /> Loading…</div>
        )}
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <div className="card-title">Account Access</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
          To change your network password, use the <strong>Self-Service Password Reset</strong> tool at{' '}
          <code style={{ background: '#f1f5f9', padding: '2px 5px', borderRadius: 4 }}>password.meridian-consulting.internal</code>{' '}
          or contact IT Helpdesk on ext.&nbsp;4400.
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          MFA is required for all admin-tier accounts. Employee-tier accounts are subject to session timeout after 2 hours of inactivity.
        </p>
      </div>
    </Layout>
  );
}
