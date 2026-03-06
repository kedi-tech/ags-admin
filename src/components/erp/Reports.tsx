import React, { useState } from 'react';

const barData = [
  { month: 'Jan', retail: 45000, wholesale: 65000 },
  { month: 'Fév', retail: 52000, wholesale: 58000 },
  { month: 'Mar', retail: 48000, wholesale: 72000 },
  { month: 'Avr', retail: 60000, wholesale: 80000 },
  { month: 'Mai', retail: 55000, wholesale: 75000 },
  { month: 'Jun', retail: 68000, wholesale: 90000 },
];

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('résumé');
  const [retailEnabled, setRetailEnabled] = useState(true);
  const [wholesaleEnabled, setWholesaleEnabled] = useState(true);
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-10-15');

  const maxVal = Math.max(...barData.flatMap(d => [d.retail, d.wholesale]));

  const totalGross = barData.reduce((s, d) => s + d.retail + d.wholesale, 0);
  const avgOrder = 2847;
  const netMargin = 22.4;

  const reportTypes = [
    { key: 'résumé', label: 'Résumé des Ventes' },
    { key: 'produit', label: 'Par Produit' },
    { key: 'catégorie', label: 'Par Catégorie' },
    { key: 'client', label: 'Par Client' },
    { key: 'méthode', label: 'Méthodes de Paiement' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Générateur de Rapports de Ventes</h1>
          <p className="text-slate-400 text-sm mt-1">Configurer les paramètres et prévisualiser les performances</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors">
            <span className="material-symbols-outlined text-lg">download</span>
            Exporter en CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors">
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Exporter en PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Config Sidebar */}
        <div className="col-span-1 space-y-4">
          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4">Plage de Dates</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date de début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date de fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4">Type de Rapport</h3>
            <div className="space-y-1">
              {reportTypes.map(rt => (
                <button
                  key={rt.key}
                  onClick={() => setReportType(rt.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    reportType === rt.key ? 'bg-[#137fec]/15 text-[#137fec]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${reportType === rt.key ? 'bg-[#137fec]' : 'bg-slate-600'}`} />
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4">Filtres de Canal</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-300">Ventes Détail</span>
                <div
                  onClick={() => setRetailEnabled(!retailEnabled)}
                  className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${retailEnabled ? 'bg-[#137fec]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${retailEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-300">Ventes Gros</span>
                <div
                  onClick={() => setWholesaleEnabled(!wholesaleEnabled)}
                  className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${wholesaleEnabled ? 'bg-indigo-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${wholesaleEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Aperçu en Direct</span>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold">Aperçu de la Tendance des Ventes</h3>
              <div className="flex items-center gap-4 text-xs">
                {retailEnabled && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#137fec]" />
                    <span className="text-slate-400">Ventes Détail</span>
                  </div>
                )}
                {wholesaleEnabled && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                    <span className="text-slate-400">Ventes Gros</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-end gap-4 h-40">
              {barData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end" style={{ height: '130px' }}>
                    {retailEnabled && (
                      <div
                        className="flex-1 bg-[#137fec]/80 rounded-t-sm hover:bg-[#137fec] transition-colors cursor-pointer"
                        style={{ height: `${(d.retail / maxVal) * 100}%` }}
                        title={`Détail: GNF ${d.retail.toLocaleString('fr-FR')}`}
                      />
                    )}
                    {wholesaleEnabled && (
                      <div
                        className="flex-1 bg-indigo-500/70 rounded-t-sm hover:bg-indigo-500 transition-colors cursor-pointer"
                        style={{ height: `${(d.wholesale / maxVal) * 100}%` }}
                        title={`Gros: GNF ${d.wholesale.toLocaleString('fr-FR')}`}
                      />
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{d.month}</span>
                </div>
              ))}
            </div>
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
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Mois</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Ventes Détail</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Ventes Gros</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {barData.map((d, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-white">{d.month} 2024</td>
                      <td className="px-6 py-3 text-sm text-right text-slate-300">GNF {d.retail.toLocaleString('fr-FR')}</td>
                      <td className="px-6 py-3 text-sm text-right text-indigo-400">GNF {d.wholesale.toLocaleString('fr-FR')}</td>
                      <td className="px-6 py-3 text-sm font-bold text-right text-white">GNF {(d.retail + d.wholesale).toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Volume Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ventes Brutes Totales</p>
              <p className="text-2xl font-black text-white">GNF {totalGross.toLocaleString('fr-FR')}</p>
            </div>
            <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valeur Moyenne des Commandes</p>
              <p className="text-2xl font-black text-white">GNF {avgOrder.toLocaleString('fr-FR')}</p>
            </div>
            <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Marge Bénéficiaire Nette</p>
              <p className="text-2xl font-black text-emerald-400">{netMargin}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
