import React, { useState } from 'react';
import { orders as initialOrders, type Order } from '@/data/erp-data';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    payé: { label: 'Payé', cls: 'bg-emerald-500/15 text-emerald-400' },
    en_attente: { label: 'En Attente', cls: 'bg-amber-500/15 text-amber-400' },
    en_traitement: { label: 'En Traitement', cls: 'bg-blue-500/15 text-blue-400' },
    livré: { label: 'Livré', cls: 'bg-emerald-500/15 text-emerald-400' },
    annulé: { label: 'Annulé', cls: 'bg-rose-500/15 text-rose-400' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-500/15 text-slate-400' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const map: Record<string, { label: string; cls: string }> = {
    détail: { label: 'Détail', cls: 'bg-slate-500/15 text-slate-300' },
    gros: { label: 'Gros', cls: 'bg-indigo-500/15 text-indigo-400' },
    crédit: { label: 'Crédit', cls: 'bg-cyan-500/15 text-cyan-400' },
  };
  const t = map[type] || { label: type, cls: 'bg-slate-500/15 text-slate-400' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.cls}`}>{t.label}</span>;
};

// Placeholder line items for detail view (mock data derived from order)
const getOrderLineItems = (order: Order) => {
  const count = order.items;
  const avg = order.amount / count;
  return Array.from({ length: count }, (_, i) => ({
    id: `L${i + 1}`,
    product: `Article ${i + 1}`,
    sku: `SKU-${order.id}-${i + 1}`,
    qty: 1,
    unitPrice: i === count - 1 ? order.amount - avg * (count - 1) : avg,
    total: i === count - 1 ? order.amount - avg * (count - 1) : avg,
  }));
};

const OrderCreateModal: React.FC<{ onClose: () => void; onSave: (order: Partial<Order>) => void }> = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    customer: '',
    type: 'détail' as Order['type'],
    status: 'en_attente' as Order['status'],
    amount: '',
    items: '1',
    date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-lg">Nouvelle commande</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Client</label>
            <input
              value={form.customer}
              onChange={e => setForm({ ...form, customer: e.target.value })}
              placeholder="Nom du client"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as Order['type'] })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="détail">Détail</option>
                <option value="gros">Gros</option>
                <option value="crédit">Crédit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Statut</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as Order['status'] })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="en_attente">En Attente</option>
                <option value="payé">Payé</option>
                <option value="en_traitement">En Traitement</option>
                <option value="livré">Livré</option>
                <option value="annulé">Annulé</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Montant (GNF)</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre d'articles</label>
              <input
                type="number"
                min="1"
                value={form.items}
                onChange={e => setForm({ ...form, items: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
          <button
            onClick={() => {
              onSave({
                customer: form.customer,
                type: form.type,
                status: form.status,
                amount: parseFloat(form.amount) || 0,
                items: parseInt(form.items) || 1,
                date: form.date,
              });
              onClose();
            }}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            Créer la commande
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderDetail: React.FC<{ order: Order; onBack: () => void; onStatusChange: (id: string, status: Order['status']) => void; onDelete?: (id: string) => void }> = ({ order, onBack, onStatusChange, onDelete }) => {
  const lineItems = getOrderLineItems(order);
  const [statusOverride, setStatusOverride] = useState(order.status);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const statusOptions: { key: Order['status']; label: string }[] = [
    { key: 'en_attente', label: 'En Attente' },
    { key: 'payé', label: 'Payé' },
    { key: 'en_traitement', label: 'En Traitement' },
    { key: 'livré', label: 'Livré' },
    { key: 'annulé', label: 'Annulé' },
  ];

  const handleStatusChange = (newStatus: Order['status']) => {
    setStatusOverride(newStatus);
    onStatusChange(order.id, newStatus);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-[#137fec] hover:text-blue-400 transition-colors font-medium">
          Gestion des Commandes
        </button>
        <span className="material-symbols-outlined text-slate-500 text-base">chevron_right</span>
        <span className="text-white font-medium">{order.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Commande {order.id}</h1>
          <p className="text-slate-400 text-sm mt-1">{order.customer} · {order.date}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Retour à la liste
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors">
            <span className="material-symbols-outlined text-lg">print</span>
            Imprimer
          </button>
          {onDelete && (
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 border border-rose-500/50 text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-500/10 transition-colors">
              <span className="material-symbols-outlined text-lg">delete</span>
              Supprimer
            </button>
          )}
        </div>
      </div>

      {showDeleteConfirm && onDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer la commande</h3>
            <p className="text-slate-400 text-sm mb-4">Êtes-vous sûr de vouloir supprimer {order.id} ?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
              <button onClick={() => { onDelete(order.id); onBack(); }} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Type</p>
          <TypeBadge type={order.type} />
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Statut</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={statusOverride} />
            <select
              value={statusOverride}
              onChange={e => handleStatusChange(e.target.value as Order['status'])}
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-[#137fec]/50"
            >
              {statusOptions.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Montant total</p>
          <p className="text-2xl font-black text-white">GNF {order.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Articles</p>
          <p className="text-2xl font-black text-white">{order.items}</p>
        </div>
      </div>

      {/* Customer & shipping (mock) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#137fec] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            Client
          </h3>
          <p className="text-sm font-semibold text-white">{order.customer}</p>
          <p className="text-xs text-slate-400 mt-1">Commande passée le {order.date}</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#137fec] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
            Livraison
          </h3>
          <p className="text-sm text-slate-300">Adresse de livraison associée à cette commande</p>
          <p className="text-xs text-slate-400 mt-1">Méthode : Standard</p>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-bold">Détail des articles</h3>
          <p className="text-slate-400 text-xs mt-0.5">{lineItems.length} ligne(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Qté</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Prix unit.</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map(line => (
                <tr key={line.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-white">{line.product}</td>
                  <td className="px-6 py-3.5 text-sm font-mono text-slate-400">{line.sku}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-300 text-right">{line.qty}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-300 text-right">GNF {line.unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-white text-right">GNF {line.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Total commande</span>
            <span className="text-xl font-black text-white">GNF {order.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [typeFilter, setTypeFilter] = useState('tous');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);

  const handleCreateOrder = (data: Partial<Order>) => {
    const id = `CMD-${String(orders.length + 1).padStart(3, '0')}`;
    setOrders([...orders, {
      id,
      customer: data.customer || '',
      type: data.type || 'détail',
      status: data.status || 'en_attente',
      amount: data.amount || 0,
      date: data.date || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: data.items || 1,
    }]);
  };

  const handleStatusChange = (id: string, status: Order['status']) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleDeleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
    setSelectedOrder(null);
    setDeleteConfirmOrder(null);
  };

  const filtered = orders.filter(o => {
    const matchType = typeFilter === 'tous' || o.type === typeFilter;
    const matchStatus = statusFilter === 'tous' || o.status === statusFilter;
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'en_attente').length;
  const todayRevenue = orders.filter(o => o.date === '15 Oct 2024').reduce((s, o) => s + o.amount, 0);
  const inDelivery = orders.filter(o => o.status === 'livré').length;

  const currentOrder = selectedOrder ? orders.find(o => o.id === selectedOrder.id) ?? selectedOrder;
  if (selectedOrder) {
    return (
      <OrderDetail
        order={currentOrder}
        onBack={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteOrder}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Commandes</h1>
            <p className="text-slate-400 text-sm mt-1">Surveiller et traiter les ventes détail, gros et crédit</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors">
            <span className="material-symbols-outlined text-lg">add</span>
            Créer une Nouvelle Commande
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher des commandes..."
              className="bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 w-64"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
            {[
              { key: 'tous', label: 'Tous' },
              { key: 'détail', label: 'Détail' },
              { key: 'gros', label: 'Gros' },
              { key: 'crédit', label: 'Crédit' },
            ].map(t => (
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
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-[#137fec]/50"
          >
            <option value="tous">Tous les Statuts</option>
            <option value="payé">Payé</option>
            <option value="en_attente">En Attente</option>
            <option value="en_traitement">En Traitement</option>
            <option value="livré">Livré</option>
            <option value="annulé">Annulé</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">ID Commande</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Articles</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-[#137fec]">{order.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-white">{order.customer}</td>
                    <td className="px-6 py-4"><TypeBadge type={order.type} /></td>
                    <td className="px-6 py-4 text-sm text-slate-400">{order.items} articles</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">GNF {order.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{order.date}</td>
                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors"
                          title="Voir le détail"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmOrder(order); }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="border-t border-slate-800 bg-[#0d1520] px-6 py-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-slate-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>receipt</span>
              <span className="text-xs font-medium text-slate-400">Total des Commandes</span>
            </div>
            <p className="text-xl font-black text-white">{totalOrders}</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
              <span className="text-xs font-medium text-slate-400">En Attente d'Approbation</span>
            </div>
            <p className="text-xl font-black text-amber-400">{pendingOrders}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-emerald-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              <span className="text-xs font-medium text-slate-400">Revenu d'Aujourd'hui</span>
            </div>
            <p className="text-xl font-black text-emerald-400">GNF {todayRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-[#137fec]/5 border border-[#137fec]/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#137fec] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
              <span className="text-xs font-medium text-slate-400">En Cours de Livraison</span>
            </div>
            <p className="text-xl font-black text-[#137fec]">{inDelivery}</p>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <OrderCreateModal onClose={() => setShowCreateModal(false)} onSave={handleCreateOrder} />
      )}

      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmOrder(null)} />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer la commande</h3>
            <p className="text-slate-400 text-sm mb-4">Êtes-vous sûr de vouloir supprimer {deleteConfirmOrder.id} ?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmOrder(null)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
              <button onClick={() => handleDeleteOrder(deleteConfirmOrder.id)} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
