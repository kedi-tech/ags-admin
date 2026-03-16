import React, { useEffect, useMemo, useState } from 'react';
import { fetchOrders } from '@/api/orders';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  type Client as ApiClient,
} from '@/api/clients';

type ClientType = 'INDIVIDUAL' | 'COMPANY';

interface OrderFromApi {
  id: number;
  client: {
    id: number;
    type: ClientType;
    name: string;
    email?: string | null;
    creditLimit: number;
  };
  total: number;
  isCredit: boolean;
}

interface CustomerSummary {
  id: number;
  name: string;
  email?: string | null;
  type: ClientType;
  creditLimit: number;
  totalOrders: number;
  totalAmount: number;
  hasCreditOrders: boolean;
}

const TypeBadge: React.FC<{ type: ClientType }> = ({ type }) => {
  if (type === 'COMPANY') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400">
        Société
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300">
      Particulier
    </span>
  );
};

interface CustomersProps {
  onNavigate?: (page: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ onNavigate }) => {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [orders, setOrders] = useState<OrderFromApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ClientType>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editingClient, setEditingClient] = useState<ApiClient | null>(null);
  const [deleteClientTarget, setDeleteClientTarget] = useState<ApiClient | null>(null);
  const [deletingClient, setDeletingClient] = useState(false);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ClientType>('INDIVIDUAL');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [apiOrders, apiClients] = await Promise.all([
          fetchOrders(),
          fetchClients(),
        ]);
        if (!cancelled) {
          if (Array.isArray(apiOrders)) {
            setOrders(apiOrders as OrderFromApi[]);
          }
          if (Array.isArray(apiClients)) {
            setClients(apiClients);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Erreur lors du chargement des clients (commandes).";
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

  const customers = useMemo<CustomerSummary[]>(() => {
    return clients.map((c) => {
      const clientOrders = orders.filter(
        (o) => o.client && o.client.id === c.id,
      );
      const totalOrders = clientOrders.length;
      const totalAmount = clientOrders.reduce(
        (sum, o) => sum + o.total,
        0,
      );
      const hasCreditOrders = clientOrders.some((o) => o.isCredit);

      return {
        id: c.id,
        name: c.name,
        email: c.email ?? undefined,
        type: c.type as ClientType,
        creditLimit: c.creditLimit,
        totalOrders,
        totalAmount,
        hasCreditOrders,
      };
    });
  }, [clients, orders]);

  const filtered = customers.filter((c) => {
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    const query = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(query) ||
      (c.email ? c.email.toLowerCase().includes(query) : false);
    return matchType && matchSearch;
  });

  const totalCreditCustomers = customers.filter((c) => c.hasCreditOrders).length;
  const totalCreditExposure = customers.reduce(
    (sum, c) => sum + (c.hasCreditOrders ? c.totalAmount : 0),
    0,
  );

  const customerOrders = selectedCustomer
    ? orders.filter(o => o.client && o.client.id === selectedCustomer.id)
    : [];

  const resetCreateForm = () => {
    setNewName('');
    setNewType('INDIVIDUAL');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setEditingClient(null);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError("Le nom du client est requis.");
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, {
          name: newName.trim(),
          type: newType,
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
          address: newAddress.trim() || undefined,
        });
        setClients(prev =>
          prev.map(c => (c.id === updated.id ? updated : c)),
        );
      } else {
        const created = await createClient({
          name: newName.trim(),
          type: newType,
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
          address: newAddress.trim() || undefined,
        });
        setClients((prev) => [...prev, created]);
      }
      setShowCreateModal(false);
      resetCreateForm();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de créer le client.";
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  if (selectedCustomer) {
    return (
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setSelectedCustomer(null)}
            className="text-[#137fec] hover:text-blue-400 font-medium transition-colors"
          >
            Clients
          </button>
          <span className="text-slate-500">›</span>
          <span className="text-white font-medium">{selectedCustomer.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {selectedCustomer.name}
            </h1>
            {selectedCustomer.email && (
              <p className="text-slate-400 text-sm mt-1">
                {selectedCustomer.email}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <TypeBadge type={selectedCustomer.type} />
            {selectedCustomer.hasCreditOrders && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400">
                Crédit actif
              </span>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Commandes totales
            </p>
            <p className="text-2xl font-black text-white">
              {selectedCustomer.totalOrders}
            </p>
          </div>
          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Montant total (GNF)
            </p>
            <p className="text-2xl font-black text-emerald-400">
              {selectedCustomer.totalAmount.toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Limite de crédit (GNF)
            </p>
            <p className="text-2xl font-black text-white">
              {selectedCustomer.creditLimit.toLocaleString('fr-FR')}
            </p>
          </div>
        </div>

        {/* Orders table for this customer */}
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-bold">Commandes du client</h2>
            <p className="text-xs text-slate-400">
              {customerOrders.length} commande(s)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Crédit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {customerOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => {
                      try {
                        window.localStorage.setItem('erp:selectedOrderId', String(o.id));
                      } catch {
                        // ignore storage errors
                      }
                      onNavigate?.('commandes');
                    }}
                  >
                    <td className="px-6 py-3.5 text-sm font-mono text-[#137fec]">
                      #{String(o.id).padStart(3, '0')}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-white">
                      GNF {o.total.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-3.5 text-sm">
                      {o.isCredit ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400">
                          Oui
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400">
                          Non
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-400">
                      {(() => {
                        const createdAt = (o as any).createdAt;
                        return createdAt
                          ? new Date(createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-';
                      })()}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-300">
                      {(o as any).status ?? ''}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-300">
                      <button className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors" title="Voir les détails">
                        <span className="material-symbols-outlined text-base" onClick={() => setSelectedOrder(o)}>visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {customerOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-6 text-center text-sm text-slate-500"
                    >
                      Aucune commande pour ce client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Gestion des Clients
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Vue d&apos;ensemble des clients créés via les commandes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetCreateForm();
              setShowCreateModal(true);
              setCreateError('');
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#137fec] text-white hover:bg-blue-500 transition-colors"
          >
            <span className="material-symbols-outlined text-base">
              person_add
            </span>
            Nouveau client
          </button>
          <div className="flex flex-col items-end gap-1">
            {loading && (
              <span className="text-xs text-slate-500">
                Chargement des clients…
              </span>
            )}
            {loadError && (
              <span className="text-xs text-amber-300 max-w-xs text-right">
                {loadError}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Clients totaux
          </p>
          <p className="text-2xl font-black text-white">
            {customers.length}
          </p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Clients avec commandes à crédit
          </p>
          <p className="text-2xl font-black text-white">
            {totalCreditCustomers}
          </p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Exposition totale crédit (GNF)
          </p>
          <p className="text-2xl font-black text-emerald-400">
            {totalCreditExposure.toLocaleString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 w-72"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'INDIVIDUAL', label: 'Particuliers' },
            { key: 'COMPANY', label: 'Sociétés' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key as any)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                typeFilter === t.key
                  ? 'bg-[#137fec] text-white'
                  : 'text-slate-400 hover:text-slate-200'
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
          <p className="text-sm text-slate-400">
            Affichage {filtered.length} sur {customers.length} clients
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Commandes
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Montant total
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Limite de crédit
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Crédit actif
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(c)}
                >
                  <td className="px-6 py-4 text-sm text-white">
                    <div className="font-semibold">{c.name}</div>
                    {c.email && (
                      <div className="text-xs text-slate-400">{c.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <TypeBadge type={c.type} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {c.totalOrders}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">
                    GNF {c.totalAmount.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    GNF {c.creditLimit.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {c.hasCreditOrders ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400">
                        Oui
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400">
                        Non
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const base = clients.find(cl => cl.id === String(c.id));
                          if (!base) return;
                          setEditingClient(base);
                          setNewName(base.name);
                          setNewType(base.type as ClientType);
                          setNewEmail(base.email ?? '');
                          setNewPhone((base as any).phone ?? '');
                          setNewAddress((base as any).address ?? '');
                          setCreateError('');
                          setShowCreateModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          const base = clients.find(cl => cl.id === String(c.id));
                          if (!base) return;
                          setDeleteClientTarget(base);
                        }}
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
                  <td
                    colSpan={7}
                    className="px-6 py-6 text-center text-sm text-slate-500"
                  >
                    Aucun client trouvé. Ajoutez un client pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showCreateModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#020817] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {editingClient ? 'Modifier le client' : 'Nouveau client'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Renseignez les informations du client.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!creating) {
                    setShowCreateModal(false);
                    setCreateError('');
                    resetCreateForm();
                  }
                }}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="px-6 py-5 space-y-4">
              {createError && (
                <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                  {createError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Nom complet <span className="text-amber-400">*</span>
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#137fec] focus:border-[#137fec]"
                  placeholder="Nom du client"
                  disabled={creating}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Type de client
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ClientType)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#137fec] focus:border-[#137fec]"
                  disabled={creating}
                >
                  <option value="INDIVIDUAL">Particulier</option>
                  <option value="COMPANY">Société</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Téléphone (optionnel)
                  </label>
                  <input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#137fec] focus:border-[#137fec]"
                    placeholder="+224..."
                    disabled={creating}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Email (optionnel)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#137fec] focus:border-[#137fec]"
                    placeholder="client@example.com"
                    disabled={creating}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Adresse (optionnel)
                </label>
                <textarea
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#137fec] focus:border-[#137fec] resize-none"
                  placeholder="Adresse du client"
                  disabled={creating}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!creating) {
                      setShowCreateModal(false);
                      setCreateError('');
                      resetCreateForm();
                    }
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#137fec] text-white hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {creating && (
                    <span className="material-symbols-outlined text-base animate-spin">
                      progress_activity
                    </span>
                  )}
                  {editingClient ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteClientTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#020817] border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer le client</h3>
            <p className="text-slate-400 text-sm mb-4">
              Êtes-vous sûr de vouloir supprimer{' '}
              <span className="text-white font-semibold">{deleteClientTarget.name}</span> ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { if (!deletingClient) setDeleteClientTarget(null); }}
                disabled={deletingClient}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!deleteClientTarget) return;
                  try {
                    setDeletingClient(true);
                    await deleteClient(deleteClientTarget.id);
                    setClients(prev => prev.filter(c => c.id !== deleteClientTarget.id));
                    setDeleteClientTarget(null);
                  } catch (err) {
                    console.error('Erreur lors de la suppression du client', err);
                  } finally {
                    setDeletingClient(false);
                  }
                }}
                disabled={deletingClient}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deletingClient ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

