import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { api } from '../api/client.js';

const CLASS_BADGE = {
  'RESTRICTED':               'badge-restricted',
  'CONFIDENTIAL':             'badge-confidential',
  'RESTRICTED — HR ADMIN ONLY': 'badge-restricted'
};

function ReportModal({ report, onClose }) {
  if (!report) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <div className="modal-title">{report.title}</div>
            <div className="modal-meta">{report.report_code} · {report.classification} · {report.author} · {report.created_date}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="modal-body">{report.content}</div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [employees, setEmployees] = useState(null);
  const [reports,   setReports]   = useState(null);
  const [activeRep, setActiveRep] = useState(null);
  const [loadingRep,setLoadingRep]= useState(false);
  const nav = useNavigate();

  useEffect(() => {
    // Verify admin access client-side (server enforces it too)
    api.get('/api/me').then(r => {
      if (!r.ok) { nav('/login'); return; }
      if (r.data.user?.role !== 'hr_admin') { nav('/dashboard'); return; }
    });
    api.get('/api/admin/employees').then(r => { if (r.ok) setEmployees(r.data.employees); else setEmployees([]); });
    api.get('/api/admin/reports').then(r => {   if (r.ok) setReports(r.data.reports);     else setReports([]);   });
  }, []);

  const openReport = async (code) => {
    setLoadingRep(true);
    const r = await api.get(`/api/admin/reports/${encodeURIComponent(code)}`);
    setLoadingRep(false);
    if (r.ok) setActiveRep(r.data);
  };

  return (
    <Layout active="admin">
      <div className="page-heading">
        <h1 className="page-title">HR Administration</h1>
        <p className="page-subtitle">Restricted access — HR Systems Administrator role required. All activity is audited.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Employees</div>
          <div className="stat-value">{employees ? employees.length : '…'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confidential Reports</div>
          <div className="stat-value">{reports ? reports.length : '…'}</div>
        </div>
      </div>

      {/* Employee table */}
      <div className="card">
        <div className="card-title">Employee Registry</div>
        {!employees ? (
          <div className="loading-block"><div className="spinner" /> Loading…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th><th>Employee ID</th><th>Department</th>
                  <th>Job Title</th><th>Role</th><th>Hire Date</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id}>
                    <td>{e.full_name}</td>
                    <td><code style={{ fontFamily: 'monospace', fontSize: 12 }}>{e.employee_id}</code></td>
                    <td>{e.department}</td>
                    <td>{e.job_title}</td>
                    <td><span className={`badge ${e.role === 'hr_admin' ? 'badge-hr-admin' : 'badge-normal'}`}>{e.role}</span></td>
                    <td>{e.hire_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reports */}
      <div className="card">
        <div className="card-title">Confidential HR Reports</div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
          These documents are classified RESTRICTED or above. Distribution requires written approval from the Group HR Director.
        </p>
        {!reports ? (
          <div className="loading-block"><div className="spinner" /> Loading…</div>
        ) : reports.length === 0 ? (
          <div className="empty-state">No reports available.</div>
        ) : reports.map(rep => (
          <div className="report-row" key={rep.id}>
            <div className="report-info">
              <div className="report-code">{rep.report_code}</div>
              <div className="report-title">{rep.title}</div>
              <div className="report-meta">{rep.author} · {rep.created_date}</div>
            </div>
            <span className={`badge ${CLASS_BADGE[rep.classification] ?? 'badge-confidential'}`}>{rep.classification}</span>
            <button className="btn btn-secondary" onClick={() => openReport(rep.report_code)} disabled={loadingRep}>
              {loadingRep ? '…' : 'View'}
            </button>
          </div>
        ))}
      </div>

      <ReportModal report={activeRep} onClose={() => setActiveRep(null)} />
    </Layout>
  );
}
