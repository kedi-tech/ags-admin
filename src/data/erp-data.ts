export type OrderStatus = 'payé' | 'en_attente' | 'en_traitement' | 'livré' | 'annulé';
export type UserRole = 'admin' | 'personnel' | 'client';
export type UserStatus = 'actif' | 'bloqué';
export type StockStatus = 'en_stock' | 'stock_faible' | 'rupture';
export type AdjustmentType = 'addition' | 'réduction' | 'endommagé' | 'retour' | 'correction';
export type CreditStatus = 'actif' | 'avertissement' | 'bloqué';
export type PaymentSource = 'détail' | 'gros' | 'crédit';
export type PaymentMethod = 'espèces' | 'carte' | 'virement' | 'chèque';
export type PaymentStatus = 'terminé' | 'en_attente' | 'annulé';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  retailPrice: number;
  wholesalePrice: number;
  quantity: number;
  status: 'actif' | 'inactif';
  stockStatus: StockStatus;
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
  id: string;
  company: string;
  contact: string;
  creditLimit: number;
  outstandingBalance: number;
  status: CreditStatus;
  lastPayment: string;
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

export const products: Product[] = [
  { id: 'P001', name: 'T-Shirt Classique', sku: 'TSH-001', category: 'Habillement', retailPrice: 29.99, wholesalePrice: 18.00, quantity: 145, status: 'actif', stockStatus: 'en_stock' },
  { id: 'P002', name: 'Casque Audio Premium', sku: 'ELC-042', category: 'Électronique', retailPrice: 199.99, wholesalePrice: 140.00, quantity: 12, status: 'actif', stockStatus: 'stock_faible' },
  { id: 'P003', name: 'Crème Hydratante', sku: 'BEA-018', category: 'Beauté & Soins', retailPrice: 45.00, wholesalePrice: 28.00, quantity: 0, status: 'actif', stockStatus: 'rupture' },
  { id: 'P004', name: 'Haltères 10kg', sku: 'SPO-007', category: 'Sports & Plein Air', retailPrice: 89.99, wholesalePrice: 60.00, quantity: 34, status: 'actif', stockStatus: 'en_stock' },
  { id: 'P005', name: 'Veste Imperméable', sku: 'TSH-055', category: 'Habillement', retailPrice: 129.99, wholesalePrice: 85.00, quantity: 8, status: 'actif', stockStatus: 'stock_faible' },
  { id: 'P006', name: 'Cafetière Expresso', sku: 'KIT-012', category: 'Maison & Cuisine', retailPrice: 159.99, wholesalePrice: 110.00, quantity: 56, status: 'actif', stockStatus: 'en_stock' },
  { id: 'P007', name: 'Sérum Vitamine C', sku: 'BEA-031', category: 'Beauté & Soins', retailPrice: 69.99, wholesalePrice: 45.00, quantity: 78, status: 'actif', stockStatus: 'en_stock' },
  { id: 'P008', name: 'Montre Connectée', sku: 'ELC-089', category: 'Électronique', retailPrice: 299.99, wholesalePrice: 210.00, quantity: 5, status: 'inactif', stockStatus: 'stock_faible' },
  { id: 'P009', name: 'Tapis de Yoga', sku: 'SPO-022', category: 'Sports & Plein Air', retailPrice: 49.99, wholesalePrice: 32.00, quantity: 120, status: 'actif', stockStatus: 'en_stock' },
  { id: 'P010', name: 'Bouteille Thermos', sku: 'KIT-045', category: 'Maison & Cuisine', retailPrice: 34.99, wholesalePrice: 22.00, quantity: 0, status: 'actif', stockStatus: 'rupture' },
];

export const categories: Category[] = [
  { id: 'C001', name: 'Habillement', description: 'Vêtements de saison, vêtements de sport', productCount: 42, icon: 'checkroom', createdAt: '12 Jan 2024' },
  { id: 'C002', name: 'Électronique', description: 'Appareils électroniques et accessoires', productCount: 28, icon: 'devices', createdAt: '15 Jan 2024' },
  { id: 'C003', name: 'Beauté & Soins', description: 'Soins de la peau premium', productCount: 35, icon: 'spa', createdAt: '18 Jan 2024' },
  { id: 'C004', name: 'Sports & Plein Air', description: 'Équipement de fitness', productCount: 19, icon: 'sports_soccer', createdAt: '20 Jan 2024' },
  { id: 'C005', name: 'Maison & Cuisine', description: 'Appareils et ustensiles de cuisine', productCount: 28, icon: 'kitchen', createdAt: '22 Jan 2024' },
  { id: 'C006', name: 'Alimentation & Boissons', description: 'Produits alimentaires et boissons', productCount: 15, icon: 'restaurant', createdAt: '25 Jan 2024' },
];

export const orders: Order[] = [
  { id: 'CMD-001', customer: 'Marie Dupont', type: 'détail', status: 'payé', amount: 189.97, date: '15 Oct 2024', items: 3 },
  { id: 'CMD-002', customer: 'Global Wholesale Corp', type: 'gros', status: 'en_traitement', amount: 4500.00, date: '15 Oct 2024', items: 25 },
  { id: 'CMD-003', customer: 'Jean Martin', type: 'détail', status: 'en_attente', amount: 299.99, date: '14 Oct 2024', items: 1 },
  { id: 'CMD-004', customer: 'TechDistrib SARL', type: 'crédit', status: 'livré', amount: 12800.00, date: '14 Oct 2024', items: 64 },
  { id: 'CMD-005', customer: 'Sophie Bernard', type: 'détail', status: 'annulé', amount: 45.00, date: '13 Oct 2024', items: 1 },
  { id: 'CMD-006', customer: 'MegaSupply Inc', type: 'gros', status: 'en_attente', amount: 7200.00, date: '13 Oct 2024', items: 48 },
  { id: 'CMD-007', customer: 'Lucas Lefebvre', type: 'détail', status: 'payé', amount: 129.99, date: '12 Oct 2024', items: 2 },
  { id: 'CMD-008', customer: 'Fashion House Ltd', type: 'crédit', status: 'en_traitement', amount: 8750.00, date: '12 Oct 2024', items: 35 },
];

export const creditAccounts: CreditAccount[] = [
  { id: 'CR001', company: 'Global Wholesale Corp', contact: 'Robert Chen', creditLimit: 50000, outstandingBalance: 23450, status: 'actif', lastPayment: '01 Oct 2024' },
  { id: 'CR002', company: 'TechDistrib SARL', contact: 'Pierre Moreau', creditLimit: 30000, outstandingBalance: 28100, status: 'avertissement', lastPayment: '15 Sep 2024' },
  { id: 'CR003', company: 'MegaSupply Inc', contact: 'Sarah Johnson', creditLimit: 75000, outstandingBalance: 15600, status: 'actif', lastPayment: '05 Oct 2024' },
  { id: 'CR004', company: 'Fashion House Ltd', contact: 'Emma Wilson', creditLimit: 20000, outstandingBalance: 20000, status: 'bloqué', lastPayment: '01 Aug 2024' },
];

export const creditTransactions: CreditTransaction[] = [
  { id: 'TRX-001', date: '15 Oct 2024', type: 'achat_crédit', description: 'Commande CMD-004', amount: 12800, balance: 23450 },
  { id: 'TRX-002', date: '10 Oct 2024', type: 'paiement_reçu', description: 'Virement bancaire', amount: -5000, balance: 10650 },
  { id: 'TRX-003', date: '05 Oct 2024', type: 'achat_crédit', description: 'Commande CMD-002', amount: 4500, balance: 15650 },
  { id: 'TRX-004', date: '01 Oct 2024', type: 'paiement_reçu', description: 'Chèque #4521', amount: -8000, balance: 11150 },
  { id: 'TRX-005', date: '28 Sep 2024', type: 'ajustement_crédit', description: 'Correction facturation', amount: -200, balance: 19150 },
];

