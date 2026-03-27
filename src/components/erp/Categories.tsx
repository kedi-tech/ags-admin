import React, { useEffect, useState } from 'react';
import { type Category } from '@/data/erp-data';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '@/api/category';

const ICONS = ['checkroom', 'devices', 'spa', 'sports_soccer', 'kitchen', 'restaurant', 'home', 'local_shipping', 'storefront'];

// Helper to derive product count from API payload (which includes products[])
const getProductCount = (cat: Category & { products?: unknown }): number => {
  const anyCat = cat as any;
  if (Array.isArray(anyCat.products)) {
    return anyCat.products.length;
  }
  return typeof anyCat.productCount === 'number' ? anyCat.productCount : 0;
};

const CategoryModal: React.FC<{
  category?: Category | null;
  onClose: () => void;
  onSave: (c: Partial<Category>) => Promise<void> | void;
}> = ({ category, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || 'category',
  });
  const [saving, setSaving] = useState(false);

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
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={async () => {
              try {
                setSaving(true);
                await onSave(form);
                onClose();
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            <span>{category ? 'Enregistrer' : 'Ajouter la Catégorie'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Categories: React.FC = () => {
  const PAGE_SIZE = 6;
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const apiCategories = await fetchCategories();
        if (!cancelled && Array.isArray(apiCategories)) {
          setCategories(apiCategories);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Erreur lors du chargement des catégories.";
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

  const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const filtered = categories.filter(c =>
    !words.length || words.every(w =>
      c.name.toLowerCase().includes(w) ||
      c.description.toLowerCase().includes(w)
    )
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedCategories = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSave = async (data: Partial<Category>) => {
    if (editCategory) {
      const updated = await updateCategory(editCategory.id, {
        name: data.name ?? editCategory.name,
        description: data.description ?? editCategory.description,
        icon: data.icon ?? editCategory.icon,
      });
      setCategories(categories.map(c => c.id === updated.id ? updated : c));
    } else {
      const created = await createCategory({
        name: data.name || '',
        description: data.description || '',
        icon: data.icon || 'category',
      });
      setCategories([...categories, created]);
    }
    setEditCategory(null);
  };

  const totalProducts = categories.reduce((s, c) => s + getProductCount(c), 0);
  const avgProducts =
    categories.length > 0
      ? (totalProducts / categories.length).toFixed(1)
      : "0.0";
  const mostActive =
    categories.length > 0
      ? [...categories].sort((a, b) => getProductCount(b) - getProductCount(a))[0]
      : undefined;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Catégories</h1>
          <p className="text-slate-400 text-sm mt-1">Gérer et organiser vos catégories de produits</p>
        </div>
        <button
          onClick={() => { setEditCategory(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Ajouter une Catégorie
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5 sm:col-span-2 lg:col-span-1">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher des catégories..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50"
          />
        </div>
        {loading && (
          <span className="text-xs text-slate-500">
            Synchronisation avec l&apos;API…
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl overflow-hidden">
        {loadError && (
          <div className="px-6 py-2 border-b border-slate-800 text-xs text-amber-300 bg-amber-500/5">
            {loadError}
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Catégorie</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre de Produits</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date de Création</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Ajouté par</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCategories.map(cat => (
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
                      <div
                        className="h-full bg-[#137fec] rounded-full"
                        style={{ width: `${Math.min((getProductCount(cat) / 50) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {getProductCount(cat)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{cat.createdAt}</td>
                <td className="px-6 py-4">
                  {cat.author ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#137fec] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {cat.author.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-300">{cat.author.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-sm">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditCategory(cat); setShowModal(true); }}
                      className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          setDeletingId(cat.id);
                          await deleteCategory(cat.id);
                          setCategories(categories.filter(c => c.id !== cat.id));
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      disabled={deletingId === cat.id}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-base">
                        {deletingId === cat.id ? 'hourglass_top' : 'delete'}
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
