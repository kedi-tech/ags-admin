import React, { useEffect, useState, useRef } from 'react';
import type {
  ApiCredit as Credit,
  ApiOrder as Order,
  CreditStatus,
  ClientType,
} from '@/api/credits';
import {
  fetchCredits,
  createCredit,
  updateCreditStatus,
  deleteCredit,
} from '@/api/credits';
import { fetchOrders } from '@/api/orders';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `GNF ${n.toLocaleString('fr-FR')}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const daysUntil = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

// ─── Badges ───────────────────────────────────────────────────────────────────

const CreditStatusBadge: React.FC<{ status: CreditStatus }> = ({ status }) => {
  const map: Record<CreditStatus, { label: string; cls: string }> = {
    ACTIVE:   { label: 'Actif',   cls: 'bg-emerald-500/15 text-emerald-400' },
    PAID:     { label: 'Payé',    cls: 'bg-blue-500/15 text-blue-400'       },
    EXPIRED:  { label: 'Expiré', cls: 'bg-amber-500/15 text-amber-400'     },
    CANCELED: { label: 'Annulé', cls: 'bg-rose-500/15 text-rose-400'       },
  };
  const s = map[status];
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
};

const ClientTypeBadge: React.FC<{ type: ClientType }> = ({ type }) =>
  type === 'COMPANY'
    ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/15 text-indigo-400">Société</span>
    : <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-500/15 text-slate-300">Particulier</span>;

// ─── Settle Modal ─────────────────────────────────────────────────────────────

const SettleModal: React.FC<{
  credit: Credit;
  onClose: () => void;
  onConfirm: (creditId: number, amountPaid: number, method: string, reference: string) => void;
}> = ({ credit, onClose, onConfirm }) => {
  const [amount, setAmount]     = useState('');
  const [method, setMethod]     = useState('Virement');
  const [reference, setRef]     = useState('');

  const amountNum  = parseFloat(amount) || 0;
  const newBalance = Math.max(0, credit.amount - amountNum);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Régler le Paiement</h2>
            <p className="text-slate-400 text-xs mt-0.5">{credit.client.name} · Crédit #{String(credit.id).slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-800/40 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">Montant dû</span>
            <span className="text-lg font-black text-rose-400">{fmt(credit.amount)}</span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Montant à payer (GNF)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Méthode</label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50">
                <option>Virement</option>
                <option>Espèces</option>
                <option>Chèque</option>
                <option>Carte</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Référence</label>
              <input value={reference} onChange={e => setRef(e.target.value)}
                placeholder="Optionnel"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50" />
            </div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">Solde restant après paiement</span>
            <span className={`text-lg font-black ${newBalance <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {fmt(newBalance)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Annuler</button>
          <button
            disabled={amountNum <= 0}
            onClick={() => { onConfirm(credit.id, amountNum, method, reference); onClose(); }}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Confirmer le Paiement
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create Credit Modal ──────────────────────────────────────────────────────

const CreateCreditModal: React.FC<{
  orders: Order[];
  onClose: () => void;
  onSave: (data: {
    clientId: string;
    orderId: string;
    amount: number;
    limitedDate: string;
    status: CreditStatus;
  }) => Promise<void> | void;
}> = ({ orders, onClose, onSave }) => {
  // Only allow linking to orders that are not cancelled
  const creditOrders = orders.filter(o => o.isCredit === true && o.status !== 'CANCELLED');
  const [orderId, setOrderId]     = useState<string>('');
  const [amount, setAmount]       = useState('');
  const [limitedDate, setDate]    = useState('');
  const [status, setStatus]       = useState<CreditStatus>('ACTIVE');
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
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

  const selectedOrder = creditOrders.find(o => o.id === orderId);

  const handleSave = async () => {
    if (!orderId)      { setError('Veuillez sélectionner une commande.'); return; }
    if (!amount)       { setError('Veuillez saisir un montant.'); return; }
    if (!limitedDate)  { setError('Veuillez choisir une date limite.'); return; }
    if (!selectedOrder){ setError('Commande introuvable.'); return; }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Le montant saisi n'est pas valide.");
      return;
    }
    if (parsedAmount > selectedOrder.total) {
      setError(`Le montant du crédit ne peut pas dépasser le total de la commande (${fmt(selectedOrder.total)}).`);
      return;
    }
    if (selectedOrder.status === 'CANCELLED') {
      setError("Impossible de créer un crédit pour une commande annulée.");
      return;
    }

    try {
      setError('');
      setSaving(true);
      await onSave({
        clientId: selectedOrder.clientId,
        orderId:  selectedOrder.id,
        amount:   parsedAmount,
        status,
        limitedDate,
      });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de créer le crédit.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { if (!saving) onClose(); }}
      />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <h2 className="text-white font-bold text-lg">Nouveau Crédit</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-white text-xl leading-none disabled:opacity-50"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* Order picker */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Commande liée <span className="text-rose-400">*</span>
            </label>
            <div 
              className={`flex flex-col bg-slate-800/50 border rounded-lg overflow-hidden transition-colors ${showDropdown ? 'border-[#137fec]/50 ring-1 ring-[#137fec]/20' : 'border-slate-700'}`}
            >
              <div className="relative border-b border-slate-700/50">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input
                  type="text"
                  placeholder="Filtrer par client, ID ou montant..."
                  value={orderSearch}
                  onFocus={() => setShowDropdown(true)}
                  onChange={e => { setOrderSearch(e.target.value); setShowDropdown(true); }}
                  className="w-full bg-transparent pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div 
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-3 py-2.5 text-sm text-white cursor-pointer flex justify-between items-center hover:bg-slate-700/30 transition-colors"
              >
                <span className={orderId ? 'text-white font-medium' : 'text-slate-500'}>
                  {orderId 
                    ? creditOrders.find(o => String(o.id) === orderId)?.client.name + ' · ' + fmt(creditOrders.find(o => String(o.id) === orderId)?.total ?? 0)
                    : 'Sélectionner une commande'}
                </span>
                <span className={`material-symbols-outlined text-slate-500 text-sm transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>
            </div>

            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-[#161f2c] border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-1">
                  {creditOrders
                    .filter(o => 
                      o.client.name.toLowerCase().includes(orderSearch.toLowerCase()) || 
                      String(o.id).includes(orderSearch) ||
                      o.total.toString().includes(orderSearch) ||
                      fmt(o.total).toLowerCase().includes(orderSearch.toLowerCase())
                    )
                    .length > 0 ? (
                    creditOrders
                      .filter(o => 
                        o.client.name.toLowerCase().includes(orderSearch.toLowerCase()) || 
                        String(o.id).includes(orderSearch) ||
                        o.total.toString().includes(orderSearch) ||
                        fmt(o.total).toLowerCase().includes(orderSearch.toLowerCase())
                      )
                      .map((o) => (
                        <div 
                          key={o.id} 
                          onClick={() => { setOrderId(String(o.id)); setError(''); setShowDropdown(false); }}
                          className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all ${orderId === String(o.id) ? 'bg-[#137fec] text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                        >
                          <div className="font-semibold">{o.client.name}</div>
                          <div className={`text-[11px] mt-0.5 ${orderId === String(o.id) ? 'text-blue-100' : 'text-slate-500'}`}>
                            #{String(o.id).slice(0, 8)} · {fmt(o.total)} · {fmtDate(o.createdAt)}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <span className="material-symbols-outlined text-slate-600 text-3xl mb-2">order_approve</span>
                      <p className="text-sm text-slate-500 italic">Aucune commande trouvée</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected order preview */}
          {selectedOrder && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-2">
              {selectedOrder.client && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Client</span>
                  <div className="flex items-center gap-2">
                    <ClientTypeBadge type={selectedOrder.client.type} />
                    <span className="text-sm font-semibold text-white">{selectedOrder.client.name}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Total commande</span>
                <span className="text-sm font-bold text-white">{fmt(selectedOrder.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Date commande</span>
                <span className="text-sm text-slate-300">{fmtDate(selectedOrder.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Limite de crédit client</span>
                <span className="text-sm font-semibold text-cyan-400">{fmt(selectedOrder.client.creditLimit)}</span>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Montant du crédit (GNF) <span className="text-rose-400">*</span>
            </label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => {
                const val = e.target.value;
                if (selectedOrder && parseFloat(val) > selectedOrder.total) {
                  setAmount(selectedOrder.total.toString());
                } else {
                  setAmount(val);
                }
                setError('');
              }}
              max={selectedOrder?.total}
              placeholder="Ex: 500000"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50" />
            {selectedOrder && parseFloat(amount) > selectedOrder.client.creditLimit && (
              <p className="mt-1 text-xs text-amber-400">⚠ Dépasse la limite de crédit du client</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Due date */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Date limite <span className="text-rose-400">*</span>
              </label>
              <input type="date" value={limitedDate} onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50" />
            </div>
            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value as CreditStatus)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50">
                <option value="ACTIVE">Actif</option>
                <option value="PAID">Payé</option>
                <option value="EXPIRED">Expiré</option>
                <option value="CANCELED">Annulé</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            Créer le crédit
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Credit Detail ────────────────────────────────────────────────────────────

const CreditDetail: React.FC<{
  credit: Credit;
  onBack: () => void;
  onSettle: (creditId: number, amountPaid: number, method: string, reference: string) => void;
  onStatusChange: (creditId: number, status: CreditStatus) => void;
}> = ({ credit, onBack, onSettle, onStatusChange }) => {
  const [showSettle, setShowSettle] = useState(false);
  const days = daysUntil(credit.limitedDate);
  const isOverdue = days < 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-[#137fec] hover:text-blue-400 font-medium transition-colors">
          Gestion du Crédit
        </button>
        <span className="text-slate-500">›</span>
        <span className="text-white font-medium">Crédit #{String(credit.id).slice(0, 8)}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
            <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight">{credit.client?.name ?? 'Client inconnu'}</h1>
            {credit.client && <ClientTypeBadge type={credit.client.type} />}
            <CreditStatusBadge status={credit.status} />
          </div>
          <p className="text-slate-400 text-sm">
            Crédit #{String(credit.id).slice(0, 8)} · Commande #{String(credit.orderId).slice(0, 8)} · Créé le {fmtDate(credit.createdAt)}
          </p>
          {credit.author && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-[#137fec] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {credit.author.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-400">
                Créé par <span className="text-slate-200 font-medium">{credit.author.name}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors">
            ← Retour
          </button>
          {credit.status === 'ACTIVE' && (
            <button onClick={() => setShowSettle(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors">
              💳 Enregistrer un paiement
            </button>
          )}
        </div>
      </div>

      {/* Overdue banner */}
      {isOverdue && credit.status === 'ACTIVE' && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-5 py-3">
          <span className="text-rose-400 text-lg">⚠</span>
          <p className="text-sm text-rose-300 font-medium">
            Ce crédit est en retard de <span className="font-black">{Math.abs(days)} jour(s)</span>. Échéance était le {fmtDate(credit.limitedDate)}.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Montant du crédit</p>
          <p className="text-2xl font-black text-rose-400">{fmt(credit.amount)}</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date limite</p>
          <p className="text-lg font-black text-white">{fmtDate(credit.limitedDate)}</p>
          <p className={`text-xs mt-1 ${isOverdue ? 'text-rose-400' : days <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
            {isOverdue ? `${Math.abs(days)}j de retard` : `Dans ${days} jour(s)`}
          </p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Limite client</p>
          <p className="text-2xl font-black text-white">{fmt(credit.client.creditLimit)}</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Statut</p>
          <div className="flex items-center gap-2 mt-1">
            <CreditStatusBadge status={credit.status} />
            <select
              value={credit.status}
              onChange={e => onStatusChange(credit.id, e.target.value as CreditStatus)}
              className="bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="ACTIVE">Actif</option>
              <option value="PAID">Payé</option>
              <option value="EXPIRED">Expiré</option>
              <option value="CANCELED">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client info & Order info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="text-[#137fec]">👤</span> Client
          </h3>
            <div className="space-y-2.5">
              {credit.client && (
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Nom</span>
                  <span className="text-sm font-semibold text-white">{credit.client.name}</span>
                </div>
              )}
            {credit.client && credit.client.phone && (
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Téléphone</span>
                <span className="text-sm text-slate-300">{credit.client.phone}</span>
              </div>
            )}
            {credit.client && credit.client.email && (
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Email</span>
                <span className="text-sm text-slate-300">{credit.client.email}</span>
              </div>
            )}
            {credit.client && credit.client.address && (
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Adresse</span>
                <span className="text-sm text-slate-300">{credit.client.address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Type</span>
              {credit.client && <ClientTypeBadge type={credit.client.type} />}
            </div>
          </div>
        </div>

        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="text-[#137fec]">🧾</span> Commande liée #{String(credit.orderId).slice(0, 8)}
          </h3>
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Total commande</span>
              <span className="text-sm font-bold text-white">{fmt(credit.orders.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Statut commande</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                credit.orders.status === 'PAID'      ? 'bg-emerald-500/15 text-emerald-400' :
                credit.orders.status === 'PENDING'   ? 'bg-amber-500/15 text-amber-400'    :
                credit.orders.status === 'DELIVERED' ? 'bg-blue-500/15 text-blue-400'      :
                                                       'bg-rose-500/15 text-rose-400'
              }`}>
                {credit.orders.status === 'PAID' ? 'Payé' : credit.orders.status === 'PENDING' ? 'En Attente' : credit.orders.status === 'DELIVERED' ? 'Livré' : 'Annulé'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Date commande</span>
              <span className="text-sm text-slate-300">{fmtDate(credit.orders.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Nb articles</span>
              <span className="text-sm text-slate-300">
                {credit.orders.items.reduce((s,i) => s + i.quantity, 0) || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showSettle && (
        <SettleModal
          credit={credit}
          onClose={() => setShowSettle(false)}
          onConfirm={onSettle}
        />
      )}
    </div>
  );
};

// ─── Main Credit Component ────────────────────────────────────────────────────

const CreditPage: React.FC = () => {
  const PAGE_SIZE = 6;
  const [credits, setCredits]           = useState<Credit[]>([]);
  const [orders, setOrders]             = useState<Order[]>([]);
  const [selectedCredit, setSelected]   = useState<Credit | null>(null);
  const [settleCredit, setSettle]       = useState<Credit | null>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Credit | null>(null);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CreditStatus>('all');
  const [loading, setLoading]           = useState(false);
  const [loadError, setLoadError]       = useState('');
  const [currentPage, setCurrentPage]   = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [apiCredits, apiOrders] = await Promise.all([
          fetchCredits(),
          fetchOrders(),
        ]);
        if (!cancelled) {
          setCredits(apiCredits);
          if (Array.isArray(apiOrders)) {
            setOrders(apiOrders as Order[]);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Erreur lors du chargement des crédits.";
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

  const handleOpenCreate = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const apiOrders = await fetchOrders();
      if (Array.isArray(apiOrders)) {
        setOrders(apiOrders as Order[]);
      }
      setShowCreate(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des commandes.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = async (data: {
    clientId: string;
    orderId: string;
    amount: number;
    limitedDate: string;
    status: CreditStatus;
  }) => {
    try {
      const created = await createCredit({
        clientId: data.clientId,
        orderId: data.orderId,
        amount: data.amount,
        limitedDate: data.limitedDate,
      });
      setCredits(prev => [created, ...prev]);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de créer le crédit.";
      setLoadError(message);
    }
  };

  const handleSettle = (creditId: number, amountPaid: number, _method: string, _reference: string) => {
    setCredits(prev => prev.map(c => {
      if (c.id !== creditId) return c;
      const newAmount = Math.max(0, c.amount - amountPaid);
      return { ...c, amount: newAmount, status: newAmount <= 0 ? 'PAID' : c.status };
    }));
    setSettle(null);
  };

  const handleStatusChange = async (creditId: number, status: CreditStatus) => {
    const previous = credits;
    setCredits(prev =>
      prev.map(c => (c.id === creditId ? { ...c, status } : c)),
    );
    try {
      await updateCreditStatus(creditId, status);
    } catch (err: unknown) {
      setCredits(previous);
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour le statut du crédit.";
      setLoadError(message);
    }
  };

  const handleDelete = async (creditId: number) => {
    const previous = credits;
    setCredits(prev => prev.filter(c => c.id !== creditId));
    setSelected(null);
    setDeleteConfirm(null);
    try {
      await deleteCredit(creditId);
    } catch (err: unknown) {
      // rollback if backend delete failed
      setCredits(previous);
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le crédit.";
      setLoadError(message);
    }
  };

  // ── Filters ───────────────────────────────────────────────────────────────

  const filtered = credits.filter(c => {
    const clientPhone = (c.client.phone ?? '').replace(/\D/g, '');
    const clientPhoneText = c.client.phone?.toLowerCase() ?? '';
    const clientEmail = c.client.email?.toLowerCase() ?? '';
    const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matchSearch = !words.length || words.every(w => {
      const wDigits = w.replace(/\D/g, '');
      return (
        c.client.name.toLowerCase().includes(w) ||
        clientEmail.includes(w) ||
        clientPhoneText.includes(w) ||
        String(c.id).includes(w) ||
        String(c.orderId).includes(w) ||
        (wDigits.length > 0 && clientPhone.includes(wDigits))
      );
    });
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedCredits = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalDebt    = credits.filter(c => c.status === 'ACTIVE' || c.status === 'EXPIRED').reduce((s,c) => s + c.amount, 0);
  const activeCount  = credits.filter(c => c.status === 'ACTIVE').length;
  const expiredCount = credits.filter(c => c.status === 'EXPIRED').length;
  const totalCredit  = credits.reduce((s,c) => s + c.client.creditLimit, 0);
  const utilization  = totalCredit > 0 ? ((totalDebt / totalCredit) * 100) : 0;

  // ── Detail view ───────────────────────────────────────────────────────────

  const currentCredit = selectedCredit
    ? credits.find(c => c.id === selectedCredit.id) ?? selectedCredit
    : null;

  if (currentCredit) {
    return (
      <CreditDetail
        credit={currentCredit}
        onBack={() => setSelected(null)}
        onSettle={handleSettle}
        onStatusChange={handleStatusChange}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestion du Crédit</h1>
          <p className="text-slate-400 text-sm mt-1">Suivi des crédits clients liés aux commandes</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-xs text-slate-500">
              Chargement des crédits…
            </span>
          )}
          {loadError && (
            <span className="text-xs text-amber-300 max-w-xs text-right">
              {loadError}
            </span>
          )}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            + Nouveau Crédit
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total des Crédits</p>
          <p className="text-2xl font-black text-white">{credits.length}</p>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Montant Impayé</p>
          <p className="text-2xl font-black text-rose-400">{fmt(totalDebt)}</p>
          <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-rose-400 rounded-full transition-all" style={{ width: `${Math.min(utilization, 100)}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{utilization.toFixed(1)}% des limites</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Actifs</p>
          <p className="text-2xl font-black text-emerald-400">{activeCount}</p>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Expirés</p>
          <p className="text-2xl font-black text-amber-400">{expiredCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher (client, ID, commande)..."
            className="bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 w-72"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
          {([
            { key: 'all',     label: 'Tous'    },
            { key: 'ACTIVE',  label: 'Actif'   },
            { key: 'PAID',    label: 'Payé'    },
            { key: 'EXPIRED', label: 'Expiré' },
            { key: 'CANCELED',label: 'Annulé' },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                statusFilter === f.key ? 'bg-[#137fec] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <p className="text-sm text-slate-400">{filtered.length} crédit(s) affiché(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {['ID Crédit', 'Client', 'Commande', 'Montant', 'Date limite', 'Créé le', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedCredits.map(credit => {
                const days = daysUntil(credit.limitedDate);
                const overdue = days < 0 && credit.status === 'ACTIVE';
                return (
                  <tr
                    key={credit.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => setSelected(credit)}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-[#137fec]">
                      #{String(credit.id).slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ClientTypeBadge type={credit.client.type} />
                        <div>
                          <p className="text-sm font-semibold text-white">{credit.client.name}</p>
                          {credit.client.phone && (
                            <p className="text-xs text-slate-500">{credit.client.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-400">
                      #{String(credit.orderId).slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-rose-400">
                      {fmt(credit.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{fmtDate(credit.limitedDate)}</p>
                      <p className={`text-xs mt-0.5 ${overdue ? 'text-rose-400 font-semibold' : days <= 7 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {overdue ? `⚠ ${Math.abs(days)}j de retard` : credit.status !== 'ACTIVE' ? '—' : `Dans ${days}j`}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {fmtDate(credit.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <CreditStatusBadge status={credit.status} />
                    </td>
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelected(credit)}
                          className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors"
                          title="Voir détail"
                        >👁</button>
                        {credit.status === 'ACTIVE' && (
                          <button
                            onClick={() => setSettle(credit)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Enregistrer paiement"
                          >💳</button>
                        )}
                        <button
                          onClick={() => handleStatusChange(credit.id, credit.status === 'CANCELED' ? 'ACTIVE' : 'CANCELED')}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title={credit.status === 'CANCELED' ? 'Réactiver' : 'Annuler'}
                        >🚫</button>
                        <button
                          onClick={() => setDeleteConfirm(credit)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm">
                    Aucun crédit trouvé
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

      {/* Modals */}
      {settleCredit && (
        <SettleModal
          credit={settleCredit}
          onClose={() => setSettle(null)}
          onConfirm={handleSettle}
        />
      )}

      {showCreate && (
        <CreateCreditModal
          orders={orders}
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer le crédit</h3>
            <p className="text-slate-400 text-sm mb-1">
              Supprimer le crédit <span className="text-white font-semibold">#{String(deleteConfirm.id).slice(0, 8)}</span> de{' '}
              <span className="text-white font-semibold">{deleteConfirm.client.name}</span> ?
            </p>
            <p className="text-xs text-slate-500 mb-4">Cette action est irréversible.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Annuler</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditPage;