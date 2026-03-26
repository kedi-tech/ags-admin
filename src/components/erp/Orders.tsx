import React, { useEffect, useState, useRef } from 'react';
import { fetchOrders, createOrder, updateOrder, updateOrderStatus, cancelOrder, deleteOrder, type CreateOrderPayload } from '@/api/orders';
import { fetchProducts as fetchProductsApi } from '@/api/products';
import { fetchClients, type Client as ApiClient } from '@/api/clients';

// ─── Types ────────────────────────────────────────────────────────────────────

type ClientType = 'INDIVIDUAL' | 'COMPANY';
type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'DELIVERED';

interface Client {
  id: number;
  type: ClientType;
  name: string;
  email?: string;
  phone?: string;
  creditLimit: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  isActive?: boolean;
  // Optional display info for variants
  sizeName?: string;
  colorName?: string;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: Product;
  size?: string | null;
  color?: string | null;
}

interface Payment {
  id: number;
  orderId: number;
  amount: number;
  method: string;
  reference?: string;
  createdAt: string;
}

interface Order {
  id: number;
  clientId: number;
  client: Client;
  status: OrderStatus;
  total: number;
  isCredit: boolean;
  createdAt: string;
  items: OrderItem[];
  payments: Payment[];
  author?: { id: string; name: string; email: string } | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

// Local options for size/color selection when adding items to an order
const ORDER_SIZE_OPTIONS: string[] = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '36', '38', '40', '42', '44', '46', '48', '50',
];

const ORDER_COLOR_OPTIONS: { id: string; label: string; hex: string }[] = [
  { id: 'black',  label: 'Noir',  hex: '#000000' },
  { id: 'white',  label: 'Blanc', hex: '#FFFFFF' },
  { id: 'red',    label: 'Rouge', hex: '#EF4444' },
  { id: 'blue',   label: 'Bleu',  hex: '#3B82F6' },
  { id: 'green',  label: 'Vert',  hex: '#10B981' },
  { id: 'yellow', label: 'Jaune', hex: '#F59E0B' },
  { id: 'purple', label: 'Violet', hex: '#8B5CF6' },
  { id: 'orange', label: 'Orange', hex: '#F97316' },
  { id: 'pink',   label: 'Rose',  hex: '#EC4899' },
  { id: 'brown',  label: 'Brun',  hex: '#854D3D' },
  { id: 'gray',   label: 'Gris',  hex: '#6B7280' },
  { id: 'silver', label: 'Argent', hex: '#9CA3AF' },
  { id: 'gold',   label: 'Or',    hex: '#D97706' },
];

// Orders are now loaded from the API, not mocked locally.

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const fmt = (n: number) =>
  `GNF ${n.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}`;

// ─── Badges ───────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const map: Record<OrderStatus, { label: string; cls: string }> = {
    PAID:      { label: 'Payé',       cls: 'bg-emerald-500/15 text-emerald-400' },
    PENDING:   { label: 'En Attente', cls: 'bg-amber-500/15 text-amber-400'    },
    DELIVERED: { label: 'Livré',      cls: 'bg-blue-500/15 text-blue-400'      },
    CANCELLED: { label: 'Annulé',     cls: 'bg-rose-500/15 text-rose-400'      },
  };
  const s = map[status];
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
};

const ClientTypeBadge: React.FC<{ type: ClientType; isCredit: boolean }> = ({ type, isCredit }) => {
  if (isCredit)
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/15 text-cyan-400">Crédit</span>;
  if (type === 'COMPANY')
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/15 text-indigo-400">Société</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-500/15 text-slate-300">Particulier</span>;
};

// ─── Product Picker Modal ─────────────────────────────────────────────────────

const ProductPickerModal: React.FC<{
  products: Product[];
  existingIds: number[];
  onAdd: (product: Product) => void;
  onClose: () => void;
}> = ({ products, existingIds, onAdd, onClose }) => {
  const [query, setQuery] = useState('');

  const results = products.filter(
    p =>
      p.isActive !== false &&
      !existingIds.includes(p.id) &&
      (p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-700 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-white font-bold text-base">Ajouter un produit</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nom du produit ou SKU..."
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#137fec]/60"
            />
          </div>
        </div>
        {/* Results */}
        <div className="px-3 pb-3 max-h-72 overflow-y-auto space-y-1">
          {results.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">Aucun produit trouvé</p>
          ) : (
            results.map(p => (
              <button
                key={p.id}
                onClick={() => { onAdd(p); onClose(); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-800/60 transition-colors group text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-[#137fec] transition-colors">{p.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{p.sku}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-emerald-400">{fmt(p.price)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">/ unité</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Order Create Modal ───────────────────────────────────────────────────────

const OrderCreateModal: React.FC<{
  onClose: () => void;
  onSave: (payload: CreateOrderPayload) => Promise<void> | void;
  products: Product[];
  initialOrder?: Order | null;
}> = ({ onClose, onSave, products, initialOrder }) => {
  const [form, setForm] = useState({
    clientName: '',
    clientType: 'INDIVIDUAL' as ClientType,
    clientEmail: '',
    status: 'PENDING' as OrderStatus,
    isCredit: false,
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingClients(true);
      try {
        const list = await fetchClients();
        if (!cancelled) setClients(list);
      } catch {
        if (!cancelled) setClients([]);
      } finally {
        if (!cancelled) setLoadingClients(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Prefill when editing an existing order
  useEffect(() => {
    if (!initialOrder) return;
    // Preselect client
    setSelectedClientId(String(initialOrder.clientId));
    // Prefill credit toggle and status
    setForm(prev => ({ ...prev, isCredit: initialOrder.isCredit, status: initialOrder.status }));
    // Prefill cart from existing items
    if (Array.isArray(initialOrder.items) && initialOrder.items.length > 0) {
      const mapped: CartItem[] = initialOrder.items.map((it) => ({
        product: it.product,
        quantity: it.quantity,
        price: it.price,
        size: it.size ?? undefined,
        color: it.color ?? undefined,
      }));
      setCart(mapped);
    }
  }, [initialOrder]);

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addProduct = (product: Product) => {
    setCart(prev => [
      ...prev,
      {
        product,
        quantity: 1,
        price: product.price,
        size: product.sizeName,
        color: product.colorName,
      },
    ]);
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const removeItem = (productId: number) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateItemSize = (productId: number, size: string) => {
    setCart(prev =>
      prev.map(i =>
        i.product.id === productId ? { ...i, size } : i,
      ),
    );
  };

  const updateItemColor = (productId: number, color: string) => {
    setCart(prev =>
      prev.map(i =>
        i.product.id === productId ? { ...i, color } : i,
      ),
    );
  };

  const handleSave = async () => {
    setError('');
    const clientId = selectedClientId.trim();
    if (!clientId) {
      setError("Veuillez sélectionner un client.");
      return;
    }
    if (cart.length === 0) {
      setError("Veuillez ajouter au moins un produit à la commande.");
      return;
    }

    const items = cart.map((c) => ({
      productId: c.product.id,
      quantity: c.quantity,
      size: c.size ?? null,
      color: c.color ?? null,
    }));

    try {
      setSaving(true);
      await onSave({ clientId, isCredit: form.isCredit, items, status: form.status });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la commande.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
            <h2 className="text-white font-bold text-lg">Nouvelle commande</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
          </div>

          <div className="overflow-y-auto flex-1">
            {/* Client section */}
            <div className="p-6 space-y-4 border-b border-slate-800/60">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Informations client</p>
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Client</label>
                <div 
                  className={`flex flex-col bg-slate-800/50 border rounded-lg overflow-hidden transition-colors ${showDropdown ? 'border-[#137fec]/50 ring-1 ring-[#137fec]/20' : 'border-slate-700'}`}
                >
                  <div className="relative border-b border-slate-700/50">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input
                      type="text"
                      placeholder="Filtrer par nom, email ou téléphone..."
                      value={clientSearch}
                      onFocus={() => setShowDropdown(true)}
                      onChange={e => { setClientSearch(e.target.value); setShowDropdown(true); }}
                      className="w-full bg-transparent pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="px-3 py-2.5 text-sm text-white cursor-pointer flex justify-between items-center hover:bg-slate-700/30 transition-colors"
                  >
                    <span className={selectedClientId ? 'text-white font-medium' : 'text-slate-500'}>
                      {selectedClientId 
                        ? clients.find(c => String(c.id) === selectedClientId)?.name 
                        : 'Sélectionner un client'}
                    </span>
                    <span className={`material-symbols-outlined text-slate-500 text-sm transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>
                </div>

                {showDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-[#161f2c] border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                      {clients
                        .filter(c => 
                          c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
                          (c.email && c.email.toLowerCase().includes(clientSearch.toLowerCase())) ||
                          (c.phone && c.phone.includes(clientSearch))
                        )
                        .length > 0 ? (
                        clients
                          .filter(c => 
                            c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
                            (c.email && c.email.toLowerCase().includes(clientSearch.toLowerCase())) ||
                            (c.phone && c.phone.includes(clientSearch))
                          )
                          .map((c) => (
                            <div 
                              key={c.id} 
                              onClick={() => { setSelectedClientId(String(c.id)); setShowDropdown(false); }}
                              className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all ${selectedClientId === String(c.id) ? 'bg-[#137fec] text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                            >
                              <div className="font-semibold">{c.name}</div>
                              {c.email && <div className={`text-[11px] mt-0.5 ${selectedClientId === String(c.id) ? 'text-blue-100' : 'text-slate-500'}`}>{c.email}</div>}
                            </div>
                          ))
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <span className="material-symbols-outlined text-slate-600 text-3xl mb-2">person_search</span>
                          <p className="text-sm text-slate-500 italic">Aucun client trouvé</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type de client</label>
                  <select
                    value={form.clientType}
                    onChange={e => setForm({ ...form, clientType: e.target.value as ClientType })}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
                  >
                    <option value="INDIVIDUAL">Particulier</option>
                    <option value="COMPANY">Société</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Statut</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as OrderStatus })}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
                  >
                    <option value="PENDING">En Attente</option>
                    <option value="PAID">Payé</option>
                    <option value="DELIVERED">Livré</option>
                    <option value="CANCELLED">Annulé</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email (optionnel)</label>
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={e => setForm({ ...form, clientEmail: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
                />
              </div>
              {/* Credit toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm({ ...form, isCredit: !form.isCredit })}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.isCredit ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-[#0d1520] rounded-full shadow transition-transform ${form.isCredit ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-slate-300">Commande à crédit</span>
              </label>
            </div>

            {/* Articles section */}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Articles
                  {cart.length > 0 && (
                    <span className="ml-2 text-[#137fec] normal-case font-semibold">
                      ({cart.reduce((s, i) => s + i.quantity, 0)} unités)
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#137fec]/15 hover:bg-[#137fec]/25 border border-[#137fec]/30 text-[#137fec] rounded-lg text-xs font-semibold transition-colors"
                >
                  <span className="text-base leading-none font-bold">+</span>
                  Ajouter un article
                </button>
              </div>

              {cart.length === 0 ? (
                <div
                  onClick={() => setShowPicker(true)}
                  className="border-2 border-dashed border-slate-700 hover:border-[#137fec]/40 rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-[#137fec]/10 flex items-center justify-center text-xl text-slate-500 group-hover:text-[#137fec] transition-colors font-bold">
                    +
                  </div>
                  <p className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors">
                    Cliquer pour ajouter des produits
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/60 border border-slate-700/70 rounded-xl px-4 py-3"
                    >
                      {/* Col 1: Product info + quantity */}
                      <div className="flex flex-col gap-2 min-w-0">
                        <div>
                          <p className="text-sm font-semibold text-white truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {item.product.sku} · {fmt(item.price)}/u
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Quantité</span>
                          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 rounded-lg px-1 py-1 shrink-0">
                            <button
                              onClick={() => updateQty(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors text-base leading-none"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e => updateQty(item.product.id, parseInt(e.target.value) || 1)}
                              className="w-10 text-center bg-transparent text-sm font-bold text-white focus:outline-none"
                            />
                            <button
                              onClick={() => updateQty(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors text-base leading-none"
                            >
                              +
                            </button>
                          </div>
                          <p className="ml-auto text-sm font-bold text-white">
                            {fmt(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>

                      {/* Col 2: Size, color, delete */}
                      <div className="flex flex-col md:items-end gap-2">
                        <div className="flex w-full md:w-auto flex-row md:flex-col gap-2">
                          <select
                            value={item.size ?? ''}
                            onChange={e => updateItemSize(item.product.id, e.target.value)}
                            className="flex-1 bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-[#137fec]/60"
                          >
                            <option value="">Taille</option>
                            {ORDER_SIZE_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span>Couleur</span>
                              <input
                                type="color"
                                value={item.color ?? '#000000'}
                                onChange={e => updateItemColor(item.product.id, e.target.value)}
                                className="w-8 h-6 rounded border border-slate-600 bg-transparent p-0 cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="self-end text-slate-600 hover:text-rose-400 transition-colors text-base leading-none"
                          title="Retirer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total row */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#137fec]/5 border border-[#137fec]/20 rounded-xl mt-1">
                    <span className="text-sm font-bold text-slate-300">Total commande</span>
                    <span className="text-lg font-black text-white">{fmt(total)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 shrink-0">
            <p className="text-xs text-slate-500">
              {cart.length > 0
                ? `${cart.length} produit(s) · ${cart.reduce((s, i) => s + i.quantity, 0)} unité(s)`
                : 'Aucun article ajouté'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
                )}
                Créer la commande
              </button>
            </div>
            {error && (
              <p className="mt-2 text-[11px] text-rose-400 text-right">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {showPicker && (
        <ProductPickerModal
          products={products}
          existingIds={cart.map(i => i.product.id)}
          onAdd={addProduct}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
};

// ─── Order Detail ─────────────────────────────────────────────────────────────

const OrderDetail: React.FC<{
  order: Order;
  onBack: () => void;
  onStatusChange: (id: number, status: OrderStatus) => void;
  onDelete: (id: number) => void;
  onEdit: (order: Order) => void;
  onNavigate?: (page: string) => void;
}> = ({ order, onBack, onStatusChange, onDelete, onEdit, onNavigate }) => {
  const PAGE_SIZE = 6;
  const [statusOverride, setStatusOverride] = useState(order.status);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [detailItemsPage, setDetailItemsPage] = useState(1);

  const payments = Array.isArray(order.payments) ? order.payments : [];
  const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = order.total - paidAmount;
  const orderItemsTotalPages = Math.max(
    1,
    Math.ceil(order.items.length / PAGE_SIZE),
  );
  const paginatedOrderItems = order.items.slice(
    (detailItemsPage - 1) * PAGE_SIZE,
    detailItemsPage * PAGE_SIZE,
  );

  useEffect(() => {
    setDetailItemsPage(1);
  }, [order.id]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-[#137fec] hover:text-blue-400 font-medium transition-colors">
          Gestion des Commandes
        </button>
        <span className="text-slate-500">›</span>
        <span className="text-white font-medium">CMD-{String(order.id).padStart(3, '0')}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Commande #{String(order.id).padStart(3, '0')}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {order.client.name} · {formatDate(order.createdAt)}
          </p>
          {order.author && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-[#137fec] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {order.author.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-400">
                Créé par <span className="text-slate-200 font-medium">{order.author.name}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors"
          >
            ← Retour
          </button>
          <button
            onClick={() => onEdit(order)}
            className="flex items-center gap-2 px-4 py-2 border border-sky-500/50 text-sky-400 rounded-lg text-sm font-medium hover:bg-sky-500/10 transition-colors"
          >
            ✏️ Modifier
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 border border-rose-500/50 text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-500/10 transition-colors"
          >
            🗑 Supprimer
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer la commande</h3>
            <p className="text-slate-400 text-sm mb-4">
              Êtes-vous sûr de vouloir supprimer la commande #{order.id} ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => { onDelete(order.id); onBack(); }}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Type</p>
          {order.client && (
            <ClientTypeBadge type={order.client.type} isCredit={order.isCredit} />
          )}
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Statut</p>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={statusOverride} />
            <select
              value={statusOverride}
              onChange={e => {
                const s = e.target.value as OrderStatus;
                setStatusOverride(s);
              }}
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-[#137fec]/50"
            >
              <option value="PENDING">En Attente</option>
              <option value="PAID">Payé</option>
              <option value="DELIVERED">Livré</option>
              <option value="CANCELLED">Annulé</option>
            </select>
            <button
              onClick={() => onStatusChange(order.id, statusOverride)}
              disabled={statusOverride === order.status}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-[#137fec] text-white hover:bg-[#1070d4] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mettre à jour
            </button>
          </div>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total</p>
          <p className="text-xl font-black text-white">{fmt(order.total)}</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Articles</p>
          <p className="text-xl font-black text-white">
            {order.items.reduce((s, i) => s + i.quantity, 0)}
          </p>
        </div>
      </div>

      {/* Client & Payments */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 items-center justify-center">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <span className="text-[#137fec]">👤</span> Client
          </h3>
          <p className="text-sm font-semibold text-white">
            {order.client?.name ?? 'Client inconnu'}
          </p>
          {order.client?.email && (
            <p className="text-xs text-slate-400 mt-1">{order.client.email}</p>
          )}
          {order.client && (
            <p className="text-xs text-slate-400 mt-1">
              {order.client.type === 'COMPANY' ? 'Société' : 'Particulier'}
              {order.client.creditLimit > 0 && ` · Limite crédit : ${fmt(order.client.creditLimit)}`}
            </p>
          )}
        </div>
        {/* <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <span className="text-[#137fec]">💳</span> Paiements
          </h3>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun paiement enregistré</p>
          ) : (
            payments.map(p => (
              <div key={p.id} className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-300">
                  {p.method}{p.reference ? ` · ${p.reference}` : ''}
                </span>
                <span className="text-emerald-400 font-semibold">{fmt(p.amount)}</span>
              </div>
            ))
          )}
          {order.isCredit && remaining > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between text-sm">
              <span className="text-amber-400">Restant dû</span>
              <span className="text-amber-400 font-bold">{fmt(remaining)}</span>
            </div>
          )}
        </div> */}
      </div>

      {/* Line items */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-bold">Détail des articles</h3>
          <p className="text-slate-400 text-xs mt-0.5">{order.items.length} ligne(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                  Image
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                  Produit
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                  SKU
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                  Taille
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                  Couleur
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                  Qté
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                  Prix unit.
                </th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrderItems.map(item => {
                const product: any = item.product || {};
                const imageUrl =
                  product.imageUrl ||
                  (Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0].url
                    : undefined);

                return (
                  <tr
                    key={item.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => {
                      if (product && product.id) {
                        try {
                          window.localStorage.setItem('erp:selectedProductId', String(product.id));
                        } catch {
                          // ignore storage errors
                        }
                        onNavigate?.('produits');
                      }
                    }}
                  >
                    <td className="px-6 py-3.5">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name || 'Produit'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-slate-500 text-base">
                            inventory_2
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium text-white">
                      {product.name}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono text-slate-400">
                      {product.sku}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-300">
                      {item.size ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-300">
                      {item.color ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-slate-400 font-mono">{item.color}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-300 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-300 text-right">
                      {fmt(item.price)}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-white text-right">
                      {fmt(item.price * item.quantity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Page {detailItemsPage} sur {orderItemsTotalPages} · {order.items.length} résultats
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDetailItemsPage((p) => Math.max(1, p - 1))}
              disabled={detailItemsPage === 1}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() =>
                setDetailItemsPage((p) => Math.min(orderItemsTotalPages, p + 1))
              }
              disabled={detailItemsPage === orderItemsTotalPages}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Total commande</span>
            <span className="text-xl font-black text-white">{fmt(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Orders Component ────────────────────────────────────────────────────

interface OrdersProps {
  onNavigate?: (page: string) => void;
}

const Orders: React.FC<OrdersProps> = ({ onNavigate }) => {
  const PAGE_SIZE = 6;
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'INDIVIDUAL' | 'COMPANY' | 'credit'>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ id: number; status: OrderStatus } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [apiOrders, apiProducts] = await Promise.all([
          fetchOrders(),
          fetchProductsApi(),
        ]);
        if (!cancelled) {
          if (Array.isArray(apiOrders)) {
            setOrders(apiOrders as any as Order[]);
          }
          if (Array.isArray(apiProducts)) {
            // Map API product type to the simplified Product used in this screen
            const mapped: Product[] = apiProducts.map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: p.price,
              isActive: p.isActive,
              sizeName: p.sizeName,
              colorName: p.colorName,
            }));
            setProducts(mapped);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Erreur lors du chargement des commandes.";
          setLoadError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async (payload: CreateOrderPayload) => {
    const created = await createOrder(payload);
    // Append the newly created order from backend to the top of the list
    setOrders(prev => [created as any as Order, ...prev]);
  };

  const handleUpdate = async (id: number, payload: CreateOrderPayload) => {
    const updated = await updateOrder(id, payload);
    setOrders(prev =>
      prev.map(o => (o.id === id ? (updated as any as Order) : o)),
    );
  };

  const applyStatusChange = async (id: number, status: OrderStatus) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    try {
      if (status === 'CANCELLED') {
        await cancelOrder(id);
      } else {
        await updateOrderStatus(id, status);
      }
    } catch (err) {
      console.error('Failed to update order status', err);
      // On error, reload orders from API to stay consistent
      try {
        const apiOrders = await fetchOrders();
        if (Array.isArray(apiOrders)) {
          setOrders(apiOrders as any as Order[]);
        }
      } catch {
        // ignore secondary failure
      }
    }
  };

  const handleStatusChange = (id: number, status: OrderStatus) => {
    if (status === 'CANCELLED') {
      setStatusConfirm({ id, status });
      return;
    }
    void applyStatusChange(id, status);
  };

  const handleDelete = async (id: number) => {
    const prev = orders;
    // Optimistic UI: remove locally
    setOrders(prev.filter(o => o.id !== id));
    setSelectedOrder(null);
    setDeleteConfirmOrder(null);
    try {
      await deleteOrder(id);
    } catch (err) {
      console.error('Failed to delete order', err);
      // Revert list on error
      setOrders(prev);
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de supprimer la commande.";
      setLoadError(message);
    }
  };

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const clientType = o.client?.type;
    const matchType =
      typeFilter === 'all' ||
      (typeFilter === 'credit' && o.isCredit) ||
      (typeFilter !== 'credit' && !o.isCredit && clientType === typeFilter);
    const clientName = o.client?.name?.toLowerCase() ?? '';
    const matchSearch =
      clientName.includes(search.toLowerCase()) ||
      String(o.id).includes(search);
    return matchStatus && matchType && matchSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedOrders = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pendingCount   = orders.filter(o => o.status === 'PENDING').length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;
  const creditCount    = orders.filter(o => o.isCredit && o.status !== 'CANCELLED').length;

  // Detail view
  const currentOrder = selectedOrder
    ? orders.find(o => o.id === selectedOrder.id) ?? selectedOrder
    : null;

  if (currentOrder) {
    return (
      <OrderDetail
        order={currentOrder}
        onBack={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onEdit={(order) => {
          setEditingOrder(order);
          setShowCreateModal(true);
        }}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 sm:p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Commandes</h1>
            <p className="text-slate-400 text-sm mt-1">Surveiller et traiter les ventes</p>
          </div>
        {loadError && (
          <span className="text-xs text-amber-300">
            {loadError}
          </span>
        )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            + Créer une Nouvelle Commande
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher (client, ID)..."
              className="bg-slate-800/50 border border-slate-700 rounded-lg pl-4 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 w-64"
            />
          </div>
          {/* Type filter */}
          <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
            {([
              { key: 'all',        label: 'Tous'        },
              { key: 'INDIVIDUAL', label: 'Particulier' },
              { key: 'COMPANY',    label: 'Société'     },
              { key: 'credit',     label: 'Crédit'      },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  typeFilter === t.key ? 'bg-[#137fec] text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-[#137fec]/50"
          >
            <option value="all">Tous les Statuts</option>
            <option value="PAID">Payé</option>
            <option value="PENDING">En Attente</option>
            <option value="DELIVERED">Livré</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>
        {loading && (
          <span className="text-xs text-slate-500">
            Chargement des commandes…
          </span>
        )}

        {/* Table */}
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['ID', 'Client', 'Type', 'Articles', 'Total', 'Date', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map(order => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-[#137fec]">
                      #{String(order.id).padStart(3, '0')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      <div>{order.client.name}</div>
                      {order.client.email && (
                        <div className="text-xs text-slate-500">{order.client.email}</div>
                      )}
                      {order.client.phone && (
                        <div className="text-xs text-slate-500">{order.client.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ClientTypeBadge type={order.client.type} isCredit={order.isCredit} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} unités
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">{fmt(order.total)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Inline status update */}
                        <select
                          value={order.status}
                          onChange={e =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          className="bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-[#137fec]/50"
                          title="Mettre à jour le statut"
                        >
                          <option value="PENDING">En Attente</option>
                          <option value="PAID">Payé</option>
                          <option value="DELIVERED">Livré</option>
                          <option value="CANCELLED">Annulé</option>
                        </select>
                        <button
                          onClick={() => {
                            setEditingOrder(order);
                            setShowCreateModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          👁
                        </button>
                        <button
                          onClick={() => setDeleteConfirmOrder(order)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm">
                      Aucune commande trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Page {currentPage} sur {totalPages} · {filtered.length} résultats
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="border-t border-slate-800 bg-[#0d1520] px-6 py-4 shrink-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-slate-800/30 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-400 mb-1">Total des Commandes</p>
            <p className="text-xl font-black text-white">{orders.length}</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-400 mb-1">En Attente</p>
            <p className="text-xl font-black text-amber-400">{pendingCount}</p>
          </div>
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-400 mb-1">Commandes Crédit</p>
            <p className="text-xl font-black text-cyan-400">{creditCount}</p>
            </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-400 mb-1">Livrées</p>
            <p className="text-xl font-black text-blue-400">{deliveredCount}</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <OrderCreateModal
          onClose={() => setShowCreateModal(false)}
          onSave={editingOrder ? (payload) => handleUpdate(editingOrder.id, payload) : handleCreate}
          products={products}
          initialOrder={editingOrder}
        />
      )}

      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmOrder(null)} />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer la commande</h3>
            <p className="text-slate-400 text-sm mb-4">
              Supprimer la commande #{deleteConfirmOrder.id} ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmOrder(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmOrder.id)}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {statusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setStatusConfirm(null)}
          />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Annuler la commande</h3>
            <p className="text-slate-400 text-sm mb-4">
              Êtes-vous sûr de vouloir annuler la commande #{statusConfirm.id} ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStatusConfirm(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Non
              </button>
              <button
                onClick={async () => {
                  const { id, status } = statusConfirm;
                  setStatusConfirm(null);
                  await applyStatusChange(id, status);
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;