export const payments: Payment[] = [
  { id: 'PAY-001', date: '15 Oct 2024', source: 'détail', method: 'carte', reference: 'TXN-8821', amount: 189.97, status: 'terminé', customer: 'Marie Dupont' },
  { id: 'PAY-002', date: '14 Oct 2024', source: 'crédit', method: 'virement', reference: 'VIR-4521', amount: 5000.00, status: 'terminé', customer: 'Global Wholesale Corp' },
  { id: 'PAY-003', date: '14 Oct 2024', source: 'détail', method: 'espèces', reference: 'ESP-0119', amount: 299.99, status: 'en_attente', customer: 'Jean Martin' },
  { id: 'PAY-004', date: '13 Oct 2024', source: 'gros', method: 'virement', reference: 'VIR-3301', amount: 7200.00, status: 'terminé', customer: 'MegaSupply Inc' },
  { id: 'PAY-005', date: '12 Oct 2024', source: 'détail', method: 'carte', reference: 'TXN-7743', amount: 129.99, status: 'terminé', customer: 'Lucas Lefebvre' },
  { id: 'PAY-006', date: '11 Oct 2024', source: 'crédit', method: 'chèque', reference: 'CHQ-8821', amount: 8000.00, status: 'annulé', customer: 'TechDistrib SARL' },
];

export const users: User[] = [
  { id: 'U001', name: 'Alexandre Dubois', email: 'a.dubois@store.fr', role: 'admin', lastLogin: '15 Oct 2024, 09:23', status: 'actif', avatar: 'AD' },
  { id: 'U002', name: 'Claire Martin', email: 'c.martin@store.fr', role: 'personnel', lastLogin: '15 Oct 2024, 08:45', status: 'actif', avatar: 'CM' },
  { id: 'U003', name: 'Thomas Leroy', email: 't.leroy@store.fr', role: 'personnel', lastLogin: '14 Oct 2024, 17:30', status: 'actif', avatar: 'TL' },
  { id: 'U004', name: 'Isabelle Blanc', email: 'i.blanc@store.fr', role: 'admin', lastLogin: '13 Oct 2024, 11:15', status: 'actif', avatar: 'IB' },
  { id: 'U005', name: 'Robert Chen', email: 'r.chen@globalwholesale.com', role: 'client', lastLogin: '12 Oct 2024, 14:20', status: 'actif', avatar: 'RC' },
  { id: 'U006', name: 'Emma Wilson', email: 'e.wilson@fashionhouse.com', role: 'client', lastLogin: '01 Oct 2024, 10:00', status: 'bloqué', avatar: 'EW' },
];

export const stockAdjustments: StockAdjustment[] = [
  { id: 'ADJ-001', dateTime: '15 Oct 2024, 10:30', product: 'Casque Audio Premium', sku: 'ELC-042', type: 'réduction', qtyAdjusted: -5, prevStock: 17, newStock: 12, adminUser: 'Alexandre Dubois' },
  { id: 'ADJ-002', dateTime: '14 Oct 2024, 15:45', product: 'T-Shirt Classique', sku: 'TSH-001', type: 'addition', qtyAdjusted: 50, prevStock: 95, newStock: 145, adminUser: 'Claire Martin' },
  { id: 'ADJ-003', dateTime: '14 Oct 2024, 11:20', product: 'Crème Hydratante', sku: 'BEA-018', type: 'endommagé', qtyAdjusted: -3, prevStock: 3, newStock: 0, adminUser: 'Alexandre Dubois' },
  { id: 'ADJ-004', dateTime: '13 Oct 2024, 09:15', product: 'Bouteille Thermos', sku: 'KIT-045', type: 'retour', qtyAdjusted: 2, prevStock: 0, newStock: 2, adminUser: 'Thomas Leroy' },
  { id: 'ADJ-005', dateTime: '12 Oct 2024, 16:00', product: 'Veste Imperméable', sku: 'TSH-055', type: 'correction', qtyAdjusted: -2, prevStock: 10, newStock: 8, adminUser: 'Isabelle Blanc' },
];
