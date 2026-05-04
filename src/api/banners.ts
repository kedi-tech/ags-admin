const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api";

type ApiBanner = {
  id: string;
  title?: string | null;
  description?: string | null;
  imageUrl: string;
  btnLink?: string | null;
  isActive: boolean;
  createdAt: string;
  author?: { id: string; name: string; email: string } | null;
};

export interface Banner {
  id: string;
  title?: string | null;
  description?: string | null;
  imageUrl: string;
  btnLink?: string | null;
  isActive: boolean;
  createdAt: string;
  author?: { id: string; name: string; email: string } | null;
}

export interface CreateBannerPayload {
  title?: string | null;
  description?: string | null;
  btnLink?: string | null;
  isActive?: boolean;
}

const mapBanner = (b: ApiBanner): Banner => ({
  id: b.id,
  title: b.title ?? null,
  description: b.description ?? null,
  imageUrl: b.imageUrl,
  btnLink: b.btnLink ?? null,
  isActive: b.isActive,
  createdAt: b.createdAt,
  author: b.author ?? null,
});

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
});

export async function fetchBanners(): Promise<Banner[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/banners`, {
    headers: authHeader(),
  });
  let data: unknown = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error((data as any)?.message || "Impossible de charger les bannières.");
  }
  const list = Array.isArray(data) ? data : ((data as any)?.banners ?? []);
  return list.map(mapBanner);
}

export async function fetchBannerById(id: string): Promise<Banner> {
  const res = await fetch(`${API_BASE_URL}/api/v1/banners/${id}`, {
    headers: authHeader(),
  });
  let data: unknown = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error((data as any)?.message || "Impossible de charger la bannière.");
  }
  return mapBanner(data as ApiBanner);
}

function buildFormData(payload: CreateBannerPayload, file?: File | null): FormData {
  const formData = new FormData();
  if (payload.title) formData.append("title", payload.title);
  if (payload.description) formData.append("description", payload.description);
  formData.append("isActive", String(payload.isActive ?? true));
  if (payload.btnLink) formData.append("btnLink", payload.btnLink);
  if (file) formData.append("image", file);
  return formData;
}

export async function createBannerWithImage(
  payload: CreateBannerPayload,
  file: File,
): Promise<Banner> {
  const res = await fetch(`${API_BASE_URL}/api/v1/banners`, {
    method: "POST",
    headers: authHeader(),
    body: buildFormData(payload, file),
  });
  let data: unknown = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error((data as any)?.message || "Impossible de créer la bannière.");
  }
  return mapBanner(data as ApiBanner);
}

export async function deleteBanner(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/banners/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!res.ok) {
    let data: unknown = null;
    try { data = await res.json(); } catch { /* ignore */ }
    throw new Error((data as any)?.message || "Impossible de supprimer la bannière.");
  }
}

export async function updateBannerWithImage(
  id: string,
  payload: CreateBannerPayload,
  file?: File | null,
): Promise<Banner> {
  const res = await fetch(`${API_BASE_URL}/api/v1/banners/${id}`, {
    method: "PUT",
    headers: authHeader(),
    body: buildFormData(payload, file),
  });
  let data: unknown = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error((data as any)?.message || "Impossible de mettre à jour la bannière.");
  }
  return mapBanner(data as ApiBanner);
}
