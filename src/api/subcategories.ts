import type { Category } from "@/data/erp-data";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api";

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
  createdAt: string;
}

export interface CreateSubCategoryPayload {
  name: string;
  categoryId: string;
}

export async function fetchSubCategories(): Promise<SubCategory[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subCategories`, {
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
      (data as any)?.message ||
      "Impossible de charger la liste des sous-catégories.";
    throw new Error(message);
  }

  const items = (data as any)?.subCategories || data;
  return (items as SubCategory[]) || [];
}

export async function createSubCategory(
  payload: CreateSubCategoryPayload,
): Promise<SubCategory> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subCategories`, {
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
      (data as any)?.message ||
      "Impossible de créer la sous-catégorie.";
    throw new Error(message);
  }

  return data as SubCategory;
}

export async function updateSubCategory(
  id: string,
  payload: Partial<CreateSubCategoryPayload>,
): Promise<SubCategory> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subCategories/${id}`, {
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
      (data as any)?.message ||
      "Impossible de mettre à jour la sous-catégorie.";
    throw new Error(message);
  }

  return data as SubCategory;
}

export async function deleteSubCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/subCategories/${id}`, {
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
      (data as any)?.message ||
      "Impossible de supprimer la sous-catégorie.";
    throw new Error(message);
  }
}


