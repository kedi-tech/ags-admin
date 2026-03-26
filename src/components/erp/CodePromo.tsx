import React, { useEffect, useState } from 'react';
import {
  type ApiCodePromo,
  type CreateCodePromoPayload,
  fetchCodePromos,
  createCodePromo,
  updateCodePromo,
  deleteCodePromo,
} from '@/api/codePromo';

const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const CodePromoModal: React.FC<{
  promo?: ApiCodePromo | null;
  onClose: () => void;
  onSave: (p: CreateCodePromoPayload) => Promise<void>;
}> = ({ promo, onClose, onSave }) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultExpiry = tomorrow.toISOString().slice(0, 10);

  const [form, setForm] = useState<CreateCodePromoPayload>({
    code: promo?.code ?? '',
    discount: promo?.discount ?? 10,
    minimumOrderAmount: promo?.minimumOrderAmount ?? null,
    expiresAt: promo ? promo.expiresAt.slice(0, 10) : defaultExpiry,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!form.code.trim()) { setErr('Le code est requis.'); return; }
    if (form.discount <= 0 || form.discount > 100) { setErr('La remise doit être entre 1 et 100.'); return; }
    if (!form.expiresAt) { setErr("La date d'expiration est requise."); return; }
    setErr('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        code: form.code.trim().toUpperCase(),
        minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : null,
        expiresAt: form.expiresAt ? `${form.expiresAt}T23:59:59Z` : form.expiresAt,
      });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-lg">
            {promo ? 'Modifier le Code Promo' : 'Nouveau Code Promo'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {err && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{err}</p>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Code Promo</label>
            <input
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              placeholder="EX: SUMMER20"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Remise (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.discount}
              onChange={e => setForm({ ...form, discount: Number(e.target.value) })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Montant Minimum (GNF) <span className="text-slate-500 normal-case font-normal">— optionnel</span>
            </label>
            <input
              type="number"
              min={0}
              value={form.minimumOrderAmount ?? ''}
              onChange={e => setForm({ ...form, minimumOrderAmount: e.target.value ? Number(e.target.value) : null })}
              placeholder="0"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date d'Expiration</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={e => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors disabled:opacity-70 inline-flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            <span>{promo ? 'Enregistrer' : 'Créer le Code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const CodePromo: React.FC = () => {
  const PAGE_SIZE = 8;
  const [promos, setPromos] = useState<ApiCodePromo[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState<ApiCodePromo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const data = await fetchCodePromos();
        if (!cancelled) setPromos(data);
      } catch (err: unknown) {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : 'Erreur lors du chargement.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = promos.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [search]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSave = async (payload: CreateCodePromoPayload) => {
    if (editPromo) {
      const updated = await updateCodePromo(editPromo.id, payload);
      setPromos(prev => prev.map(p => p.id === updated.id ? updated : p));
    } else {
      const created = await createCodePromo(payload);
      setPromos(prev => [created, ...prev]);
    }
    setEditPromo(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCodePromo(id);
      setPromos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const activeCount = promos.filter(p => !isExpired(p.expiresAt)).length;
  const expiredCount = promos.length - activeCount;
  const totalUsage = promos.reduce((s, p) => s + (p.orders?.length ?? 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Codes Promo</h1>
          <p className="text-slate-400 text-sm mt-1">Gérer les codes de réduction pour les commandes</p>
        </div>
        <button
          onClick={() => { setEditPromo(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nouveau Code Promo
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#137fec]/15 rounded-lg">
              <span className="material-symbols-outlined text-[#137fec] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_offer</span>
            </div>
            <span className="text-sm font-medium text-slate-400">Total des Codes</span>
          </div>
          <p className="text-3xl font-black text-white">{promos.length}</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/15 rounded-lg">
              <span className="material-symbols-outlined text-emerald-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <span className="text-sm font-medium text-slate-400">Actifs / Expirés</span>
          </div>
          <p className="text-3xl font-black text-white">
            <span className="text-emerald-400">{activeCount}</span>
            <span className="text-slate-500 text-xl"> / </span>
            <span className="text-rose-400">{expiredCount}</span>
          </p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500/15 rounded-lg">
              <span className="material-symbols-outlined text-amber-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
            </div>
            <span className="text-sm font-medium text-slate-400">Total Utilisations</span>
          </div>
          <p className="text-3xl font-black text-white">{totalUsage}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un code promo..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50"
          />
        </div>
        {loading && <span className="text-xs text-slate-500">Chargement…</span>}
      </div>

      {/* Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl overflow-hidden">
        {loadError && (
          <div className="px-6 py-2 border-b border-slate-800 text-xs text-amber-300 bg-amber-500/5">{loadError}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Remise</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Min. Commande</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Expiration</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Utilisations</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500 text-sm">
                    {loading ? 'Chargement…' : 'Aucun code promo trouvé.'}
                  </td>
                </tr>
              )}
              {paginated.map(promo => {
                const expired = isExpired(promo.expiresAt);
                return (
                  <tr key={promo.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#137fec]/10 rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#137fec] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>local_offer</span>
                        </div>
                        <span className="text-sm font-bold text-white font-mono tracking-wider">{promo.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#137fec]/15 text-[#137fec]">
                        -{promo.discount}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {promo.minimumOrderAmount != null
                        ? `${promo.minimumOrderAmount.toLocaleString('fr-FR')} GNF`
                        : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{formatDate(promo.expiresAt)}</td>
                    <td className="px-6 py-4">
                      {expired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Expiré
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Actif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{promo.orders?.length ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditPromo(promo); setShowModal(true); }}
                          className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(promo.id)}
                          disabled={deletingId === promo.id}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-base">
                            {deletingId === promo.id ? 'hourglass_top' : 'delete'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Page {currentPage} sur {totalPages} · {filtered.length} résultats
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/15 rounded-lg">
                <span className="material-symbols-outlined text-rose-400 text-xl">warning</span>
              </div>
              <h3 className="text-white font-bold">Supprimer le code promo ?</h3>
            </div>
            <p className="text-sm text-slate-400">Cette action est irréversible. Le code sera définitivement supprimé.</p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="px-5 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-70 inline-flex items-center gap-2"
              >
                {deletingId === confirmDeleteId && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <CodePromoModal
          promo={editPromo}
          onClose={() => { setShowModal(false); setEditPromo(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default CodePromo;
