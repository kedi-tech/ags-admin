const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://10.15.8.137:5000";

export interface Color {
  id: string;
  name: string;
  hexCode: string;
  createdAt: string;
}

export async function fetchColors(): Promise<Color[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/colors`, {
    method: "GET",
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de charger les couleurs.";
    throw new Error(message);
  }

  const items = (data as any)?.colors || data;
  return (items as Color[]) || [];
}

