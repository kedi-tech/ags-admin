const API_BASE_URL =
  // Vite exposes vars prefixed with VITE_
  (import.meta as any).env?.VITE_API_URL
  // Fallback to the backend IP if not configured
  || "http://10.15.8.137:5000";

export interface LoginPayload {
  email: string;
  password: string;
}

export async function login(payload: LoginPayload) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await res.json();
    console.log("login data", data);
    const token = (data as any)?.token;
    if (typeof token === "string" && token) {
      localStorage.setItem("token", token);
    }
  } catch {
    // ignore JSON parse errors
  }

  if (!res.ok) {
    const message =
      (data as any)?.message ||
      "Identifiants invalides. Veuillez réessayer.";
    throw new Error(message);
  }

  return data;
  console.log(data);
}

export interface AuthUser {
  id: number | string;
  name?: string;
  email: string;
  // other fields from backend are allowed but optional
  [key: string]: unknown;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
    localStorage.setItem("name", (data as any)?.name as string);
    localStorage.setItem("email", (data as any)?.email as string);
    localStorage.setItem("role", (data as any)?.role as string);


  } catch {
    // ignore parse errors
  }

  if (!res.ok) {
    const message =
      (data as any)?.message ||
      "Impossible de charger les informations de l'utilisateur connecté.";
    throw new Error(message);
  }

  return data as AuthUser;
}

export async function fetchUsers(): Promise<AuthUser[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
    console.log("users", data);
  } catch {
    // ignore parse errors
  }

  if (!res.ok) {
    const message =
      (data as any)?.message ||
      "Impossible de charger la liste des utilisateurs.";
    throw new Error(message);
  }

  return (data as AuthUser[]) || [];
}

interface SaveUserPayload {
  name?: string;
  email?: string;
  role?: "ADMIN" | "STAFF";
  password?: string;
  status?: string;
}

export async function createUser(payload: SaveUserPayload): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de créer l'utilisateur.";
    throw new Error(message);
  }

  return data as AuthUser;
}

export async function updateUser(
  id: number | string,
  payload: SaveUserPayload,
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de mettre à jour l'utilisateur.";
    throw new Error(message);
  }

  return data as AuthUser;
}

export async function deleteUser(id: number | string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de supprimer l'utilisateur.";
    throw new Error(message);
  }
}


