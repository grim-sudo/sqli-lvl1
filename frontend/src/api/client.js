// Lightweight API wrapper — all requests are relative so the Vite proxy
// rewrites them to the backend in dev, and Express serves them in production.

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res  = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export const api = {
  get:  (path)        => request('GET',  path),
  post: (path, body)  => request('POST', path, body)
};
