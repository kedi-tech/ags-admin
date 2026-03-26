const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://10.15.8.137:5000';

export interface ApiCodePromo {
  id: string;
  code: string;
  discount: number;
  minimumOrderAmount?: number | null;
  expiresAt: string;
  createdAt: string;
  userId?: string | null;
  author?: { id: string; name: string; email: string } | null;
  orders?: { id: string }[];
}

export async function fetchCodePromos(): Promise<ApiCodePromo[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/code-promos`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message = (data as any)?.message || 'Impossible de charger les codes promo.';
    throw new Error(message);
  }

  if (Array.isArray(data)) return data as ApiCodePromo[];
  const asAny = data as any;
  if (asAny && Array.isArray(asAny.promos)) return asAny.promos as ApiCodePromo[];
  if (asAny && Array.isArray(asAny.data)) return asAny.data as ApiCodePromo[];
  return [];
}

export interface CreateCodePromoPayload {
  code: string;
  discount: number;
  minimumOrderAmount?: number | null;
  expiresAt: string;
}

export async function createCodePromo(payload: CreateCodePromoPayload): Promise<ApiCodePromo> {
  const res = await fetch(`${API_BASE_URL}/api/v1/code-promos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
    },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message = (data as any)?.message || 'Impossible de créer le code promo.';
    throw new Error(message);
  }

  return data as ApiCodePromo;
}

export async function updateCodePromo(
  id: string,
  payload: Partial<CreateCodePromoPayload>,
): Promise<ApiCodePromo> {
  const res = await fetch(`${API_BASE_URL}/api/v1/code-promos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
    },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message = (data as any)?.message || 'Impossible de modifier le code promo.';
    throw new Error(message);
  }

  return data as ApiCodePromo;
}

export async function deleteCodePromo(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/code-promos/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message = (data as any)?.message || 'Impossible de supprimer le code promo.';
    throw new Error(message);
  }
}
