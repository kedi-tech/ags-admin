import React, { useState } from 'react';
import { stockAdjustments as initialAdjustments, products, type StockAdjustment } from '@/data/erp-data';

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const map: Record<string, { label: string; cls: string }> = {
    addition: { label: 'Addition', cls: 'bg-emerald-500/15 text-emerald-400' },
    réduction: { label: 'Réduction', cls: 'bg-rose-500/15 text-rose-400' },
    endommagé: { label: 'Endommagé', cls: 'bg-amber-500/15 text-amber-400' },
    retour: { label: 'Retour', cls: 'bg-blue-500/15 text-blue-400' },
    correction: { label: 'Correction', cls: 'bg-slate-500/15 text-slate-400' },
  };
  const t = map[type] || { label: type, cls: 'bg-slate-500/15 text-slate-400' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${t.cls}`}>{t.label}</span>;
};

const AdjustmentModal: React.FC<{ onClose: () => void; onSave: (adj: Partial<StockAdjustment>) => void }> = ({ onClose, onSave }) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [adjType, setAdjType] = useState('addition');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  const product = products.find(p => p.id === selectedProduct);
  const qtyNum = parseInt(qty) || 0;
  const isPositive = adjType === 'addition' || adjType === 'retour';
  const newStock = product ? product.quantity + (isPositive ? qtyNum : -qtyNum) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Ajustement Manuel</h2>
            <p className="text-slate-400 text-xs mt-0.5">Mettre à jour les niveaux de stock manuellement pour les journaux d'audit</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rechercher un Produit</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            >
              <option value="">Sélectionner un produit</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.quantity}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type d'Ajustement</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'addition', label: 'Addition', icon: 'add_circle', cls: 'text-emerald-400 border-emerald-500/30' },
                { key: 'réduction', label: 'Réduction', icon: 'remove_circle', cls: 'text-rose-400 border-rose-500/30' },
                { key: 'endommagé', label: 'Endommagé', icon: 'warning', cls: 'text-amber-400 border-amber-500/30' },
                { key: 'retour', label: 'Retour', icon: 'undo', cls: 'text-blue-400 border-blue-500/30' },
                { key: 'correction', label: 'Correction', icon: 'edit', cls: 'text-slate-400 border-slate-500/30' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setAdjType(t.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    adjType === t.key ? `bg-slate-700/50 ${t.cls}` : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quantité Ajustée</label>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(e.target.value)}
                min="0"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nouveau Niveau de Stock</label>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-slate-400">Calculé automatiquement</span>
                {product && <span className={`text-sm font-bold ${newStock < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{Math.max(newStock, 0)}</span>}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Raison / Notes</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Décrivez pourquoi cet ajustement est effectué"
              rows={3}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
          <button
            onClick={() => {
              if (product) {
                onSave({
                  product: product.name,
                  sku: product.sku,
                  type: adjType as StockAdjustment['type'],
                  qtyAdjusted: isPositive ? qtyNum : -qtyNum,
                  prevStock: product.quantity,
                  newStock: Math.max(newStock, 0),
                  adminUser: 'Alexandre Dubois',
                  dateTime: new Date().toLocaleString('fr-FR'),
                });
              }
              onClose();
            }}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            Confirmer l'Ajustement
          </button>
        </div>
      </div>
    </div>
  );
};

const StockLog: React.FC = () => {
  const [adjustments, setAdjustments] = useState(initialAdjustments);
  const [typeFilter, setTypeFilter] = useState('tous');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<StockAdjustment | null>(null);

  const filtered = adjustments.filter(a => {
    const matchType = typeFilter === 'tous' || a.type === typeFilter;
    const matchSearch =
      a.product.toLowerCase().includes(search.toLowerCase()) ||
      a.sku.toLowerCase().includes(search.toLowerCase()) ||
      a.adminUser.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleSave = (data: Partial<StockAdjustment>) => {
    setAdjustments([{
      id: `ADJ-${String(adjustments.length + 1).padStart(3, '0')}`,
      dateTime: data.dateTime || '',
      product: data.product || '',
      sku: data.sku || '',
      type: data.type || 'correction',
      qtyAdjusted: data.qtyAdjusted || 0,
      prevStock: data.prevStock || 0,
      newStock: data.newStock || 0,
      adminUser: data.adminUser || '',
    }, ...adjustments]);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm mb-3">
          <span className="text-slate-400">Inventaire</span>
          <span className="material-symbols-outlined text-slate-500 text-base">chevron_right</span>
          <span className="text-white font-medium">Journal d'Ajustements de Stock</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Journal d'Ajustements de Stock</h1>
            <p className="text-slate-400 text-sm mt-1">Auditer et surveiller tous les ajustements manuels d'inventaire dans vos emplacements</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            Ajustement Manuel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par Produit, SKU ou Administrateur..."
            className="bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 w-80"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
          {[
            { key: 'tous', label: 'Tous les Types' },
            { key: 'addition', label: 'Addition' },
            { key: 'réduction', label: 'Réduction' },
            { key: 'endommagé', label: 'Endommagé' },
            { key: 'retour', label: 'Retour' },
            { key: 'correction', label: 'Correction' },
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
      </div>

      {/* Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <p className="text-sm text-slate-400">Affichage {filtered.length} ajustements</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date et Heure</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Nom du Produit</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type d'Ajustement</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Qté Ajustée</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Préc.</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Nouveau Stock</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Utilisateur Admin</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(adj => (
                <tr key={adj.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-3.5 text-sm text-slate-400">{adj.dateTime}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-white">{adj.product}</td>
                  <td className="px-6 py-3.5 text-sm font-mono text-slate-400">{adj.sku}</td>
                  <td className="px-6 py-3.5"><TypeBadge type={adj.type} /></td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-right">
                    <span className={adj.qtyAdjusted > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {adj.qtyAdjusted > 0 ? '+' : ''}{adj.qtyAdjusted}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-400 text-right">{adj.prevStock}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-white text-right">{adj.newStock}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#137fec]/15 flex items-center justify-center">
                        <span className="text-xs font-bold text-[#137fec]">{adj.adminUser.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <span className="text-sm text-slate-300">{adj.adminUser}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setDeleteConfirm(adj)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Supprimer">
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

      {showModal && (
        <AdjustmentModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer l'ajustement</h3>
            <p className="text-slate-400 text-sm mb-4">Supprimer l'ajustement {deleteConfirm.id} ({deleteConfirm.product}) du journal ?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
              <button onClick={() => { setAdjustments(adjustments.filter(a => a.id !== deleteConfirm.id)); setDeleteConfirm(null); }} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockLog;
