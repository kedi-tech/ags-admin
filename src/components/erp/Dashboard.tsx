import React, { useEffect, useState } from 'react';
import { type Product } from '@/data/erp-data';
import { fetchProducts } from '@/api/products';
import { fetchOrders } from '@/api/orders';

const getStockStatus = (stock: number): 'en_stock' | 'stock_faible' | 'rupture' => {
  if (stock <= 0) return 'rupture';
  if (stock < 15) return 'stock_faible';
  return 'en_stock';
};

const WEEKDAY_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const getWelcomeLine = (): string => {
  const name = typeof window !== 'undefined' ? localStorage.getItem('name') : null;
  const displayName = (name && name.trim()) || 'Utilisateur';
  const d = new Date();
  const weekday = WEEKDAY_FR[d.getDay()];
  const day = d.getDate();
  const month = MONTH_FR[d.getMonth()];
  const year = d.getFullYear();
  return `Bienvenue, ${displayName} · ${weekday} ${day} ${month} ${year}`;
};

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
    détail: { label: 'Détail', cls: 'bg-slate-500/15 text-slate-400' },
    gros: { label: 'Gros', cls: 'bg-indigo-500/15 text-indigo-400' },
    crédit: { label: 'Crédit', cls: 'bg-cyan-500/15 text-cyan-400' },
  };
  const t = map[type] || { label: type, cls: 'bg-slate-500/15 text-slate-400' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.cls}`}>{t.label}</span>;
};

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [apiProducts, apiOrders] = await Promise.all([
          fetchProducts(),
          fetchOrders(),
        ]);
        if (!cancelled) {
          if (Array.isArray(apiProducts)) {
            setProducts(apiProducts);
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
              : "Erreur lors du chargement des produits pour le tableau de bord.";
          setError(message);
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

  const activeProducts = products.filter((p) => p.isActive);
  const lowStockProducts = activeProducts.filter(
    (p) => getStockStatus(p.stock) !== 'en_stock',
  );
  const totalProducts = activeProducts.length;

  // Metrics derived from real orders
  // Total sales = only orders with status PAID
  const totalSales = orders.reduce(
    (sum, o) =>
      o.status === 'PAID' && typeof o.total === 'number' ? sum + o.total : sum,
    0,
  );
  // Outstanding credit = credit orders not PAID or CANCELLED
  const creditOutstanding = orders.reduce(
    (sum, o) =>
      o.isCredit &&
      o.status !== 'CANCELLED' &&
      o.status !== 'PAID' &&
      typeof o.total === 'number'
        ? sum + o.total
        : sum,
    0,
  );
  const today = new Date().toDateString();
  const todayRevenue = orders.reduce((sum, o) => {
    if (!o.createdAt || typeof o.total !== 'number') return sum;
    const d = new Date(o.createdAt);
    return d.toDateString() === today ? sum + o.total : sum;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Vue d'ensemble du Tableau de Bord</h1>
          <p className="text-slate-400 text-sm mt-1">{getWelcomeLine()}</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-xs text-slate-500">
              Synchronisation avec l&apos;API…
            </span>
          )}
          {error && (
            <span className="text-xs text-amber-300">
              {error}
            </span>
          )}
        <button
          onClick={() => lowStockProducts.length > 0 && setDrawerOpen(true)}
          disabled={lowStockProducts.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            lowStockProducts.length === 0
              ? 'bg-slate-900/60 border-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
          }`}
        >
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          Alertes de Stock ({lowStockProducts.length})
        </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Ventes Totales"
          value={`GNF ${totalSales.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`}
          change="+12% du mois dernier"
          changePositive={true}
          icon="trending_up"
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/15"
          chart={[40, 65, 45, 75, 55, 80, 90]}
        />
        <MetricCard
          title="Crédit en Cours"
          value={`GNF ${creditOutstanding.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`}
          change="+5% par rapport à hier"
          changePositive={false}
          icon="credit_score"
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/15"
          chart={[30, 50, 70, 45, 80, 65, 85]}
        />
        <MetricCard
          title="Produits Actifs"
          value={`${totalProducts}`}
          change={`Alertes stock faible : ${lowStockProducts.length}`}
          changePositive={lowStockProducts.length === 0}
          icon="inventory"
          iconColor="text-amber-400"
          iconBg="bg-amber-500/15"
          chart={[10, 15, 8, 18, 12, 16, 18]}
        />
        <MetricCard
          title="Revenu d'Aujourd'hui"
          value={`GNF ${todayRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`}
          change="+18% par rapport à hier"
          changePositive={true}
          icon="payments"
          iconColor="text-[#137fec]"
          iconBg="bg-[#137fec]/15"
          chart={[20, 35, 50, 42, 60, 55, 70]}
        />
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-bold">Commandes Récentes</h2>
          <button
            onClick={() => onNavigate('commandes')}
            className="text-[#137fec] text-sm font-medium hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            Voir Tout <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">ID Commande</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .slice()
                .sort((a, b) => {
                  const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return db - da;
                })
                .slice(0, 5)
                .map((o) => (
                  <tr key={o.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-mono text-[#137fec]">
                      #{String(o.id).padStart(3, '0')}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium text-white">
                      {o.client?.name ?? 'Client inconnu'}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-300">
                      {o.isCredit ? 'Crédit' : o.client?.type === 'COMPANY' ? 'Société' : 'Particulier'}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-white">
                      GNF {(typeof o.total === 'number' ? o.total : 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-400">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-300">
                      {o.status}
                    </td>
                  </tr>
                ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-sm text-slate-500">
                    Aucune commande récente à afficher pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="w-96 bg-[#0d1520] border-l border-slate-800 h-full flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <h2 className="text-white font-bold text-lg">Alertes de Stock Faible</h2>
                <p className="text-slate-400 text-xs mt-0.5">Action Requise</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {lowStockProducts.map((p) => {
                const status = getStockStatus(p.stock);
                return (
                  <div key={p.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{p.name}</p>
                        <p className="text-xs text-slate-400">
                          {p.sku} · {p.categoryName ?? 'Sans catégorie'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          status === 'rupture'
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {status === 'rupture' ? 'Rupture de Stock' : 'Stock Faible'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">
                        {p.stock} unités restantes
                      </span>
                      <button className="flex items-center gap-1 px-3 py-1 bg-[#137fec]/15 text-[#137fec] rounded-lg text-xs font-medium hover:bg-[#137fec]/25 transition-colors">
                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                        Réapprovisionner
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => { setDrawerOpen(false); onNavigate('stock'); }}
                className="w-full py-2.5 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
              >
                Voir Tous les Articles en Stock Faible
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changePositive: boolean;
  icon: string;
  iconColor: string;
  iconBg: string;
  chart: number[];
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changePositive, icon, iconColor, iconBg, chart }) => {
  const max = Math.max(...chart);
  return (
    <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <span className={`material-symbols-outlined ${iconColor} text-xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <div className="flex gap-1 items-end h-8">
          {chart.map((v, i) => (
            <div key={i} className={`w-1 rounded-sm ${iconBg}`} style={{ height: `${(v / max) * 100}%`, minHeight: '4px' }} />
          ))}
        </div>
      </div>
      <p className="text-2xl font-black text-white tracking-tight">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{title}</p>
      <p className={`text-xs mt-2 font-medium ${changePositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {changePositive ? '↑' : '↓'} {change}
      </p>
    </div>
  );
};

export default Dashboard;
