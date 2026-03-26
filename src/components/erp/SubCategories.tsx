import React, { useEffect, useState } from 'react';
import type { Category } from '@/data/erp-data';
import { fetchCategories } from '@/api/category';
import { fetchProducts } from '@/api/products';
import {
  fetchSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  type SubCategory,
} from '@/api/subcategories';

const SubCategoryModal: React.FC<{
  subCategory?: SubCategory | null;
  categories: Category[];
  onClose: () => void;
  onSave: (payload: { name: string; categoryId: string }) => Promise<void>;
}> = ({ subCategory, categories, onClose, onSave }) => {
  const [name, setName] = useState(subCategory?.name ?? '');
  const [categoryId, setCategoryId] = useState<string>(
    subCategory?.categoryId ?? (categories[0]?.id as string) ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">
              {subCategory ? 'Modifier la sous-catégorie' : 'Nouvelle sous-catégorie'}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Organisez vos produits par sous-catégories liées à une catégorie.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Nom de la sous-catégorie
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              placeholder="Ex: Chemises, Chaussures sport..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Catégorie parente
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-[#0d1520]">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={async () => {
              if (!name.trim() || !categoryId) {
                setError('Le nom et la catégorie sont obligatoires.');
                return;
              }
              setError('');
              setSaving(true);
              try {
                await onSave({ name: name.trim(), categoryId });
                onClose();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Erreur lors de l'enregistrement de la sous-catégorie.",
                );
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
            <span>{subCategory ? 'Enregistrer' : 'Créer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SubCategoriesPage: React.FC = () => {
  const PAGE_SIZE = 6;
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('toutes');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [cats, subs, products] = await Promise.all([
          fetchCategories(),
          fetchSubCategories(),
          fetchProducts(),
        ]);
        if (cancelled) return;
        setCategories(cats || []);
        setSubCategories(subs || []);

        // Compute number of products per sub-category from products list
        const counts: Record<string, number> = {};
        (products || []).forEach((p: any) => {
          const subId = p.subCategoryId;
          if (!subId) return;
          counts[subId] = (counts[subId] || 0) + 1;
        });
        setProductCounts(counts);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Erreur lors du chargement des sous-catégories.',
        );
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

  const handleCreate = async (payload: { name: string; categoryId: string }) => {
    const created = await createSubCategory(payload);
    setSubCategories(prev => [...prev, created]);
  };

  const handleUpdate = async (payload: { name: string; categoryId: string }) => {
    if (!editing) return;
    const updated = await updateSubCategory(editing.id, payload);
    setSubCategories(prev =>
      prev.map(s => (s.id === editing.id ? updated : s)),
    );
  };

  const filtered = subCategories.filter(sc => {
    const catMatch =
      selectedCategoryFilter === 'toutes' ||
      sc.categoryId === selectedCategoryFilter;
    const query = search.trim().toLowerCase();
    if (!query) return catMatch;
    const nameMatch = sc.name.toLowerCase().includes(query);
    const parentName = categories.find(c => c.id === sc.categoryId)?.name ?? '';
    const parentMatch = parentName.toLowerCase().includes(query);
    return catMatch && (nameMatch || parentMatch);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedSubCategories = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategoryFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Sous-catégories
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gérez les sous-catégories liées à vos catégories de produits.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nouvelle sous-catégorie
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#137fec]/50"
          >
            <option value="toutes">Toutes les catégories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une sous-catégorie..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50"
          />
        </div>
      </div>

      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Affichage {filtered.length} sous-catégories
          </p>
          <div className="flex items-center gap-3">
            {loading && (
              <span className="text-xs text-slate-500">
                Synchronisation avec l&apos;API…
              </span>
            )}
            {loadError && (
              <span className="text-xs text-amber-300">
                {loadError}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Sous-catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Catégorie parente
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Nombre de Produits
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Créée le
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubCategories.map(sc => {
                const parent = categories.find(c => c.id === sc.categoryId);
                return (
                  <tr
                    key={sc.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4 text-sm text-white">
                      {sc.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {parent?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {productCounts[sc.id] ?? 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(sc.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditing(sc);
                            setShowModal(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors border border-slate-700 hover:border-[#137fec]/30"
                        >
                          <span className="material-symbols-outlined text-base">
                            edit
                          </span>
                          Modifier
                        </button>
                        <button
                          onClick={() => setDeleteTarget(sc)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-slate-700 hover:border-rose-500/30"
                        >
                          <span className="material-symbols-outlined text-base">
                            delete
                          </span>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    Aucune sous-catégorie trouvée. Créez votre première
                    sous-catégorie pour organiser plus finement vos produits.
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

      {showModal && (
        <SubCategoryModal
          subCategory={editing}
          categories={categories}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSave={async payload => {
            if (editing) {
              await handleUpdate(payload);
            } else {
              await handleCreate(payload);
            }
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">
              Supprimer la sous-catégorie
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Êtes-vous sûr de vouloir supprimer{' '}
              <span className="text-white font-medium">
                {deleteTarget.name}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    setDeleting(true);
                    await deleteSubCategory(deleteTarget.id);
                    setSubCategories(prev =>
                      prev.filter(s => s.id !== deleteTarget.id),
                    );
                    setDeleteTarget(null);
                  } catch (err) {
                    console.error('Erreur lors de la suppression', err);
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubCategoriesPage;

