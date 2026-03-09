# Lab 1 Hints — MeridianHR Portal

Work through these in order. Only advance to the next when genuinely stuck.

---

## Layer 1 — Gaining Portal Access

**Hint 1.1**  
Web applications that authenticate users typically query a backend database. Consider what a server-side query might look like when it receives a username and password — and what happens if the values you supply influence the structure of that query.

**Hint 1.2**  
In many server-side languages, queries are built by concatenating strings together. If your input is included in that string without modification, certain characters in your input may be interpreted differently by the database than they are by the application.

**Hint 1.3**  
Single quote characters have special meaning inside SQL statements. Try placing one in the username field and observe the application's behaviour carefully. Does anything change — even subtly?

**Hint 1.4**  
SQL allows logical conditions to be combined with `OR`. A condition that is always true — such as `'a'='a'` — will cause a `WHERE` clause to match every row in the table.

**Hint 1.5**  
SQL comment notation (`--`) causes everything following it on the same line to be ignored by the database interpreter. Combined with a tautological condition, this can affect which parts of a query actually execute.

---

## Layer 2 — Escalating Your Access

**Hint 2.1**  
You now have access to the portal. Explore all available pages thoroughly. Look at both the visible functionality and the network requests being made — inspect them using developer tools or a proxy.

**Hint 2.2**  
One page allows you to look up records by supplying a reference value as a query parameter. Any time user input is incorporated into a query that returns data, it is worth examining more carefully.

**Hint 2.3**  
When you supply a reference value, observe which part of the URL or request body contains it. Try modifying the value and studying how the response changes.

**Hint 2.4**  
SQL supports a `UNION` operator that appends an additional `SELECT` to the result set of the original query. For this to work, both queries must return the same number of columns.

**Hint 2.5**  
To determine the number of columns, try systematically appending `UNION SELECT NULL, NULL, ...` with increasing counts of `NULL` values until a valid (non-empty) response is returned.

**Hint 2.6**  
Once the column count is known, any table accessible to the database user can be queried. Look in the database schema for tables that might hold authentication information. Consider what table name a typical application would use to store accounts.

---

## Layer 3 — Accessing Restricted Documents

**Hint 3.1**  
You have retrieved data from the database. Think about what you can do with it. Are there parts of the application you have not been able to access yet?

**Hint 3.2**  
Return to the login page and use the information you have extracted to authenticate as a different user. Not all accounts have the same level of access.

**Hint 3.3**  
Once logged in with elevated access, explore the sections of the portal that were not previously available. Some documents carry a higher classification marking than others — those are likely to be of greater interest.
