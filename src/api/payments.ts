const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api";

export interface ApiPayment {
  id: number;
  // Align with backend where Order.id is a string/UUID
  orderId: string;
  amount: number;
  method: string;
  reference?: string | null;
  txnId?: string | null;
  type?: string | null;
  createdAt: string;
  // Optional enriched fields from backend
  customerName?: string | null;
  source?: "détail" | "gros" | "crédit";
  status?: "terminé" | "en_attente" | "annulé";
  author?: { id: string; name: string; email: string } | null;
}

export async function fetchPayments(): Promise<ApiPayment[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
    console.log("payments", data);
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message ||
      "Impossible de charger la liste des paiements.";
    throw new Error(message);
  }

  if (Array.isArray(data)) {
    return data as ApiPayment[];
  }

  const asAny = data as any;
  if (asAny && Array.isArray(asAny.payments)) {
    return asAny.payments as ApiPayment[];
  }

  return [];
}

export async function fetchPaymentById(
  id: number | string,
): Promise<ApiPayment> {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments/${id}`, {
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
      "Impossible de charger le paiement demandé.";
    throw new Error(message);
  }

  // Some backends wrap the object: { payment: { ... } }
  const asAny = data as any;
  if (asAny && asAny.payment) {
    return asAny.payment as ApiPayment;
  }

  return data as ApiPayment;
}

export interface CreatePaymentPayload {
  // Must match Prisma Order.id which is a string/UUID
  orderId: string;
  amount: number;
  method: string;
  reference?: string;
  txnId?: string;
  type?: string;
}

export async function createPayment(
  payload: CreatePaymentPayload,
): Promise<ApiPayment> {
  const res = await fetch(`${API_BASE_URL}/api/v1/payments`, {
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
    console.log("createPayment", data);
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de créer le paiement.";
    throw new Error(message);
  }

  return data as ApiPayment;
}



