'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');

function randPass() {
  return crypto.randomBytes(12).toString('base64url');
}

const PASS_JOHN    = randPass();
const PASS_SARAH   = randPass();
const PASS_MICHAEL = randPass();
const PASS_ADMIN   = randPass();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'meridianhr.db');
const FLAG    = process.env.FLAG    || 'MCG{placeholder_flag_not_set}';

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    full_name   TEXT    NOT NULL,
    department  TEXT    NOT NULL,
    job_title   TEXT    NOT NULL,
    employee_id TEXT    NOT NULL UNIQUE,
    hire_date   TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'employee',
    email       TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payslips (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_ref TEXT    NOT NULL,
    period       TEXT    NOT NULL,
    gross_salary REAL    NOT NULL,
    net_salary   REAL    NOT NULL,
    deductions   REAL    NOT NULL,
    issued_date  TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hr_reports (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    report_code    TEXT    NOT NULL UNIQUE,
    title          TEXT    NOT NULL,
    classification TEXT    NOT NULL,
    author         TEXT    NOT NULL,
    content        TEXT    NOT NULL,
    created_date   TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    body         TEXT    NOT NULL,
    author       TEXT    NOT NULL,
    created_date TEXT    NOT NULL,
    priority     TEXT    NOT NULL DEFAULT 'normal'
  );
`);

const insEmp = db.prepare(`
  INSERT OR IGNORE INTO employees
    (username, password, full_name, department, job_title, employee_id, hire_date, role, email)
  VALUES
    (@username,@password,@full_name,@department,@job_title,@employee_id,@hire_date,@role,@email)
`);

[
  { username:'john.taylor',  password:PASS_JOHN,    full_name:'John Taylor',     department:'Information Technology', job_title:'Systems Analyst',          employee_id:'MCG-00142', hire_date:'2019-03-11', role:'employee', email:'j.taylor@meridian-consulting.internal'    },
  { username:'sarah.jones',  password:PASS_SARAH,   full_name:'Sarah Jones',     department:'Finance',                job_title:'Senior Financial Analyst', employee_id:'MCG-00098', hire_date:'2017-07-24', role:'employee', email:'s.jones@meridian-consulting.internal'     },
  { username:'michael.chen', password:PASS_MICHAEL, full_name:'Michael Chen',    department:'Operations',             job_title:'Operations Manager',       employee_id:'MCG-00071', hire_date:'2016-01-08', role:'employee', email:'m.chen@meridian-consulting.internal'      },
  { username:'hr.admin',     password:PASS_ADMIN,   full_name:'Amanda Whitfield',department:'Human Resources',        job_title:'HR Systems Administrator', employee_id:'MCG-00010', hire_date:'2013-09-02', role:'hr_admin', email:'a.whitfield@meridian-consulting.internal' }
].forEach(e => insEmp.run(e));

const insPayslip = db.prepare(`
  INSERT OR IGNORE INTO payslips (employee_ref,period,gross_salary,net_salary,deductions,issued_date)
  VALUES (@employee_ref,@period,@gross_salary,@net_salary,@deductions,@issued_date)
`);

[
  { employee_ref:'MCG-00142', period:'January 2026',  gross_salary:6200, net_salary:4588,   deductions:1612,   issued_date:'2026-02-01' },
  { employee_ref:'MCG-00142', period:'December 2025', gross_salary:6200, net_salary:4588,   deductions:1612,   issued_date:'2026-01-02' },
  { employee_ref:'MCG-00142', period:'November 2025', gross_salary:6200, net_salary:4540,   deductions:1660,   issued_date:'2025-12-01' },
  { employee_ref:'MCG-00098', period:'January 2026',  gross_salary:7850, net_salary:5702.5, deductions:2147.5, issued_date:'2026-02-01' },
  { employee_ref:'MCG-00098', period:'December 2025', gross_salary:7850, net_salary:5702.5, deductions:2147.5, issued_date:'2026-01-02' },
  { employee_ref:'MCG-00071', period:'January 2026',  gross_salary:9100, net_salary:6461,   deductions:2639,   issued_date:'2026-02-01' },
  { employee_ref:'MCG-00071', period:'December 2025', gross_salary:9100, net_salary:6461,   deductions:2639,   issued_date:'2026-01-02' },
].forEach(p => insPayslip.run(p));

const insReport = db.prepare(`
  INSERT OR IGNORE INTO hr_reports (report_code,title,classification,author,content,created_date)
  VALUES (@report_code,@title,@classification,@author,@content,@created_date)
`);

[
  {
    report_code:'HR-2026-001', classification:'CONFIDENTIAL', author:'Amanda Whitfield', created_date:'2026-02-10',
    title:'Q1 2026 Workforce Planning Summary',
    content:'This report summarises headcount planning for Q1 2026. Total active headcount: 847. Planned hires: 32 across Engineering, Sales, and Client Services. Attrition rate Q4 2025: 4.1%. Recommended budget allocation for H1 2026 recruitment: £890,000. No material changes to grade structure anticipated.'
  },
  {
    report_code:'HR-2026-002', classification:'RESTRICTED', author:'Amanda Whitfield', created_date:'2026-01-28',
    title:'Annual Compensation Benchmarking Report — 2025',
    content:'External market benchmarking was conducted using Radford Global Technology Survey data (2025 cycle). Key findings: Meridian Consulting Group base salaries sit at P50 for individual contributors and P45 for management grades. Recommended adjustments for November 2026 cycle: +3.5% merit budget. Bonus multipliers remain unchanged. Full grade-band data appended in Annex A (HR restricted access only).'
  },
  {
    report_code:'HR-2026-003', classification:'RESTRICTED — HR ADMIN ONLY', author:'Group IT Security & Amanda Whitfield', created_date:'2026-02-14',
    title:'Security Access Audit — HR Systems Q4 2025',
    content:`Security access review for HR information systems completed 14 January 2026.\nScope: MeridianHR self-service portal, payroll export interface, and employee data warehouse.\n\nFindings:\n- 3 dormant accounts deactivated (separated employees, deactivation delayed >30 days).\n- MFA enforced on admin-tier accounts from 01-Dec-2025.\n- Payroll export audit log gap identified: 18–21 Nov 2025 — under investigation.\n\nAuthorised system credential rotation completed for service accounts.\n\nInternal tracking reference: {${FLAG}\n\nThis document is classified RESTRICTED and may not be distributed outside HR Administration without written approval from the Group HR Director.`
  }
].forEach(r => insReport.run(r));

const insAnn = db.prepare(`
  INSERT OR IGNORE INTO announcements (title,body,author,created_date,priority)
  VALUES (@title,@body,@author,@created_date,@priority)
`);

[
  { title:'Annual Performance Review Cycle — Now Open',     priority:'high',   created_date:'2026-02-20', author:'HR Team',                    body:'The 2025 annual performance review window opens on 3 March 2026. All employees must complete their self-assessment in MeridianHR by 28 March 2026. Line managers should schedule calibration sessions no later than 11 April.'        },
  { title:'Payslip Distribution — January 2026',            priority:'normal', created_date:'2026-02-03', author:'Payroll Team',                body:'January 2026 payslips are now available under My Payslips. If you notice any discrepancy, please raise a query through the HR helpdesk within 10 working days.'                                                                          },
  { title:'Office Closure — Bank Holiday 18 April 2026',   priority:'normal', created_date:'2026-02-12', author:'Facilities Management',       body:'All Meridian Consulting Group offices will be closed on Friday 18 April 2026. Essential on-call arrangements are detailed in the Business Continuity bulletin circulated 10 February 2026.'                                    },
  { title:'Mandatory Data Protection Refresher Training',  priority:'high',   created_date:'2026-02-18', author:'IT Security & Compliance',    body:'All employees are required to complete the annual GDPR/Data Protection refresher module via the Learning Management System by 31 March 2026. Completion is tracked and reported to departmental heads.' }
].forEach(a => insAnn.run(a));

console.log('[setup-db] Database initialised at', DB_PATH);
db.close();
