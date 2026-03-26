const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://10.15.8.137:5000";

export interface Client {
  // Align with Prisma where Client.id is a string/UUID
  id: string;
  type: "INDIVIDUAL" | "COMPANY";
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit: number;
  createdAt: string;
}

export async function fetchClients(): Promise<Client[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/clients`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
    console.log("clients", data);
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message ||
      "Impossible de charger la liste des clients.";
    throw new Error(message);
  }

  return (data as Client[]) || [];
}

export async function fetchClientById(
  id: number | string,
): Promise<Client> {
  const res = await fetch(`${API_BASE_URL}/api/v1/clients/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de charger le client demandé.";
    throw new Error(message);
  }

  return data as Client;
}

export interface CreateClientPayload {
  name: string;
  type: "INDIVIDUAL" | "COMPANY";
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number;
}

export type UpdateClientPayload = Partial<CreateClientPayload> & {
  creditLimit?: number;
};

export async function createClient(payload: CreateClientPayload): Promise<Client> {
  const body: any = {
    name: payload.name,
    type: payload.type,
  };

  if (payload.email) {
    body.email = payload.email;
  }

  // phone/address are included in case backend supports them
  if (payload.phone) {
    body.phone = payload.phone;
  }
  if (payload.address) {
    body.address = payload.address;
  }
  if (typeof payload.creditLimit === 'number') {
    body.creditLimit = payload.creditLimit;
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
    body: JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de créer le client.";
    throw new Error(message);
  }

  return data as Client;
}

export async function updateClient(
  id: string,
  payload: UpdateClientPayload,
): Promise<Client> {
  const res = await fetch(`${API_BASE_URL}/api/v1/clients/${id}`, {
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
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de mettre à jour le client.";
    throw new Error(message);
  }

  return data as Client;
}

export async function deleteClient(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/clients/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de supprimer le client.";
    throw new Error(message);
  }
}


