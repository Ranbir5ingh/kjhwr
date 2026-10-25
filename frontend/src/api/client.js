const BASE = import.meta.env.VITE_API_BASE || "";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  meta: () => get("/api/meta"),
  health: () => get("/api/health"),
  days: () => get("/api/days"),
  decision: (day) => get(`/api/decision/${day}`),
  accuracy: () => get("/api/accuracy"),
};
