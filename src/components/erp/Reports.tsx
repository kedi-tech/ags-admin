import React, { useEffect, useMemo, useState } from 'react';
import { fetchOrders } from '@/api/orders';
import { fetchProducts } from '@/api/products';
import { fetchCategories } from '@/api/category';
import { fetchClients } from '@/api/clients';

const Reports: React.FC = () => {
  const PAGE_SIZE = 6;
  const today = new Date();
  const currentYear = today.getFullYear();
  const defaultStart = `${currentYear}-01-01`;
  const defaultEnd = today.toISOString().slice(0, 10);

  const [reportType, setReportType] = useState('résumé');
  const [retailEnabled, setRetailEnabled] = useState(true);
  const [wholesaleEnabled, setWholesaleEnabled] = useState(true);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch orders on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const apiOrders = await fetchOrders();
        if (!cancelled && Array.isArray(apiOrders)) setOrders(apiOrders);
      } catch (err: unknown) {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : 'Erreur lors du chargement des commandes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Lazy-fetch per report type
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        if (reportType === 'produit' && products.length === 0) {
          const data = await fetchProducts();
          if (!cancelled) setProducts(data);
        } else if (reportType === 'catégorie' && categories.length === 0) {
          const data = await fetchCategories();
          if (!cancelled) setCategories(data);
        } else if (reportType === 'client' && clients.length === 0) {
          const data = await fetchClients();
          if (!cancelled) setClients(data);
        }
      } catch (err: unknown) {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : 'Erreur lors du chargement des données.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [reportType]);

  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return orders.filter((o) => {
      const createdAt = o.createdAt ? new Date(o.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
      return createdAt >= start && createdAt <= end;
    });
  }, [orders, startDate, endDate]);

  const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  const getOrderPaidAmount = (o: any): number => {
    const paymentsTotal = Array.isArray(o.payments)
      ? o.payments.reduce((sum: number, p: any) => sum + (typeof p.amount === 'number' ? p.amount : 0), 0)
      : 0;
    if (paymentsTotal > 0) return paymentsTotal;
    if (o.status === 'PAID' && typeof o.total === 'number') return o.total;
    return 0;
  };

  // ── Résumé des Ventes (monthly retail vs wholesale) ──
  const resumeBarData = useMemo(() =>
    monthLabels.map((label, idx) => {
      let retail = 0;
      let wholesale = 0;
      filteredOrders.forEach((o) => {
        const d = new Date(o.createdAt);
        if (d.getMonth() !== idx) return;
        const total = getOrderPaidAmount(o);
        if (o.isCredit && total > 0) wholesale += total;
        else if (total > 0) retail += total;
      });
      return { label, bar1: retail, bar2: wholesale };
    }),
    [filteredOrders],
  );

  // ── Par Produit (active / inactive / total stock) ──
  const produitBarData = useMemo(() => {
    if (!products.length) return [];
    const active = products.filter((p) => p.isActive).length;
    const inactive = products.filter((p) => !p.isActive).length;
    const totalStock = products.reduce(
      (sum, p) => sum + (typeof p.stock === 'number' ? p.stock : 0), 0,
    );
    return [
      { label: 'Actifs', bar1: active, bar2: 0 },
      { label: 'Inactifs', bar1: 0, bar2: inactive },
      { label: 'Total en Stock', bar1: totalStock, bar2: 0 },
    ];
  }, [products]);

  // ── Par Catégorie (products per category) ──
  const categorieBarData = useMemo(() => {
    if (!categories.length) return [];
    return categories.map((cat: any) => ({
      label: cat.name,
      bar1:
        typeof cat._count?.products === 'number'
          ? cat._count.products
          : Array.isArray(cat.products)
          ? cat.products.length
          : 0,
      bar2: 0,
    }));
  }, [categories]);

  // ── Par Client (individual vs company) ──
  const clientBarData = useMemo(() => {
    if (!clients.length) return [];
    const individual = clients.filter((c) => c.type === 'INDIVIDUAL').length;
    const company = clients.filter((c) => c.type === 'COMPANY').length;
    return [
      { label: 'Particuliers', bar1: individual, bar2: 0 },
      { label: 'Entreprises', bar1: 0, bar2: company },
    ];
  }, [clients]);

  type BarItem = { label: string; bar1: number; bar2: number };

  const activeBarData: BarItem[] = useMemo(() => {
    switch (reportType) {
      case 'produit': return produitBarData;
      case 'catégorie': return categorieBarData;
      case 'client': return clientBarData;
      default: return resumeBarData;
    }
  }, [reportType, resumeBarData, produitBarData, categorieBarData, clientBarData]);

  const maxVal = Math.max(1, ...activeBarData.flatMap((d) => [d.bar1, d.bar2]));

  const totalPages = Math.max(1, Math.ceil(activeBarData.length / PAGE_SIZE));
  const paginatedBarData = activeBarData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => { setCurrentPage(1); }, [reportType, startDate, endDate, retailEnabled, wholesaleEnabled]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // ── Summary cards ──
  const summaryCards = useMemo(() => {
    if (reportType === 'résumé') {
      const totalGross = filteredOrders.reduce((sum, o) => sum + getOrderPaidAmount(o), 0);
      const paidCount = filteredOrders.filter((o) => getOrderPaidAmount(o) > 0).length;
      const avgOrder = paidCount > 0 ? totalGross / paidCount : 0;
      return [
        { label: 'Ventes Brutes Totales', value: `GNF ${totalGross.toLocaleString('fr-FR')}` },
        { label: 'Valeur Moyenne des Commandes', value: `GNF ${avgOrder.toLocaleString('fr-FR')}` },
      ];
    }
    if (reportType === 'produit') {
      const active = products.filter((p) => p.isActive).length;
      const inactive = products.filter((p) => !p.isActive).length;
      const totalStock = products.reduce(
        (sum, p) => sum + (typeof p.stock === 'number' ? p.stock : 0), 0,
      );
      return [
        { label: 'Produits Actifs', value: active.toString() },
        { label: 'Produits Inactifs', value: inactive.toString() },
        { label: 'Total en Stock', value: totalStock.toLocaleString('fr-FR') },
      ];
    }
    if (reportType === 'catégorie') {
      const totalProducts = categorieBarData.reduce((s, d) => s + d.bar1, 0);
      return [
        { label: 'Catégories', value: categories.length.toString() },
        { label: 'Total Produits', value: totalProducts.toString() },
      ];
    }
    if (reportType === 'client') {
      const individual = clients.filter((c) => c.type === 'INDIVIDUAL').length;
      const company = clients.filter((c) => c.type === 'COMPANY').length;
      return [
        { label: 'Particuliers', value: individual.toString() },
        { label: 'Entreprises', value: company.toString() },
      ];
    }
    return [];
  }, [reportType, filteredOrders, products, categories, clients, categorieBarData]);

  // ── Chart config per report type ──
  const chartConfig = useMemo(() => {
    switch (reportType) {
      case 'produit':
        return {
          bar1Label: 'Actifs / En Stock',
          bar1Color: 'bg-emerald-500',
          bar2Label: 'Inactifs',
          bar2Color: 'bg-red-500',
          col1: 'Statut',
          col2: 'Valeur',
          col3: '',
        };
      case 'catégorie':
        return {
          bar1Label: 'Produits',
          bar1Color: 'bg-violet-500',
          bar2Label: '',
          bar2Color: '',
          col1: 'Catégorie',
          col2: 'Produits',
          col3: '',
        };
      case 'client':
        return {
          bar1Label: 'Particuliers',
          bar1Color: 'bg-sky-500',
          bar2Label: 'Entreprises',
          bar2Color: 'bg-amber-500',
          col1: 'Type',
          col2: 'Particuliers',
          col3: 'Entreprises',
        };
      default:
        return {
          bar1Label: 'Ventes sur Commande',
          bar1Color: 'bg-orange-500',
          bar2Label: 'Ventes par crédit',
          bar2Color: 'bg-indigo-500',
          col1: 'Mois',
          col2: 'Ventes sur Commande',
          col3: 'Ventes par crédit',
        };
    }
  }, [reportType]);

  // ── CSV export ──
  const handleExportCsv = () => {
    const headers = [chartConfig.col1, chartConfig.col2, chartConfig.col3, 'Total'].filter(Boolean);
    const rows = [
      headers,
      ...activeBarData.map((d) => {
        const row = [d.label, d.bar1.toString()];
        if (chartConfig.col3) row.push(d.bar2.toString());
        row.push((d.bar1 + d.bar2).toString());
        return row;
      }),
    ];
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${reportType}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── PDF export ──
  const handleExportPdf = () => {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    const html = `
      <html>
        <head>
          <title>Rapport</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; }
            h1 { font-size: 20px; margin-bottom: 16px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; text-align: right; }
            th:first-child, td:first-child { text-align: left; }
          </style>
        </head>
        <body>
          <h1>Rapport — ${reportTypes.find((r) => r.key === reportType)?.label}</h1>
          <table>
            <thead>
              <tr>
                <th>${chartConfig.col1}</th>
                <th>${chartConfig.col2}</th>
                ${chartConfig.col3 ? `<th>${chartConfig.col3}</th>` : ''}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${activeBarData
                .map(
                  (d) => `
                <tr>
                  <td>${d.label}</td>
                  <td>${d.bar1.toLocaleString('fr-FR')}</td>
                  ${chartConfig.col3 ? `<td>${d.bar2.toLocaleString('fr-FR')}</td>` : ''}
                  <td>${(d.bar1 + d.bar2).toLocaleString('fr-FR')}</td>
                </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const reportTypes = [
    { key: 'résumé', label: 'Résumé des Ventes' },
    { key: 'produit', label: 'Par Produit' },
    { key: 'catégorie', label: 'Par Catégorie' },
    { key: 'client', label: 'Par Client' },
  ];
  const currentReport = reportTypes.find((rt) => rt.key === reportType) ?? reportTypes[0];
  const summaryYear = new Date(startDate).getFullYear();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Générateur de Rapports</h1>
          <p className="text-slate-400 text-sm mt-1">Rapports basés sur les données réelles</p>
          {loading && <p className="text-xs text-slate-500 mt-1">Chargement des données…</p>}
          {loadError && <p className="text-xs text-amber-300 mt-1 max-w-md">{loadError}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={!activeBarData.length}
            className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exporter en CSV
          </button>
          <button
            onClick={handleExportPdf}
            disabled={!activeBarData.length}
            className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Exporter en PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {reportType === 'résumé' && (
            <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-bold mb-4">Plage de Dates</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4">Type de Rapport</h3>
            <div className="space-y-1">
              {reportTypes.map((rt) => (
                <button
                  key={rt.key}
                  onClick={() => setReportType(rt.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    reportType === rt.key
                      ? 'bg-[#137fec]/15 text-[#137fec]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      reportType === rt.key ? 'bg-[#137fec]' : 'bg-slate-600'
                    }`}
                  />
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          {reportType === 'résumé' && (
            <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-bold mb-4">Filtres de Canal</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-300">Ventes sur Commande</span>
                  <div
                    onClick={() => setRetailEnabled(!retailEnabled)}
                    className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${
                      retailEnabled ? 'bg-[#137fec]' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-[#0d1520] rounded-full shadow transition-transform ${
                        retailEnabled ? 'left-[18px]' : 'left-0.5'
                      }`}
                    />
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-300">Ventes par credit</span>
                  <div
                    onClick={() => setWholesaleEnabled(!wholesaleEnabled)}
                    className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${
                      wholesaleEnabled ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-[#0d1520] rounded-full shadow transition-transform ${
                        wholesaleEnabled ? 'left-[18px]' : 'left-0.5'
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Aperçu en Direct</span>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold">{currentReport.label}</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${chartConfig.bar1Color}`} />
                  <span className="text-slate-400">{chartConfig.bar1Label}</span>
                </div>
                {chartConfig.bar2Label && (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${chartConfig.bar2Color}`} />
                    <span className="text-slate-400">{chartConfig.bar2Label}</span>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                Chargement du graphique…
              </div>
            ) : activeBarData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="flex items-end gap-2 h-40 overflow-x-auto">
                {paginatedBarData.map((d, i) => (
                  <div key={i} className="flex-1 min-w-[32px] flex flex-col items-center gap-2">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: '130px' }}>
                      {d.bar1 > 0 && (
                        <div
                          className={`flex-1 ${chartConfig.bar1Color} opacity-80 rounded-t-sm hover:opacity-100 transition-opacity cursor-pointer`}
                          style={{ height: `${(d.bar1 / maxVal) * 100}%` }}
                          title={`${chartConfig.bar1Label}: ${d.bar1.toLocaleString('fr-FR')}`}
                        />
                      )}
                      {d.bar2 > 0 && (
                        <div
                          className={`flex-1 ${chartConfig.bar2Color} opacity-70 rounded-t-sm hover:opacity-100 transition-opacity cursor-pointer`}
                          style={{ height: `${(d.bar2 / maxVal) * 100}%` }}
                          title={`${chartConfig.bar2Label}: ${d.bar2.toLocaleString('fr-FR')}`}
                        />
                      )}
                      {d.bar1 === 0 && d.bar2 === 0 && (
                        <div className="flex-1 bg-slate-700/30 rounded-t-sm" style={{ height: '4px' }} />
                      )}
                    </div>
                    <span className="text-xs text-slate-400 truncate max-w-full text-center">
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Summary Table */}
          <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-white font-bold">Résumé des Données</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {chartConfig.col1}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {chartConfig.col2}
                    </th>
                    {chartConfig.col3 && (
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {chartConfig.col3}
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBarData.map((d, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-white">
                        {reportType === 'résumé' ? `${d.label} ${summaryYear}` : d.label}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-slate-300">
                        {reportType === 'résumé'
                          ? `GNF ${d.bar1.toLocaleString('fr-FR')}`
                          : d.bar1.toLocaleString('fr-FR')}
                      </td>
                      {chartConfig.col3 && (
                        <td className="px-6 py-3 text-sm text-right text-indigo-400">
                          {reportType === 'résumé'
                            ? `GNF ${d.bar2.toLocaleString('fr-FR')}`
                            : d.bar2.toLocaleString('fr-FR')}
                        </td>
                      )}
                      <td className="px-6 py-3 text-sm font-bold text-right text-white">
                        {reportType === 'résumé'
                          ? `GNF ${(d.bar1 + d.bar2).toLocaleString('fr-FR')}`
                          : (d.bar1 + d.bar2).toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Page {currentPage} sur {totalPages} · {activeBarData.length} résultats
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

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            {summaryCards.map((card, i) => (
              <div
                key={i}
                className={`bg-[#0d1520] border border-slate-800 rounded-xl p-5 ${
                  summaryCards.length % 2 !== 0 && i === summaryCards.length - 1
                    ? 'col-span-2'
                    : ''
                }`}
              >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {card.label}
                </p>
                <p className="text-2xl font-black text-white">{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;