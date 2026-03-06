import React, { useState } from 'react';
import { categories as initialCategories, type Category } from '@/data/erp-data';

const ICONS = ['checkroom', 'devices', 'spa', 'sports_soccer', 'kitchen', 'restaurant', 'home', 'local_shipping', 'storefront'];

const CategoryModal: React.FC<{ category?: Category | null; onClose: () => void; onSave: (c: Partial<Category>) => void }> = ({ category, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || 'category',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-lg">{category ? 'Modifier la Catégorie' : 'Ajouter une Nouvelle Catégorie'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nom de la Catégorie</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sélectionner une Icône</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setForm({ ...form, icon })}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    form.icon === icon ? 'border-[#137fec] bg-[#137fec]/15 text-[#137fec]' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
          <button
            onClick={() => { onSave(form); onClose(); }}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            {category ? 'Enregistrer' : 'Ajouter la Catégorie'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Categories: React.FC = () => {
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data: Partial<Category>) => {
    if (editCategory) {
      setCategories(categories.map(c => c.id === editCategory.id ? { ...c, ...data } : c));
    } else {
      setCategories([...categories, {
        id: `C${String(categories.length + 1).padStart(3, '0')}`,
        name: data.name || '',
        description: data.description || '',
        productCount: 0,
        icon: data.icon || 'category',
        createdAt: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      }]);
    }
    setEditCategory(null);
  };

  const totalProducts = categories.reduce((s, c) => s + c.productCount, 0);
  const avgProducts = (totalProducts / categories.length).toFixed(1);
  const mostActive = [...categories].sort((a, b) => b.productCount - a.productCount)[0];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Catégories</h1>
          <p className="text-slate-400 text-sm mt-1">Gérer et organiser vos catégories de produits</p>
        </div>
        <button
          onClick={() => { setEditCategory(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Ajouter une Catégorie
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#137fec]/15 rounded-lg">
              <span className="material-symbols-outlined text-[#137fec] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
            </div>
            <span className="text-sm font-medium text-slate-400">Total des Catégories</span>
          </div>
          <p className="text-3xl font-black text-white">{categories.length}</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/15 rounded-lg">
              <span className="material-symbols-outlined text-emerald-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
            </div>
            <span className="text-sm font-medium text-slate-400">Moy. Produits / Cat</span>
          </div>
          <p className="text-3xl font-black text-white">{avgProducts}</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500/15 rounded-lg">
              <span className="material-symbols-outlined text-amber-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <span className="text-sm font-medium text-slate-400">La Plus Active</span>
          </div>
          <p className="text-xl font-black text-white">{mostActive?.name}</p>
          <p className="text-xs text-slate-400 mt-1">{mostActive?.productCount} produits</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-80">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher des catégories..."
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Catégorie</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre de Produits</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date de Création</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(cat => (
              <tr key={cat.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#137fec]/10 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#137fec] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{cat.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate">{cat.description}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-[#137fec] rounded-full" style={{ width: `${Math.min((cat.productCount / 50) * 100, 100)}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-white">{cat.productCount}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{cat.createdAt}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditCategory(cat); setShowModal(true); }}
                      className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => setCategories(categories.filter(c => c.id !== cat.id))}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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

      {showModal && (
        <CategoryModal
          category={editCategory}
          onClose={() => { setShowModal(false); setEditCategory(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Categories;
