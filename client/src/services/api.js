const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.fields = payload?.fields;
    throw error;
  }

  return payload?.data;
}

export const authApi = {
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),
  updateName: (body) => request("/api/auth/me", { method: "PUT", body }),
  changePassword: (body) => request("/api/auth/password", { method: "PUT", body }),
};

export const categoryApi = {
  list: () => request("/api/categories"),
  create: (body) => request("/api/categories", { method: "POST", body }),
  update: (id, body) => request(`/api/categories/${id}`, { method: "PUT", body }),
  remove: (id) => request(`/api/categories/${id}`, { method: "DELETE" }),
};

export const expenseApi = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/api/expenses${suffix}`);
  },
  create: (body) => request("/api/expenses", { method: "POST", body }),
  get: (id) => request(`/api/expenses/${id}`),
  update: (id, body) => request(`/api/expenses/${id}`, { method: "PUT", body }),
  remove: (id) => request(`/api/expenses/${id}`, { method: "DELETE" }),
};

export const statsApi = {
  summary: (month) => request(`/api/stats/summary${month ? `?month=${month}` : ""}`),
};
