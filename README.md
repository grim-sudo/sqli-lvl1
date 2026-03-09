# Lab 1 — MeridianHR Internal Self-Service Portal

**Difficulty:** Easy  
**Vulnerability chain:** 3 layers — Authentication Bypass → UNION Data Extraction → Admin Access  
**Technology:** Node.js · Express · SQLite · React · Vite

---

## Company Background

**Meridian Consulting Group (MCG)** is a mid-sized management consulting firm with approximately 850 employees across four business divisions: Strategy & Advisory, Information Technology, Finance & Operations, and Client Services. Headquartered in London with offices in Manchester, Edinburgh, and Dublin.

MCG deployed **MeridianHR**, an internal self-service portal, to allow employees to access payslips, review company announcements, and manage basic HR information without going through the HR team directly. The platform was built in-house under time pressure and has not undergone a formal security assessment since initial deployment.

---

## Application Functionality

| Feature | Description |
|---|---|
| **Login** | Network-credential authentication |
| **Dashboard** | Company announcements, employee summary statistics |
| **My Payslips** | Look up payment records by employee reference number |
| **My Profile** | View personal employment record |
| **HR Admin Panel** | Admin-only: employee registry viewer, confidential HR reports |

---

## Scenario

You have been engaged by Meridian Consulting Group as an external penetration tester. Your scope covers the internal HR self-service portal. No credentials have been provided — this is a black-box assessment from the perspective of an unauthenticated user on the employee network.

**Objective:** Obtain the contents of a confidential HR document stored in the administrator section of the portal.

---

## Student Objectives

1. Gain access to the portal without valid credentials.
2. Escalate access from a regular employee session to the HR Administrator account.
3. Access and read the most sensitive classified HR report.

---

## Setup Instructions

### Requirements
- Docker Engine 24+
- Docker Compose v2

### Run (Docker Compose — recommended)

```bash
cd lab1-hr-portal

# Default placeholder flag
docker compose up --build

# Real flag
FLAG="your_flag_here" docker compose up --build
```

App available at: **http://localhost:8081**

### Run (Docker directly)

```bash
cd lab1-hr-portal
docker build -t meridianhr .
docker run --rm -t -p 8081:80 -e FLAG="your_flag_here" meridianhr
```

### Stop & clean up

```bash
docker compose down -v
```

---

## Development Mode (Vite hot-reload)

```bash
# Terminal 1 — start backend API
cd lab1-hr-portal/backend
npm install
node server.js          # listens on :3000

# Seed DB first (one-time)
FLAG="dev_flag" DB_PATH=./data/dev.db node setup-db.js

# Terminal 2 — start Vite dev server
cd lab1-hr-portal/frontend
npm install
npm run dev             # listens on :5173, proxies /api → :3000
```

---

## Port Reference

| Host port | Container port | Service |
|---|---|---|
| `8081` | `80` | MeridianHR web application (production) |
| `5173` | — | Vite dev server (dev mode only) |
| `3000` | — | Express API (dev mode only) |

---

## Injecting the FLAG

The `FLAG` environment variable is read at container startup and inserted into the HR security audit report (`HR-2026-003`). If not set, a safe placeholder is used.

```bash
docker run --rm -t -p 8081:80 -e FLAG="MCG{your_value_here}" meridianhr
```

---

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Returns `{"status":"ok"}` |
| GET | `/state` | None | App & DB readiness JSON |
| POST | `/api/auth/login` | None | Authenticate |
| POST | `/api/auth/logout` | Session | Destroy session |
| GET | `/api/me` | Session | Current user info |
| GET | `/api/announcements` | Session | Company announcements |
| GET | `/api/payslips[?ref=]` | Session | Payslip records |
| GET | `/api/profile` | Session | User profile |
| GET | `/api/admin/reports` | Admin | List HR reports |
| GET | `/api/admin/reports/:code` | Admin | Read a specific report |
| GET | `/api/admin/employees` | Admin | Employee registry |
