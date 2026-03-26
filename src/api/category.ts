import type { Category } from "@/data/erp-data";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://10.15.8.137:5000";

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/categories`, {
    method: "GET",
  });

  let data: unknown = null;
  try {
    data = await res.json();
    console.log("categories", data);
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message ||
      "Impossible de charger la liste des catégories.";
    throw new Error(message);
  }

  return (data as Category[]) || [];
}

export async function fetchCategoryById(
  id: string | number,
): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/api/v1/categories/${id}`, {
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
      "Impossible de charger la catégorie demandée.";
    throw new Error(message);
  }

  return data as Category;
}

export interface CreateCategoryPayload {
  name: string;
  description: string;
  icon: string;
}

export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/api/v1/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
      "Impossible de créer la catégorie.";
    throw new Error(message);
  }

  return data as Category;
}

export async function updateCategory(
  id: string | number,
  payload: Partial<CreateCategoryPayload>,
): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/api/v1/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
      "Impossible de mettre à jour la catégorie.";
    throw new Error(message);
  }

  return data as Category;
}

export async function deleteCategory(id: string | number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/categories/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // ignore parse error
    }
    const message =
      (data as any)?.message ||
      "Impossible de supprimer la catégorie.";
    throw new Error(message);
  }
}

