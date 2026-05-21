// src/pages/Entregas/lib/apiEntregas.js
const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getAuthHeader() {
  try {
    const token = localStorage.getItem("auth.access");

    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  } catch {
    return {};
  }
}

async function leerError(res) {
  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await res.json();

      if (typeof data === "string") return data;
      if (data.detail) return data.detail;
      if (data.message) return data.message;

      return JSON.stringify(data);
    }

    const texto = await res.text();
    return texto || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function http(
  path,
  { method = "GET", body, headers, auth = false } = {},
) {
  const finalHeaders = {
    ...(auth ? getAuthHeader() : {}),
    ...(headers || {}),
  };

  const res = await fetch(`${API}${path}`, {
    method,
    headers: finalHeaders,
    body,
  });

  if (!res.ok) {
    const error = await leerError(res);
    throw new Error(error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  return await res.text();
}

export const apiEntregas = {
  // Publico: no requiere sesion
  list: () => http("/citas/api/entregas/"),

  // Protegidos: requieren sesion
  get: (id) =>
    http(`/citas/api/entregas/${id}/`, {
      auth: true,
    }),

  create: (payload) =>
    http("/citas/api/entregas/", {
      method: "POST",
      auth: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "PUT",
      auth: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  patch: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "PATCH",
      auth: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "DELETE",
      auth: true,
    }),
};
