const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://10.15.8.137:5000";

export type ClientType = "INDIVIDUAL" | "COMPANY";
export type CreditStatus = "ACTIVE" | "PAID" | "EXPIRED" | "CANCELED";
export type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "DELIVERED";

export interface ApiClient {
  // Align with Prisma where Client.id is a string/UUID
  id: string;
  type: ClientType;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit: number;
  createdAt: string;
}

export interface ApiOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
    sku: string;
    price: number;
  } | null;
}

export interface ApiPayment {
  id: number;
  orderId: number;
  amount: number;
  method: string;
  reference?: string | null;
  createdAt: string;
}

export interface ApiOrder {
  // Align with Prisma where Order.id and clientId are string/UUID
  id: string;
  clientId: string;
  client: ApiClient;
  status: OrderStatus;
  total: number;
  isCredit: boolean;
  createdAt: string;
  items: ApiOrderItem[];
  payments: ApiPayment[];
}

export interface ApiCredit {
  id: number;
  clientId: string;
  client: ApiClient;
  orderId: string;
  orders: ApiOrder;
  amount: number;
  status: CreditStatus;
  limitedDate: string;
  createdAt: string;
  author?: { id: string; name: string; email: string } | null;
}

export async function fetchCredits(): Promise<ApiCredit[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/credits`, {
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
      (data as any)?.message ||
      "Impossible de charger la liste des crédits.";
    throw new Error(message);
  }

  // Normalise various possible backend shapes to always return an array
  if (Array.isArray(data)) {
    return data as ApiCredit[];
  }

  // Common patterns: { credits: [...] } or { data: [...] }
  const asAny = data as any;
  if (asAny && Array.isArray(asAny.credits)) {
    return asAny.credits as ApiCredit[];
  }
  if (asAny && Array.isArray(asAny.data)) {
    return asAny.data as ApiCredit[];
  }

  return [];
}

export interface CreateCreditPayload {
  clientId: string;
  orderId: string;
  amount: number;
  limitedDate: string;
}

export async function createCredit(
  payload: CreateCreditPayload,
): Promise<ApiCredit> {
  const res = await fetch(`${API_BASE_URL}/api/v1/credits`, {
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
      (data as any)?.message || "Impossible de créer le crédit.";
    throw new Error(message);
  }

  return data as ApiCredit;
}

export async function updateCreditStatus(
  id: number,
  status: CreditStatus,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/credits/${id}/status`, {
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
      (data as any)?.message || "Impossible de mettre à jour le statut du crédit.";
    throw new Error(message);
  }
}

export async function deleteCredit(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/credits/${id}`, {
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
      (data as any)?.message || "Impossible de supprimer le crédit.";
    throw new Error(message);
  }
}


