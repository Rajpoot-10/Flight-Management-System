const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function parseApiError(data, fallback = "Request failed") {
  if (Array.isArray(data?.detail)) {
    return data.detail.map((item) => {
      const field = item.loc?.[item.loc.length - 1] || "field";
      return `${field}: ${item.msg}`;
    }).join(", ");
  }
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;
  return fallback;
}

export async function apiFetch(path, options = {}) {
  let response;
  try {
    response = await fetch(apiUrl(path), {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
  } catch {
    throw new Error("Unable to reach the AeroFlow backend.");
  }

  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!response.ok) throw new Error(parseApiError(data, `Request failed (${response.status})`));
  return data;
}