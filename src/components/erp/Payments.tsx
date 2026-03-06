import React, { useState } from 'react';
import { payments as initialPayments, type Payment } from '@/data/erp-data';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    terminé: { label: 'Terminé', cls: 'bg-emerald-500/15 text-emerald-400' },
    en_attente: { label: 'En Attente', cls: 'bg-amber-500/15 text-amber-400' },
    annulé: { label: 'Annulé', cls: 'bg-rose-500/15 text-rose-400' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-500/15 text-slate-400' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
};

const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const map: Record<string, { label: string; cls: string }> = {
    détail: { label: 'Détail', cls: 'bg-slate-500/15 text-slate-300' },
    gros: { label: 'Gros', cls: 'bg-indigo-500/15 text-indigo-400' },
    crédit: { label: 'Crédit', cls: 'bg-cyan-500/15 text-cyan-400' },
  };
  const s = map[source] || { label: source, cls: 'bg-slate-500/15 text-slate-400' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>{s.label}</span>;
};

const barHeights = [40, 65, 45, 70, 55, 80, 60, 75, 50, 85, 65, 90];
const months = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep'];

const PaymentModal: React.FC<{ payment?: Payment | null; onClose: () => void; onSave: (data: Partial<Payment>) => void }> = ({ payment, onClose, onSave }) => {
  const [form, setForm] = useState({
    customer: payment?.customer || '',
    date: payment?.date || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    source: (payment?.source || 'détail') as Payment['source'],
    method: (payment?.method || 'carte') as Payment['method'],
    reference: payment?.reference || '',
    amount: payment?.amount?.toString() || '',
    status: (payment?.status || 'terminé') as Payment['status'],
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-lg">{payment ? 'Modifier le paiement' : 'Enregistrer un paiement'}</h2>
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
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
              <input
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Source</label>
              <select
                value={form.source}
                onChange={e => setForm({ ...form, source: e.target.value as Payment['source'] })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="détail">Détail</option>
                <option value="gros">Gros</option>
                <option value="crédit">Crédit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Méthode</label>
              <select
                value={form.method}
                onChange={e => setForm({ ...form, method: e.target.value as Payment['method'] })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="espèces">Espèces</option>
                <option value="carte">Carte</option>
                <option value="virement">Virement</option>
                <option value="chèque">Chèque</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Référence</label>
              <input
                value={form.reference}
                onChange={e => setForm({ ...form, reference: e.target.value })}
                placeholder="TXN-xxxx"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Statut</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as Payment['status'] })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="terminé">Terminé</option>
                <option value="en_attente">En Attente</option>
                <option value="annulé">Annulé</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
          <button
            onClick={() => {
              onSave({
                customer: form.customer,
                date: form.date,
                source: form.source,
                method: form.method,
                reference: form.reference,
                amount: parseFloat(form.amount) || 0,
                status: form.status,
              });
              onClose();
            }}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            {payment ? 'Enregistrer' : 'Créer le paiement'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Payments: React.FC = () => {
  const [payments, setPayments] = useState(initialPayments);
  const [sourceFilter, setSourceFilter] = useState('tous');
  const [methodFilter, setMethodFilter] = useState('tous');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Payment | null>(null);

  const handleSave = (data: Partial<Payment>) => {
    if (editPayment) {
      setPayments(payments.map(p => p.id === editPayment.id ? { ...p, ...data } : p));
    } else {
      const id = `PAY-${String(payments.length + 1).padStart(3, '0')}`;
      setPayments([...payments, { id, ...data } as Payment]);
    }
    setEditPayment(null);
  };

  const handleDelete = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
    setDeleteConfirm(null);
  };

  const filtered = payments.filter(p => {
    const matchSource = sourceFilter === 'tous' || p.source === sourceFilter;
    const matchMethod = methodFilter === 'tous' || p.method === methodFilter;
    const matchSearch = p.customer.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase());
    return matchSource && matchMethod && matchSearch;
  });

  const totalReceived = payments.filter(p => p.status === 'terminé').reduce((s, p) => s + p.amount, 0);
  const retailPayments = payments.filter(p => p.source === 'détail' && p.status === 'terminé').reduce((s, p) => s + p.amount, 0);
  const wholesalePayments = payments.filter(p => p.source === 'gros' && p.status === 'terminé').reduce((s, p) => s + p.amount, 0);
  const pendingCredits = payments.filter(p => p.source === 'crédit' && p.status === 'en_attente').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Grand Livre des Paiements</h1>
          <p className="text-slate-400 text-sm mt-1">Suivre et gérer tous les paiements entrants</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors">
              <span className="material-symbols-outlined text-lg">download</span>
              Exporter le Rapport
              <span className="material-symbols-outlined text-base">arrow_drop_down</span>
            </button>
          </div>
          <button onClick={() => { setEditPayment(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors">
            <span className="material-symbols-outlined text-lg">add</span>
            Enregistrer un Paiement
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Total Reçu</p>
          <p className="text-2xl font-black text-emerald-400">GNF {totalReceived.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-2">du mois dernier</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Paiements Détail</p>
          <p className="text-2xl font-black text-white">GNF {retailPayments.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-2">cette semaine</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Paiements Gros</p>
          <p className="text-2xl font-black text-indigo-400">GNF {wholesalePayments.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-2">Règlements</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Crédits en Attente</p>
          <p className="text-2xl font-black text-amber-400">GNF {pendingCredits.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-2">Nécessite une attention</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher des transactions..."
            className="bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 w-64"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-[#137fec]/50"
        >
          <option value="tous">Toutes les Sources</option>
          <option value="détail">Détail</option>
          <option value="gros">Gros</option>
          <option value="crédit">Crédit</option>
        </select>
        <select
          value={methodFilter}
          onChange={e => setMethodFilter(e.target.value)}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-[#137fec]/50"
        >
          <option value="tous">Toutes les Méthodes</option>
          <option value="espèces">Espèces</option>
          <option value="carte">Carte</option>
          <option value="virement">Virement</option>
          <option value="chèque">Chèque</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 border border-slate-700 text-slate-400 rounded-lg text-sm hover:bg-slate-800/50 transition-colors">
          <span className="material-symbols-outlined text-base">tune</span>
          Plus de Filtres
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Méthode</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Référence</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-3.5 text-sm font-mono text-[#137fec]">{p.id}</td>
                  <td className="px-6 py-3.5 text-sm font-medium text-white">{p.customer}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-400">{p.date}</td>
                  <td className="px-6 py-3.5"><SourceBadge source={p.source} /></td>
                  <td className="px-6 py-3.5 text-sm text-slate-300 capitalize">{p.method}</td>
                  <td className="px-6 py-3.5 text-sm font-mono text-slate-400">{p.reference}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-white text-right">GNF {p.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditPayment(p); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors" title="Modifier">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => setDeleteConfirm(p)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Supprimer">
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

      {/* Bottom Section */}
      <div className="grid grid-cols-3 gap-4">
        {/* Volume Trend Chart */}
        <div className="col-span-2 bg-[#0d1520] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold">Tendance du Volume</h3>
            <span className="text-xs text-slate-400">Détail vs Gros</span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {barHeights.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>
                  <div className="flex-1 bg-[#137fec]/70 rounded-sm" style={{ height: `${h}%` }} />
                  <div className="flex-1 bg-indigo-500/50 rounded-sm" style={{ height: `${Math.max(h - 15, 10)}%` }} />
                </div>
                <span className="text-xs text-slate-500">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reconciliation */}
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Réconciliation</h3>
          <div className="flex items-center gap-3 mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <span className="material-symbols-outlined text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <div>
              <p className="text-sm font-semibold text-emerald-400">Grand Livre Synchronisé</p>
              <p className="text-xs text-slate-400 mt-0.5">Les 152 paiements du mois d'octobre ont été réconciliés</p>
            </div>
          </div>
          <button className="w-full py-2.5 border border-[#137fec]/40 text-[#137fec] rounded-lg text-sm font-medium hover:bg-[#137fec]/10 transition-colors">
            Lancer la Vérification de Réconciliation
          </button>
        </div>
      </div>

      {showModal && (
        <PaymentModal
          payment={editPayment}
          onClose={() => { setShowModal(false); setEditPayment(null); }}
          onSave={handleSave}
        />
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer le paiement</h3>
            <p className="text-slate-400 text-sm mb-4">Êtes-vous sûr de vouloir supprimer {deleteConfirm.id} ({deleteConfirm.reference}) ?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
