'use strict';

const express    = require('express');
const session    = require('express-session');
const bodyParser = require('body-parser');
const path       = require('path');
const fs         = require('fs');
const Database   = require('better-sqlite3');

const PORT    = process.env.PORT    || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'meridianhr.db');
const SECRET  = process.env.SESSION_SECRET || 'meridian-hr-session-secret-2024';
const STATIC  = process.env.STATIC_DIR || path.join(__dirname, 'public');

if (!fs.existsSync(DB_PATH)) {
  console.error('[server] Database not found at', DB_PATH, '— run setup-db.js first.');
  process.exit(1);
}

const db  = new Database(DB_PATH);
const app = express();
db.pragma('journal_mode = WAL');

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret:            SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie:            { httpOnly: true, maxAge: 2 * 60 * 60 * 1000 }
}));

// ── Auth helpers ──────────────────────────────────────────────────────────────

function requireLogin(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: 'Unauthenticated' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: 'Unauthenticated' });
  if (req.session.user.role !== 'hr_admin') return res.status(403).json({ error: 'Insufficient privileges' });
  next();
}

// ── Health / State ────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/state', (_req, res) => {
  let dbOk = false;
  try { db.prepare('SELECT 1').get(); dbOk = true; } catch (_) {}
  res.json({ app: 'MeridianHR Self-Service Portal', version: '3.2.1', status: dbOk ? 'ready' : 'degraded', database: dbOk ? 'connected' : 'error', uptime: Math.floor(process.uptime()) });
});

// ── Authentication ─────────────────────────────────────────────────────────────
// VULNERABILITY LAYER 1 — username/password injected directly into SQL string

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password are required.' });

  // ⚠ INTENTIONALLY VULNERABLE: string interpolation into SQL
  const query = `SELECT id, username, full_name, department, job_title, employee_id, role
                 FROM employees
                 WHERE username = '${username}' AND password = '${password}'`;
  let employee;
  try {
    employee = db.prepare(query).get();
  } catch (err) {
    // ⚠ INTENTIONALLY VERBOSE: exposes raw SQLite error to demonstrate injection
    return res.status(500).json({ success: false, message: `Database error: ${err.message}` });
  }

  if (!employee) return res.status(401).json({ success: false, message: 'Invalid credentials. Please try again.' });

  req.session.user = { id: employee.id, username: employee.username, full_name: employee.full_name, department: employee.department, job_title: employee.job_title, employee_id: employee.employee_id, role: employee.role };
  return res.json({ success: true });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/me', requireLogin, (req, res) => res.json({ user: req.session.user }));

// ── Announcements ─────────────────────────────────────────────────────────────

app.get('/api/announcements', requireLogin, (req, res) => {
  const rows = db.prepare(`SELECT id,title,body,author,created_date,priority FROM announcements ORDER BY CASE priority WHEN 'high' THEN 0 ELSE 1 END, created_date DESC LIMIT 10`).all();
  res.json(rows);
});

// ── Payslips ──────────────────────────────────────────────────────────────────
// VULNERABILITY LAYER 2 — ref parameter injected into SQL string (UNION-extractable)

app.get('/api/payslips', requireLogin, (req, res) => {
  const { ref } = req.query;
  if (!ref) {
    const rows = db.prepare(`SELECT period,gross_salary,net_salary,deductions,issued_date FROM payslips WHERE employee_ref=? ORDER BY issued_date DESC`).all(req.session.user.employee_id);
    return res.json({ payslips: rows });
  }

  // ⚠ INTENTIONALLY VULNERABLE: ref value is not parameterised
  const query = `SELECT period,gross_salary,net_salary,deductions,issued_date FROM payslips WHERE employee_ref='${ref}' ORDER BY issued_date DESC`;
  let rows;
  try {
    rows = db.prepare(query).all();
  } catch (err) {
    // ⚠ INTENTIONALLY VERBOSE: exposes raw SQLite error and the full query to demonstrate injection
    return res.status(500).json({ error: `Database error: ${err.message}`, query });
  }
  res.json({ payslips: rows });
});

// ── Profile ───────────────────────────────────────────────────────────────────

app.get('/api/profile', requireLogin, (req, res) => {
  const emp = db.prepare(`SELECT full_name,department,job_title,employee_id,hire_date,email FROM employees WHERE id=?`).get(req.session.user.id);
  res.json(emp || {});
});

// ── Admin ─────────────────────────────────────────────────────────────────────

app.get('/api/admin/reports', requireAdmin, (req, res) => {
  const reports = db.prepare(`SELECT id,report_code,title,classification,author,created_date FROM hr_reports ORDER BY created_date DESC`).all();
  res.json({ reports });
});

app.get('/api/admin/reports/:code', requireAdmin, (req, res) => {
  const report = db.prepare(`SELECT report_code,title,classification,author,content,created_date FROM hr_reports WHERE report_code=?`).get(req.params.code);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
});

app.get('/api/admin/employees', requireAdmin, (req, res) => {
  const rows = db.prepare(`SELECT id,username,full_name,department,job_title,employee_id,hire_date,role,email FROM employees ORDER BY department,full_name`).all();
  res.json({ employees: rows });
});

// ── Serve Vite production build ───────────────────────────────────────────────

if (fs.existsSync(STATIC)) {
  app.use(express.static(STATIC));
  app.get('*', (_req, res) => {
    const idx = path.join(STATIC, 'index.html');
    if (fs.existsSync(idx)) res.sendFile(idx);
    else res.status(404).json({ error: 'Not found' });
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => console.log(`[MeridianHR] API listening on :${PORT}`));
