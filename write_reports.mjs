import { writeFileSync } from 'fs';

const bt = String.fromCharCode(96);
const raw = `import React, { useEffect, useMemo, useState } from 'react';
import { fetchOrders } from '@/api/orders';
import { fetchCredits } from '@/api/credits';
import { fetchProducts } from '@/api/products';
import { fetchClients } from '@/api/clients';

type GenericRow = { label: string; value: number };

const reportTypeList = [
  { key: 'résumé', label: 'Résumé des Ventes' },
  { key: 'produit', label: 'Par Produit' },
  { key: 'catégorie', label: 'Par Catégorie' },
  { key: 'client', label: 'Par Client' },
  { key: 'méthode', label: 'Méthodes de Paiement' },
];

const Reports: React.FC = () => {
  const PAGE_SIZE = 6;
  const today = new Date();
  const currentYear = today.getFullYear();
  const defaultStart = BT\${currentYear}-01-01BT;
  const defaultEnd = today.toISOString().slice(0, 10);

  const [reportType, setReportType] = useState('résumé');
  const [retailEnabled, setRetailEnabled] = useState(true);
  const [wholesaleEnabled, setWholesaleEnabled] = useState(true);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const [orders, setOrders] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [apiOrders, apiCredits, apiProducts, apiClients] = await Promise.all([
          fetchOrders(),
          fetchCredits(),
          fetchProducts(),
          fetchClients(),
        ]);
        if (!cancelled) {
          if (Array.isArray(apiOrders)) setOrders(apiOrders);
          if (Array.isArray(apiCredits)) setCredits(apiCredits);
          if (Array.isArray(apiProducts)) setProducts(apiProducts);
          if (Array.isArray(apiClients)) setClients(apiClients);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Erreur lors du chargement des données.';
          setLoadError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Order IDs with an ACTIVE credit record
  const activeCreditOrderIds = useMemo(() => {
    const ids = new Set<string>();
    credits.forEach((c) => { if (c.status === 'ACTIVE' && c.orderId) ids.add(String(c.orderId)); });
    return ids;
  }, [credits]);

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

  // Résumé: monthly retail vs ACTIVE credit orders
  const barData = useMemo(
    () =>
      monthLabels.map((label, idx) => {
        let retail = 0;
        let wholesale = 0;
        filteredOrders.forEach((o) => {
          const d = new Date(o.createdAt);
          if (d.getMonth() !== idx) return;
          const total = getOrderPaidAmount(o);
          if (total <= 0) return;
          if (o.isCredit && activeCreditOrderIds.has(String(o.id))) wholesale += total;
          else if (!o.isCredit) retail += total;
        });
        return { month: label, retail, wholesale };
      }),
    [filteredOrders, activeCreditOrderIds],
  );

  // Par Produit: active vs inactive count
  const productChartData = useMemo((): GenericRow[] => {
    const active = products.filter((p) => p.isActive).length;
    const inactive = products.filter((p) => !p.isActive).length;
    return [
      { label: 'Actifs', value: active },
      { label: 'Inactifs', value: inactive },
    ];
  }, [products]);

  // Par Catégorie: product count per category
  const categoryChartData = useMemo((): GenericRow[] => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.categoryName || 'Sans catégorie';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [products]);

  // Par Client: clients with orders vs without
  const clientChartData = useMemo((): GenericRow[] => {
    const clientIdsWithOrders = new Set(orders.map((o) => String(o.clientId || o.client?.id)).filter(Boolean));
    const withOrders = clients.filter((c) => clientIdsWithOrders.has(String(c.id))).length;
    const withoutOrders = clients.length - withOrders;
    return [
      { label: 'Avec commandes', value: withOrders },
      { label: 'Sans commandes', value: withoutOrders },
    ];
  }, [clients, orders]);

  // Méthodes de Paiement: amount grouped by payment method
  const methodData = useMemo((): GenericRow[] => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      const payments = Array.isArray(o.payments) ? o.payments : [];
      if (payments.length > 0) {
        payments.forEach((p: any) => {
          const method = p.method || 'Inconnu';
          const amount = typeof p.amount === 'number' ? p.amount : 0;
          if (amount > 0) map[method] = (map[method] || 0) + amount;
        });
      } else {
        const method = o.isCredit ? 'Crédit' : 'Espèces';
        const amount = getOrderPaidAmount(o);
        if (amount > 0) map[method] = (map[method] || 0) + amount;
      }
    });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  const activeGenericData = useMemo((): GenericRow[] => {
    switch (reportType) {
      case 'produit': return productChartData;
      case 'catégorie': return categoryChartData;
      case 'client': return clientChartData;
      case 'méthode': return methodData;
      default: return [];
    }
  }, [reportType, productChartData, categoryChartData, clientChartData, methodData]);

  const isResume = reportType === 'résumé';
  const isAmountReport = reportType === 'méthode';

  const maxVal = Math.max(1, ...barData.flatMap((d) => [d.retail, d.wholesale]));
  const chartGenericData = activeGenericData.slice(0, 10);
  const genericMaxVal = Math.max(1, ...chartGenericData.map((d) => d.value));

  const totalGross = filteredOrders.reduce((sum, o) => sum + getOrderPaidAmount(o), 0);
  const paidOrdersCount = filteredOrders.filter((o) => getOrderPaidAmount(o) > 0).length;
  const avgOrder = paidOrdersCount > 0 ? totalGross / paidOrdersCount : 0;
  const summaryYear = new Date(startDate).getFullYear();

  const tableData: any[] = isResume ? barData : activeGenericData;
  const totalPages = Math.max(1, Math.ceil(tableData.length / PAGE_SIZE));
  const paginatedTableData = tableData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const topItem = activeGenericData[0];
  const genericTotal = activeGenericData.reduce((s, d) => s + d.value, 0);

  // Dynamic table column labels
  const tableColLabel =
    reportType === 'produit' || reportType === 'client' ? 'Statut'
    : reportType === 'catégorie' ? 'Catégorie'
    : reportType === 'méthode' ? 'Méthode de Paiement'
    : '';
  const tableColValue = isAmountReport ? 'Total (GNF)' : 'Nombre';

  // Summary card values
  const leftCardTitle = isResume ? 'Ventes Brutes Totales'
    : reportType === 'produit' ? 'Total Produits'
    : reportType === 'catégorie' ? 'Total Catégories'
    : reportType === 'client' ? 'Total Clients'
    : 'Total Encaissé';
  const leftCardValue = isResume
    ? BT GNF \${totalGross.toLocaleString('fr-FR')}BT
    : isAmountReport
    ? BT GNF \${genericTotal.toLocaleString('fr-FR')}BT
    : reportType === 'produit' ? String(products.length)
    : reportType === 'catégorie' ? String(categoryChartData.length)
    : String(clients.length);

  const rightCardTitle = isResume ? 'Valeur Moyenne des Commandes'
    : reportType === 'produit' ? 'Produits Actifs'
    : reportType === 'catégorie' ? 'Catégorie Principale'
    : reportType === 'client' ? 'Clients Actifs'
    : 'Méthode Principale';
  const rightCardValue = isResume
    ? BT GNF \${Math.round(avgOrder).toLocaleString('fr-FR')}BT
    : topItem?.label ?? '—';
  const rightCardSub = !isResume && topItem
    ? isAmountReport
      ? BT GNF \${topItem.value.toLocaleString('fr-FR')}BT
      : BT\${topItem.value} unité\${topItem.value !== 1 ? 's' : ''}BT
    : null;

  useEffect(() => { setCurrentPage(1); }, [reportType, startDate, endDate, retailEnabled, wholesaleEnabled]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const handleExportCsv = () => {
    let rows: string[][];
    if (isResume) {
      rows = [
        ['Mois', 'Ventes sur Commande (GNF)', 'Ventes par Crédit Actif (GNF)', 'Total (GNF)'],
        ...barData.map((d) => [d.month, d.retail.toString(), d.wholesale.toString(), (d.retail + d.wholesale).toString()]),
      ];
    } else {
      const label = reportTypeList.find((rt) => rt.key === reportType)?.label ?? reportType;
      rows = [[label, tableColValue], ...activeGenericData.map((d) => [d.label, d.value.toString()])];
    }
    const csvContent = rows.map((r) => r.join(',')).join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapport-ventes.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    let tableHtml: string;
    if (isResume) {
      tableHtml =
        '<thead><tr><th>Mois</th><th>Ventes sur Commande (GNF)</th><th>Ventes par Crédit Actif (GNF)</th><th>Total (GNF)</th></tr></thead>' +
        '<tbody>' + barData.map((d) =>
          BTT<tr><td>\${d.month}</td><td>\${d.retail.toLocaleString('fr-FR')}</td><td>\${d.wholesale.toLocaleString('fr-FR')}</td><td>\${(d.retail + d.wholesale).toLocaleString('fr-FR')}</td></tr>BTT
        ).join('') + '</tbody>';
    } else {
      const label = reportTypeList.find((rt) => rt.key === reportType)?.label ?? reportType;
      tableHtml =
        BTT<thead><tr><th>\${label}</th><th>\${tableColValue}</th></tr></thead>BTT +
        '<tbody>' + activeGenericData.map((d) => BTT<tr><td>\${d.label}</td><td>\${d.value.toLocaleString('fr-FR')}</td></tr>BTT).join('') + '</tbody>';
    }
    const html =
      '<html><head><title>Rapport</title><style>body{font-family:system-ui,sans-serif;padding:24px}h1{font-size:20px;margin-bottom:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;font-size:12px;text-align:right}th:first-child,td:first-child{text-align:left}</style></head>' +
      BTT<body><h1>\${reportTypeList.find(r=>r.key===reportType)?.label ?? 'Rapport'} (\${startDate} → \${endDate})</h1><table>\${tableHtml}</table></body></html>BTT;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const currentReport = reportTypeList.find((rt) => rt.key === reportType) ?? reportTypeList[0];
  const hasData = isResume ? filteredOrders.length > 0 : activeGenericData.length > 0;

  // Bar color per slot for generic chart
  const getBarColor = (label: string) => {
    if (label === 'Actifs' || label === 'Avec commandes') return 'bg-emerald-500/80 hover:bg-emerald-500';
    if (label === 'Inactifs' || label === 'Sans commandes') return 'bg-rose-500/80 hover:bg-rose-500';
    return 'bg-[#137fec]/70 hover:bg-[#137fec]';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Générateur de Rapports</h1>
          <p className="text-slate-400 text-sm mt-1">Rapports basés sur les données réelles</p>
          {loading && <p className="text-xs text-slate-500 mt-1">Chargement des données…</p>}
          {loadError && <p className="text-xs text-amber-300 mt-1 max-w-md">{loadError}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCsv} disabled={!hasData}
            className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors disabled:opacity-50">
            <span className="material-symbols-outlined text-lg">download</span>
            Exporter en CSV
          </button>
          <button onClick={handleExportPdf} disabled={!hasData}
            className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors disabled:opacity-50">
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Exporter en PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {(isResume || reportType === 'méthode') && (
            <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-bold mb-4">Plage de Dates</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date de début</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date de fin</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4">Type de Rapport</h3>
            <div className="space-y-1">
              {reportTypeList.map((rt) => (
                <button key={rt.key} onClick={() => setReportType(rt.key)}
                  className={BTW-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left \${reportType === rt.key ? 'bg-[#137fec]/15 text-[#137fec]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}BT}>
                  <div className={BTw-1.5 h-1.5 rounded-full \${reportType === rt.key ? 'bg-[#137fec]' : 'bg-slate-600'}BT} />
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          {isResume && (
            <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-bold mb-4">Filtres de Canal</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-300">Ventes sur Commande</span>
                  <div onClick={() => setRetailEnabled(!retailEnabled)}
                    className={BTrelative w-9 h-5 rounded-full cursor-pointer transition-colors \${retailEnabled ? 'bg-[#137fec]' : 'bg-slate-700'}BT}>
                    <div className={BTabsolute top-0.5 w-4 h-4 bg-[#0d1520] rounded-full shadow transition-transform \${retailEnabled ? 'left-[18px]' : 'left-0.5'}BT} />
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-300">Ventes par Crédit Actif</span>
                  <div onClick={() => setWholesaleEnabled(!wholesaleEnabled)}
                    className={BTrelative w-9 h-5 rounded-full cursor-pointer transition-colors \${wholesaleEnabled ? 'bg-indigo-500' : 'bg-slate-700'}BT}>
                    <div className={BTabsolute top-0.5 w-4 h-4 bg-[#0d1520] rounded-full shadow transition-transform \${wholesaleEnabled ? 'left-[18px]' : 'left-0.5'}BT} />
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Aperçu en Direct</span>
            </div>
          </div>

          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold">{currentReport.label}</h3>
              {isResume && (
                <div className="flex items-center gap-4 text-xs">
                  {retailEnabled && <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-orange-500" /><span className="text-slate-400">Ventes sur Commande</span></div>}
                  {wholesaleEnabled && <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-500" /><span className="text-slate-400">Crédit Actif</span></div>}
                </div>
              )}
              {!isResume && (reportType === 'produit' || reportType === 'client') && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500" /><span className="text-slate-400">{reportType === 'produit' ? 'Actifs' : 'Avec commandes'}</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-rose-500" /><span className="text-slate-400">{reportType === 'produit' ? 'Inactifs' : 'Sans commandes'}</span></div>
                </div>
              )}
            </div>

            {isResume ? (
              <div className="flex items-end gap-4 h-40">
                {barData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex gap-1 items-end" style={{ height: '130px' }}>
                      {retailEnabled && <div className="flex-1 bg-orange-500/80 rounded-t-sm hover:bg-[#137fec] transition-colors cursor-pointer" style={{ height: BT\${(d.retail / maxVal) * 100}%BT }} title={BTVentes sur Commande: GNF \${d.retail.toLocaleString('fr-FR')}BT} />}
                      {wholesaleEnabled && <div className="flex-1 bg-indigo-500/70 rounded-t-sm hover:bg-indigo-500 transition-colors cursor-pointer" style={{ height: BT\${(d.wholesale / maxVal) * 100}%BT }} title={BTCrédit Actif: GNF \${d.wholesale.toLocaleString('fr-FR')}BT} />}
                    </div>
                    <span className="text-xs text-slate-400">{d.month}</span>
                  </div>
                ))}
              </div>
            ) : chartGenericData.length > 0 ? (
              <div className="flex items-end gap-3 h-40">
                {chartGenericData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                    <div className="w-full flex items-end" style={{ height: '130px' }}>
                      <div className={BTw-full rounded-t-sm transition-colors cursor-pointer \${getBarColor(d.label)}BT}
                        style={{ height: BT\${Math.max(2, (d.value / genericMaxVal) * 100)}%BT }}
                        title={BT\${d.label}: \${d.value.toLocaleString('fr-FR')}BT} />
                    </div>
                    <span className="text-slate-400 text-center truncate w-full" style={{ fontSize: '10px' }}>{d.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                Aucune donnée disponible
              </div>
            )}
          </div>

          <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-white font-bold">Résumé des Données</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                {isResume ? (
                  <>
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Mois</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Ventes sur Commande</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Crédit Actif</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTableData.map((d: any, i: number) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-3 text-sm font-medium text-white">{d.month} {summaryYear}</td>
                          <td className="px-6 py-3 text-sm text-right text-slate-300">GNF {d.retail.toLocaleString('fr-FR')}</td>
                          <td className="px-6 py-3 text-sm text-right text-indigo-400">GNF {d.wholesale.toLocaleString('fr-FR')}</td>
                          <td className="px-6 py-3 text-sm font-bold text-right text-white">GNF {(d.retail + d.wholesale).toLocaleString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{tableColLabel}</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">{tableColValue}</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">% du Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTableData.map((d: GenericRow, i: number) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-3 text-sm font-medium text-white">{d.label}</td>
                          <td className="px-6 py-3 text-sm text-right text-slate-300">
                            {isAmountReport ? BTG NF \${d.value.toLocaleString('fr-FR')}BT : d.value.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-[#137fec]">
                            {genericTotal > 0 ? BT\${((d.value / genericTotal) * 100).toFixed(1)}%BT : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
            <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {currentPage} sur {totalPages} · {tableData.length} résultats</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 disabled:opacity-50">Précédent</button>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-300 disabled:opacity-50">Suivant</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{leftCardTitle}</p>
              <p className="text-2xl font-black text-white">{leftCardValue}</p>
            </div>
            <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{rightCardTitle}</p>
              <p className="text-xl font-black text-white truncate">{rightCardValue}</p>
              {rightCardSub && <p className="text-xs text-slate-400 mt-1">{rightCardSub}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
`;

// Replace BT placeholders with actual backticks
const content = raw
  .replace(/BTT/g, bt + bt + bt)  // triple backtick (not needed but safe)
  .replace(/BTW/g, bt)
  .replace(/BT /g, bt)
  .replace(/BT\$/g, bt + '$')
  .replace(/BT\\/g, bt + '\\')
  .replace(/BTG /g, bt + 'G')
  .replace(/BT}/g, bt + '}')
  .replace(/BTT/g, bt)
  .replace(/\bBT\b/g, bt);

writeFileSync('c:/Users/Ibrahim D/Downloads/admin-ags/src/components/erp/Reports.tsx', content, 'utf-8');
console.log('Done');