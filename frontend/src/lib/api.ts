const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("winner_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  // Sesi habis / token tidak valid: bersihkan sesi lokal dan kembali ke login
  // (kecuali saat proses login itu sendiri, agar pesan error tampil di form).
  if (response.status === 401 && typeof window !== "undefined" && !endpoint.startsWith("/auth/login")) {
    localStorage.removeItem("winner_token");
    localStorage.removeItem("winner_user");
    if (window.location.pathname !== "/login") window.location.href = "/login";
  }

  if (!response.ok) {
    const errorMsg = data.error || `HTTP Error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (endpoint: string) => fetchApi(endpoint, { method: "GET" }),
  post: (endpoint: string, body?: any) =>
    fetchApi(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: (endpoint: string, body?: any) =>
    fetchApi(endpoint, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint: string) => fetchApi(endpoint, { method: "DELETE" }),
};
