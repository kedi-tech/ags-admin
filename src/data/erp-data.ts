export type OrderStatus = 'payé' | 'en_attente' | 'en_traitement' | 'livré' | 'annulé';
export type UserRole = 'admin' | 'personnel' | 'client';
export type UserStatus = 'actif' | 'bloqué';
export type StockStatus = 'en_stock' | 'stock_faible' | 'rupture';
export type AdjustmentType = 'addition' | 'réduction' | 'endommagé' | 'retour' | 'correction';
export type CreditStatus = 'ACTIVE' | 'PAID' | 'EXPIRED' | 'CANCELED';
export type PaymentSource = 'détail' | 'gros' | 'crédit';
export type PaymentMethod = 'espèces' | 'carte' | 'virement' | 'chèque' | 'OM' | 'KULU' | 'MoMo';
export type PaymentStatus = 'terminé' | 'en_attente' | 'annulé';

export interface Product {
  // Aligned with backend Prisma model (UUID string IDs)
  id: string;
  name: string;
  description?: string | null;
  price: number;
  companyPrice?: number | null;
  isPromotional: boolean;
  promotionalPrice?: number | null;
  stock: number;
  sku: string;
  isActive: boolean;
  // New relational fields
  subCategoryId: string;
  // Extra view fields derived from relations
  categoryId?: string;
  categoryName?: string;
  subCategoryName?: string;
  sizeId?: string;
  sizeName?: string;
  colorId?: string;
  colorName?: string;
  imageUrl?: string;
  // Optional list of all image URLs for detail views
  imageUrls?: string[];
  // Full image objects from backend (for edit/delete)
  images?: { id: string; url: string }[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  icon: string;
  createdAt: string;
}

export interface Order {
  id: string;
  customer: string;
  type: 'détail' | 'gros' | 'crédit';
  status: OrderStatus;
  amount: number;
  date: string;
  items: number;
}

export interface CreditAccount {
  // Frontend view model aligned with Prisma Credit
  id: string;                // maps to Credit.id
  company: string;           // derived from Client.name
  contact: string;           // derived from Client.phone or contact person
  creditLimit: number;       // from Client.creditLimit
  outstandingBalance: number;// maps to Credit.amount
  status: CreditStatus;      // maps to Credit.status
  lastPayment: string;       // derived from latest Payment.createdAt (if any)
  // Link this credit account to a specific order
  orderId?: string;          // maps to Credit.orderId
  // New: credit limited / expiration date from Prisma limitedDate
  limitedDate?: string;
}

export interface CreditTransaction {
  id: string;
  date: string;
  type: 'achat_crédit' | 'paiement_reçu' | 'ajustement_crédit';
  description: string;
  amount: number;
  balance: number;
}

export interface Payment {
  id: string;
  date: string;
  source: PaymentSource;
  method: PaymentMethod;
  reference: string;
  amount: number;
  status: PaymentStatus;
  customer: string;
  orderId?: string;
  txnId?: string;
  type?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin: string;
  status: UserStatus;
  avatar: string;
}

export interface StockAdjustment {
  id: string;
  dateTime: string;
  product: string;
  sku: string;
  type: AdjustmentType;
  qtyAdjusted: number;
  prevStock: number;
  newStock: number;
  adminUser: string;
}

export const products: Product[] = [];

export const categories: Category[] = [
  { id: 'C001', name: 'Habillement', description: 'Vêtements de saison, vêtements de sport', productCount: 42, icon: 'checkroom', createdAt: '12 Jan 2024' },
  { id: 'C002', name: 'Électronique', description: 'Appareils électroniques et accessoires', productCount: 28, icon: 'devices', createdAt: '15 Jan 2024' },
  { id: 'C003', name: 'Beauté & Soins', description: 'Soins de la peau premium', productCount: 35, icon: 'spa', createdAt: '18 Jan 2024' },
  { id: 'C004', name: 'Sports & Plein Air', description: 'Équipement de fitness', productCount: 19, icon: 'sports_soccer', createdAt: '20 Jan 2024' },
  { id: 'C005', name: 'Maison & Cuisine', description: 'Appareils et ustensiles de cuisine', productCount: 28, icon: 'kitchen', createdAt: '22 Jan 2024' },
  { id: 'C006', name: 'Alimentation & Boissons', description: 'Produits alimentaires et boissons', productCount: 15, icon: 'restaurant', createdAt: '25 Jan 2024' },
];

export const orders: Order[] = [];

export const creditAccounts: CreditAccount[] = [];

export const creditTransactions: CreditTransaction[] = [];

export const payments: Payment[] = [];

export const users: User[] = [];

export const stockAdjustments: StockAdjustment[] = [
  { id: 'ADJ-001', dateTime: '15 Oct 2024, 10:30', product: 'Casque Audio Premium', sku: 'ELC-042', type: 'réduction', qtyAdjusted: -5, prevStock: 17, newStock: 12, adminUser: 'Alexandre Dubois' },
  { id: 'ADJ-002', dateTime: '14 Oct 2024, 15:45', product: 'T-Shirt Classique', sku: 'TSH-001', type: 'addition', qtyAdjusted: 50, prevStock: 95, newStock: 145, adminUser: 'Claire Martin' },
  { id: 'ADJ-003', dateTime: '14 Oct 2024, 11:20', product: 'Crème Hydratante', sku: 'BEA-018', type: 'endommagé', qtyAdjusted: -3, prevStock: 3, newStock: 0, adminUser: 'Alexandre Dubois' },
  { id: 'ADJ-004', dateTime: '13 Oct 2024, 09:15', product: 'Bouteille Thermos', sku: 'KIT-045', type: 'retour', qtyAdjusted: 2, prevStock: 0, newStock: 2, adminUser: 'Thomas Leroy' },
  { id: 'ADJ-005', dateTime: '12 Oct 2024, 16:00', product: 'Veste Imperméable', sku: 'TSH-055', type: 'correction', qtyAdjusted: -2, prevStock: 10, newStock: 8, adminUser: 'Isabelle Blanc' },
];
