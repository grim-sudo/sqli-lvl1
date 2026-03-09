import { useState } from 'react';
import Layout from '../components/Layout.jsx';

export default function Payslips() {
  const [ref,     setRef]     = useState('');
  const [rows,    setRows]    = useState(null);
  const [heading, setHeading] = useState('');
  const [loading, setLoading] = useState(false);
  const [sqlError, setSqlError] = useState(null);

  const fetchSlips = async (lookupRef) => {
    setLoading(true);
    setRows(null);
    setSqlError(null);
    const url = lookupRef ? `/api/payslips?ref=${encodeURIComponent(lookupRef)}` : '/api/payslips';
    try {
      const r    = await fetch(url, { credentials: 'include' });
      const data = await r.json();
      if (!r.ok) {
        setSqlError({ message: data.error, query: data.query });
        setRows([]);
        setHeading('Query Error');
      } else {
        setRows(data.payslips || []);
        setHeading(lookupRef ? `Records for reference: ${lookupRef}` : 'My Payslips');
      }
    } catch {
      setRows([]);
      setHeading('Error retrieving records');
    } finally {
      setLoading(false);
    }
  };

  const cols    = rows && rows.length > 0 ? Object.keys(rows[0]) : [];
  const humanise = s => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Layout active="payslips">
      <div className="page-heading">
        <h1 className="page-title">Payslips</h1>
        <p className="page-subtitle">Access your salary payment records. Payslips are issued on the first working day of each month.</p>
      </div>

      <div className="card">
        <div className="card-title">Payslip Lookup</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
          Your payslips are keyed to your employee reference number. Enter your reference below or leave blank to load your own records.
        </p>
        <div className="input-row">
          <input
            type="text"
            className="form-control"
            placeholder="e.g. MCG-00142"
            value={ref}
            onChange={e => setRef(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchSlips(ref.trim() || null)}
          />
          <button className="btn btn-action" onClick={() => fetchSlips(ref.trim() || null)}>Look Up</button>
          <button className="btn btn-secondary" onClick={() => { setRef(''); fetchSlips(null); }}>My Payslips</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>
          If your reference is incorrect, please contact <strong>Payroll on ext. 4402</strong>.
        </p>
      </div>

      <div className="card">
        <div className="card-title">{heading || 'Results'}</div>
        {loading && <div className="loading-block"><div className="spinner" /> Loading…</div>}
        {!loading && sqlError && (
          <div style={{ background: '#1a0000', border: '1px solid #c0392b', borderRadius: 6, padding: '14px 16px', marginBottom: 12, fontFamily: 'monospace', fontSize: 13 }}>
            <div style={{ color: '#e74c3c', fontWeight: 700, marginBottom: 8 }}>SQLite Error</div>
            <div style={{ color: '#ff6b6b', marginBottom: 10 }}>{sqlError.message}</div>
            {sqlError.query && (
              <>
                <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Executed query:</div>
                <pre style={{ color: '#f39c12', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{sqlError.query}</pre>
              </>
            )}
          </div>
        )}
        {!loading && rows === null && !sqlError && (
          <div className="empty-state">Enter an employee reference and click Look Up, or click My Payslips to view your own records.</div>
        )}
        {!loading && rows !== null && rows.length === 0 && !sqlError && (
          <div className="empty-state">No payslip records found for this reference.</div>
        )}
        {!loading && rows !== null && rows.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>{cols.map(c => <th key={c}>{humanise(c)}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {cols.map(c => <td key={c}>{String(row[c] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
