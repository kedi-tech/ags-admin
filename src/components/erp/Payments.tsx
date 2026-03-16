import React, { useEffect, useState } from 'react';
import { type Payment } from '@/data/erp-data';
import { fetchPayments as fetchPaymentsApi, createPayment } from '@/api/payments';
import { fetchOrders } from '@/api/orders';

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

const PaymentModal: React.FC<{
  payment?: Payment | null;
  onClose: () => void;
  onSave: (data: Partial<Payment>) => void;
  orders: any[];
  creating: boolean;
}> = ({ payment, onClose, onSave, orders, creating }) => {
  // Only show orders that are not cancelled and not paid (so we can record a payment)
  const payableOrders = orders.filter(
    (o: any) => o.status !== 'CANCELLED' && o.status !== 'PAID',
  );
  const [form, setForm] = useState({
    orderId: payment?.orderId?.toString() || '',
    customer: payment?.customer || '',
    date: payment?.date || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    source: (payment?.source || 'détail') as Payment['source'],
    method: (payment?.method || 'carte') as Payment['method'],
    reference: payment?.reference || '',
    // txnId: payment?.txnId || '',
    // type: payment?.type || 'CASH',
    amount: payment?.amount?.toString() || '',
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
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Commande liée
            </label>
            <select
              value={form.orderId}
              onChange={e => setForm({ ...form, orderId: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            >
              <option value="">Sélectionner une commande</option>
              {payableOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  CMD-{String(o.id).padStart(3, '0')} · {o.client?.name ?? `Client #${o.clientId}`}
                </option>
              ))}
            </select>
            {payableOrders.length === 0 && (
              <p className="mt-1.5 text-xs text-slate-500">
                Aucune commande disponible (seules les commandes non annulées et non payées sont affichées).
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
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
            {/* <div>
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
            </div> */}
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
                <option value="mobile_money">Mobile Money</option>
                
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
            {/* <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Txn ID</label>
              <input
                value={form.txnId}
                onChange={e => setForm({ ...form, txnId: e.target.value })}
                placeholder="txi-123"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div> */}
            {/* <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as Payment['type'] })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="CASH">CASH</option>
                <option value="ST">SYSTEM</option>
              </select>
            </div> */}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            disabled={creating}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onSave({
                orderId: form.orderId || undefined,
                method: form.method,
                reference: form.reference,
                amount: parseFloat(form.amount) || 0,
              });
            }}
            disabled={creating || !form.orderId || !form.amount || !form.method}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {creating && !payment && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {payment ? 'Enregistrer' : 'Créer le paiement'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentDetail: React.FC<{
  payment: Payment;
  order?: any;
  onBack: () => void;
}> = ({ payment, order, onBack }) => {
  const createdAtLabel = payment.date;
  const orderLabel = payment.orderId
    ? `CMD-${String(payment.orderId).padStart(3, '0')}`
    : '—';
  const clientName =
    order?.client?.name ?? payment.customer ?? 'Client inconnu';

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={onBack}
          className="text-[#137fec] hover:text-blue-400 font-medium transition-colors"
        >
          Grand Livre des Paiements
        </button>
        <span className="text-slate-500">›</span>
        <span className="text-white font-medium">
          Paiement {payment.id}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {payment.method} · GNF{' '}
            {payment.amount.toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
            })}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {clientName} · {orderLabel} · {createdAtLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {payment.type && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-200">
              Type: {payment.type}
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">
            Terminé
          </span>
        </div>
      </div>

      {/* Two-column info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-white font-bold mb-1.5">Détails du paiement</h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">ID Paiement</span>
            <span className="text-slate-200 font-mono">{payment.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Méthode</span>
            <span className="text-slate-200 capitalize">{payment.method}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Référence</span>
            <span className="text-slate-200 font-mono">
              {payment.reference || '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Montant</span>
            <span className="text-white font-semibold">
              GNF{' '}
              {payment.amount.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Date de paiement</span>
            <span className="text-slate-200">{createdAtLabel}</span>
          </div>
        </div>

        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-white font-bold mb-1.5">Commande associée</h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Commande</span>
            <span className="text-slate-200">{orderLabel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Client</span>
            <span className="text-slate-200">{clientName}</span>
          </div>
          {order && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Montant commande</span>
                <span className="text-slate-200">
                  GNF{' '}
                  {Number(order.total ?? 0).toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Type</span>
                <span className="text-slate-200">
                  {order.isCredit ? 'Crédit' : 'Standard'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Statut commande</span>
                <span className="text-slate-200">{order.status}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors"
        >
          ← Retour aux paiements
        </button>
      </div>
    </div>
  );
};

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sourceFilter, setSourceFilter] = useState('tous');
  const [methodFilter, setMethodFilter] = useState('tous');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    let cancelled = false;

    const normalizePayments = (items: any[]): Payment[] => {
      const result: Payment[] = [];
      items.forEach((p, idx) => {
        const createdAt = p.createdAt ? new Date(p.createdAt) : null;
        const dateStr =
          createdAt && !Number.isNaN(createdAt.getTime())
            ? createdAt.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '';
        const id = p.id != null ? `PAY-${p.id}` : `PAY-${idx + 1}`;
        const orderId = p.order?.id ?? p.orderId;
        const method = (p.method as Payment['method']) ?? 'espèces';
        const amount =
          typeof p.amount === 'number' ? p.amount : Number(p.amount ?? 0);

        const status: Payment['status'] =
          (p.status as Payment['status']) ?? 'terminé';
        const source: Payment['source'] =
          (p.source as Payment['source']) ?? 'détail';
        const customerName =
          p.order?.client?.name ??
          p.customerName ??
          p.customer ??
          (typeof orderId === 'number'
            ? `Commande #${orderId}`
            : 'Client inconnu');

        result.push({
          id,
          date: dateStr,
          source,
          method,
          reference: p.reference ?? '',
          amount,
          status,
          customer: customerName,
          orderId,
          type: p.type ?? undefined,
        });
      });
      return result;
    };

    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [apiPayments, apiOrders] = await Promise.all([
          fetchPaymentsApi(),
          fetchOrders(),
        ]);
        if (!cancelled) {
          if (Array.isArray(apiPayments)) {
            setPayments(normalizePayments(apiPayments));
          }
          if (Array.isArray(apiOrders)) {
            setOrders(apiOrders);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Erreur lors du chargement des paiements.';
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

  const handleSave = (data: Partial<Payment>) => {
    // When editing, only update local state (no backend PUT defined yet)
    if (editPayment) {
      setPayments(payments.map(p => p.id === editPayment.id ? { ...p, ...data } : p));
      setEditPayment(null);
      return;
    }

    // When creating, respect backend body and call POST /api/v1/payments
    if (!data.orderId || !data.amount || !data.method) {
      // Minimal validation: require orderId, amount, method
      alert("Veuillez sélectionner une commande, un montant et une méthode.");
      return;
    }

    const reference =
      typeof data.reference === 'string' && data.reference.trim().length > 0
        ? data.reference.trim()
        : `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}`;

    const payload = {
      orderId: data.orderId,
      amount: data.amount,
      method: data.method,
      reference,
      // txnId: data.txnId,
      // type: data.type,
    };

    setCreating(true);
    createPayment(payload)
      .then(created => {
        // Normalise and append created payment to list
        const normalised = {
          id: created.id != null ? `PAY-${created.id}` : `PAY-${payments.length + 1}`,
          date: created.createdAt
            ? new Date(created.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '',
          source: (created.source as Payment['source']) ?? 'détail',
          method: (created.method as Payment['method']) ?? 'espèces',
          reference: created.reference ?? '',
          amount: created.amount,
          status: (created.status as Payment['status']) ?? 'terminé',
          customer:
            created.customerName ??
            (created.orderId ? `Commande #${created.orderId}` : 'Client inconnu'),
          orderId: created.orderId,
          txnId: created.txnId ?? undefined,
          type: created.type ?? undefined,
        } as Payment;

        setPayments(prev => [...prev, normalised]);
        setShowModal(false);
      })
      .catch(err => {
        console.error('Erreur création paiement', err);
      })
      .finally(() => {
        setEditPayment(null);
        setCreating(false);
      });
  };

  const handleDelete = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
    setDeleteConfirm(null);
  };

  const filtered = payments.filter(p => {
    const matchMethod =
      methodFilter === 'tous' || p.method === methodFilter;

    const query = search.trim().toLowerCase();
    if (!query) return matchMethod;

    const inReference = p.reference.toLowerCase().includes(query);
    const inCustomer = p.customer.toLowerCase().includes(query);
    const inOrderId =
      p.orderId != null && String(p.orderId).includes(query);
    const inId = p.id.toLowerCase().includes(query);

    const matchSearch =
      inReference || inCustomer || inOrderId || inId;

    return matchMethod && matchSearch;
  });

  const totalReceived = payments.filter(p => p.status === 'terminé').reduce((s, p) => s + p.amount, 0);
  const retailPayments = payments.filter(p => p.source === 'détail' && p.status === 'terminé').reduce((s, p) => s + p.amount, 0);
  const wholesalePayments = payments.filter(p => p.source === 'gros' && p.status === 'terminé').reduce((s, p) => s + p.amount, 0);

  // Crédits en Attente: calculated from orders, not individual payments
  // For each credit order (isCredit === true), we compute remaining = total - sum(payments.amount)
  // and sum only the positive remaining balances.
  const pendingCredits = orders.reduce((sum, o) => {
    if (!o.isCredit) return sum;
    const total = typeof o.total === 'number' ? o.total : Number(o.total ?? 0);
    if (total <= 0) return sum;
    const paid = Array.isArray(o.payments)
      ? o.payments.reduce(
          (acc: number, p: any) =>
            acc +
            (typeof p.amount === 'number'
              ? p.amount
              : Number(p.amount ?? 0)),
          0,
        )
      : 0;
    const remaining = total - paid;
    return remaining > 0 ? sum + remaining : sum;
  }, 0);

  // If a payment is selected, show its detail page instead of the list
  if (selectedPayment) {
    const relatedOrder = orders.find(
      (o) => o.id === selectedPayment.orderId,
    );
    return (
      <PaymentDetail
        payment={selectedPayment}
        order={relatedOrder}
        onBack={() => setSelectedPayment(null)}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Grand Livre des Paiements</h1>
          <p className="text-slate-400 text-sm mt-1">Suivre et gérer tous les paiements entrants</p>
          {loading && (
            <p className="text-xs text-slate-500 mt-1">
              Chargement des paiements…
            </p>
          )}
          {loadError && (
            <p className="text-xs text-amber-300 mt-1 max-w-md">
              {loadError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors">
              <span className="material-symbols-outlined text-lg">download</span>
              Exporter le Rapport
              <span className="material-symbols-outlined text-base">arrow_drop_down</span>
            </button> */}
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
          value={methodFilter}
          onChange={e => setMethodFilter(e.target.value)}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-[#137fec]/50"
        >
          <option value="tous">Toutes les Méthodes</option>
          <option value="espèces">Espèces</option>
          <option value="carte">Carte</option>
          <option value="virement">Virement</option>
          <option value="chèque">Chèque</option>
          <option value="mobile_money">Mobile Money</option>
         
        </select>
        
      </div>

      {/* Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Commande</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date Paiement</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Méthode</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Référence</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-3.5 text-sm font-mono text-[#137fec]">
                    {p.id.slice(0, 12)}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-300">
                    {p.orderId
                      ? `CMD-${String(p.orderId).slice(0, 8)}`
                      : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-medium text-white">
                    {p.customer}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-400">{p.date}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-300 capitalize">{p.method}</td>
                  <td className="px-6 py-3.5 text-sm font-mono text-slate-400">{p.reference}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-white text-right">GNF {p.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-3.5">
                    {p.type === 'SYSTEM' ? (
                      <span className="text-[11px] text-slate-500 italic">
                        Paiement système
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors"
                          title="Voir détail"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>
                        <button
                          onClick={() => { setEditPayment(p); setShowModal(true); }}
                          className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section */}
     

      {showModal && (
        <PaymentModal
          payment={editPayment}
          onClose={() => { setShowModal(false); setEditPayment(null); }}
          onSave={handleSave}
          orders={orders}
          creating={creating}
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
