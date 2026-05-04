import type { Product } from "@/data/erp-data";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api";

type ApiProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  deliveryPrice?: number | null;
  stock: number;
  sku: string;
  isActive: boolean;
  isPromotional: boolean;
  promotionalPrice?: number | null;
  // New backend shape: category is now a top-level relation,
  // and subCategory no longer nests category inside.
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    createdAt: string;
  } | null;
  subCategoryId: string;
  subCategory?: {
    id: string;
    name: string;
    categoryId?: string;
    createdAt?: string;
  } | null;
  // Backend currently returns scalar size/color
  size?: string | null;
  color?: string | null;
  images?: { id: string; url: string }[];
  createdAt: string;
  author?: { id: string; name: string; email: string } | null;
};

const mapProduct = (p: ApiProduct): Product => ({
  id: p.id,
  name: p.name,
  description: p.description ?? null,
  price: p.price,
  deliveryPrice: p.deliveryPrice ?? null,
  isPromotional: p.isPromotional,
  promotionalPrice: p.promotionalPrice ?? null,
  stock: p.stock,
  sku: p.sku,
  isActive: p.isActive,
  subCategoryId: p.subCategoryId,
  // Prefer explicit category fields from backend, fall back to legacy nesting if present
  categoryId: p.categoryId ?? p.category?.id ?? p.subCategory?.categoryId,
  categoryName: p.category?.name,
  subCategoryName: p.subCategory?.name,
  sizeName: p.size ?? undefined,
  colorName: p.color ?? undefined,
  imageUrl: p.images && p.images.length > 0 ? p.images[0].url : undefined,
  imageUrls: p.images ? p.images.map(img => img.url) : undefined,
  images: p.images,
  createdAt: p.createdAt,
  author: p.author ?? null,
});

export interface CreateProductPayload {
  name: string;
  description?: string | null;
  price: number;
  deliveryPrice?: number | null;
  isPromotional?: boolean;
  promotionalPrice?: number | null;
  stock: number;
  sku: string;
  categoryId?: string;
  subCategoryId: string;
  // Frontend sends size/color as strings, backend maps them to relations
  size?: string | null;
  color?: string | null;
  isActive?: boolean;
  imageUrl?: string;
}

export type UpdateProductPayload = CreateProductPayload;

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/v1/uploads`, {
    method: "POST",
    body: formData,
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
      (data as any)?.message || "Impossible de téléverser l'image du produit.";
    throw new Error(message);
  }

  const url = (data as any)?.url;
  if (typeof url !== "string" || !url) {
    throw new Error("Réponse invalide du serveur lors du téléversement.");
  }

  return url;
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<Product> {
  const body: any = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    deliveryPrice: payload.deliveryPrice,
    isPromotional: payload.isPromotional,
    promotionalPrice: payload.promotionalPrice,
    stock: payload.stock,
    sku: payload.sku,
    size: payload.size ?? null,
    color: payload.color ?? null,
    subCategoryId: payload.subCategoryId,
  };

  if (typeof payload.isActive === "boolean") {
    body.isActive = payload.isActive;
  }

  // Backend example shows "images": "" – send single URL if we have one.
  if (payload.imageUrl) {
    body.images = payload.imageUrl;
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/products`, {
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
      (data as any)?.message || "Impossible de créer le produit.";
    throw new Error(message);
  }

  return mapProduct(data as ApiProduct);
}

export async function createProductWithImages(
  payload: CreateProductPayload,
  files: File[],
): Promise<Product> {
  const formData = new FormData();
  formData.append("name", payload.name);
  if (payload.description != null) {
    formData.append("description", String(payload.description));
  }
  formData.append("price", String(payload.price));
  if (payload.deliveryPrice != null) {
    formData.append("deliveryPrice", String(payload.deliveryPrice));
  }
  if (typeof payload.isPromotional === "boolean") {
    formData.append("isPromotional", String(payload.isPromotional));
  }
  if (payload.promotionalPrice != null) {
    formData.append("promotionalPrice", String(payload.promotionalPrice));
  }
  formData.append("stock", String(payload.stock));
  formData.append("sku", payload.sku);
  if (payload.size != null) {
    formData.append("size", payload.size);
  }
  if (payload.color != null) {
    formData.append("color", payload.color);
  }
  if (payload.categoryId) {
    formData.append("categoryId", payload.categoryId);
  }
  formData.append("subCategoryId", payload.subCategoryId);
  if (typeof payload.isActive === "boolean") {
    formData.append("isActive", String(payload.isActive));
  }

  // Attach image files under "images[]" so multipart parsers receive the full array correctly.
  for (const file of files) {
    formData.append("images[]", file);
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
    body: formData,
  });

  let data: unknown = null;
  try {
    data = await res.json();

  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de créer le produit.";
    throw new Error(message);
  }

  return mapProduct(data as ApiProduct);
}

export async function updateProductWithImages(
  id: string,
  payload: UpdateProductPayload,
  files: File[],
  deleteImageIds: string[],
): Promise<Product> {
  const formData = new FormData();
  formData.append("name", payload.name);
  if (payload.description != null) {
    formData.append("description", String(payload.description));
  }
  formData.append("price", String(payload.price));
  if (payload.deliveryPrice != null) {
    formData.append("deliveryPrice", String(payload.deliveryPrice));
  }
  if (typeof payload.isPromotional === "boolean") {
    formData.append("isPromotional", String(payload.isPromotional));
  }
  if (payload.promotionalPrice != null) {
    formData.append("promotionalPrice", String(payload.promotionalPrice));
  }
  formData.append("stock", String(payload.stock));
  formData.append("sku", payload.sku);
  if (payload.size != null) {
    formData.append("size", payload.size);
  }
  if (payload.color != null) {
    formData.append("color", payload.color);
  }
  if (payload.categoryId) {
    formData.append("categoryId", payload.categoryId);
  }
  formData.append("subCategoryId", payload.subCategoryId);
  if (typeof payload.isActive === "boolean") {
    formData.append("isActive", String(payload.isActive));
  }

  for (const file of files) {
    formData.append("images[]", file);
  }

  if (deleteImageIds && deleteImageIds.length > 0) {
    formData.append("deleteImageIds", JSON.stringify(deleteImageIds));
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
    body: formData,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de mettre à jour le produit.";
    throw new Error(message);
  }

  return mapProduct(data as ApiProduct);
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/products`, {
    method: "GET",
  });

  let data: unknown = null;
  try {
    data = await res.json();
    console.log("product", data);
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message ||
      "Impossible de charger la liste des produits.";
    throw new Error(message);
  }

  const items = (data as ApiProduct[]) || [];
  return items.map(mapProduct);
}

export async function fetchProductById(
  id: string | number,
): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
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
      "Impossible de charger le produit demandé.";
    throw new Error(message);
  }

  return mapProduct(data as ApiProduct);
}

export async function updateProduct(
  id: number,
  payload: UpdateProductPayload,
): Promise<Product> {
  const body: any = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    deliveryPrice: payload.deliveryPrice,
    isPromotional: payload.isPromotional,
    promotionalPrice: payload.promotionalPrice,
    stock: payload.stock,
    sku: payload.sku,
    subCategoryId: payload.subCategoryId,
    categoryId: payload.categoryId,
  };

  if (typeof payload.isActive === "boolean") {
    body.isActive = payload.isActive;
  }

  if (payload.imageUrl) {
    body.images = payload.imageUrl;
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
    method: "PUT",
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
      (data as any)?.message || "Impossible de mettre à jour le produit.";
    throw new Error(message);
  }

  return mapProduct(data as ApiProduct);
}

export async function updateProductIsActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/products/updateProductStatus/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
    },
    body: JSON.stringify({ isActive }),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse error
  }

  if (!res.ok) {
    const message =
      (data as any)?.message || "Impossible de mettre à jour le statut du produit.";
    throw new Error(message);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
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
      (data as any)?.message || "Impossible de supprimer le produit.";
    throw new Error(message);
  }
}


