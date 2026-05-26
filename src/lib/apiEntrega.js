// src/lib/apiEntrega.js
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
  { method = "GET", body, headers, responseType, auth = false } = {},
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

  if (responseType === "blob") {
    return await res.blob();
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  return await res.text();
}

function limpiarNombreArchivo(nombre) {
  return String(nombre || "encuesta_entrega.pdf")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_");
}

function descargarBlob(blob, nombreArchivo) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = limpiarNombreArchivo(nombreArchivo);

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}

async function crearEntrega(payload) {
  return await http("/citas/api/entregas/", {
    method: "POST",
    auth: false,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function descargarPdfEntrega(id, nombreArchivo) {
  if (!id) {
    throw new Error("No se recibió el ID de la entrega para generar el PDF.");
  }

  const blob = await http(`/citas/api/entregas/${id}/pdf/`, {
    method: "GET",
    auth: false,
    responseType: "blob",
  });

  descargarBlob(blob, nombreArchivo || `encuesta_entrega_${id}.pdf`);

  return blob;
}

export const apiEntrega = {
  create: crearEntrega,
  downloadPdf: descargarPdfEntrega,
};
