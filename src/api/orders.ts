const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://10.15.8.137:5000";

export interface OrderClient {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface OrderItem {
  productId: string | number;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

export interface ApiOrder {
  id: string;
  clientId?: string;
  client?: OrderClient | null;
  total?: number;
  status?: string;
  isCredit?: boolean;
  items?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
  author?: { id: string; name: string; email: string } | null;
}

export async function fetchOrders(): Promise<ApiOrder[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
    console.log("orders", data);
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message ||
      "Impossible de charger la liste des commandes.";
    throw new Error(message);
  }

  // Assume backend already returns objects compatible with our Orders UI
  return (data as ApiOrder[]) || [];
}

export async function fetchOrderById(
  id: string | number,
): Promise<ApiOrder> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
    console.log("order by id", data);
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message ||
      "Impossible de charger la commande demandée.";
    throw new Error(message);
  }

  return data as ApiOrder;
}

export interface CreateOrderPayload {
  // Must match Prisma Client.id which is a string/UUID
  clientId: string;
  status: string;
  // Whether this order is a credit order
  isCredit?: boolean;
  items: {
    productId: number;
    quantity: number;
    size?: string | null;
    color?: string | null;
  }[];
}

// Reuse same shape for updates for now
export type UpdateOrderPayload = CreateOrderPayload;

export async function createOrder(payload: CreateOrderPayload): Promise<ApiOrder> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders`, {
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
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de créer la commande.";
    throw new Error(message);
  }

  return data as ApiOrder;
}

export async function updateOrder(
  id: string | number,
  payload: UpdateOrderPayload,
): Promise<ApiOrder> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders/${id}`, {
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
      (data as any)?.message || "Impossible de mettre à jour la commande.";
    throw new Error(message);
  }

  return data as ApiOrder;
}

export async function updateOrderStatus(
  id: string | number,
  status: string,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
    body: JSON.stringify({ status }),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de mettre à jour le statut de la commande.";
    throw new Error(message);
  }
}

export async function cancelOrder(id: string | number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders/${id}/cancel`, {
    method: "PUT",
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
      (data as any)?.message || "Impossible d'annuler la commande.";
    throw new Error(message);
  }
}

export async function deleteOrder(id: string | number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders/${id}`, {
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
      (data as any)?.message || "Impossible de supprimer la commande.";
    throw new Error(message);
  }
}

