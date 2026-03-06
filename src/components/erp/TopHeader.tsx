import React from 'react';

interface TopHeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'produits', label: 'Produits' },
  { id: 'commandes', label: 'Commandes' },
  { id: 'paiements', label: 'Paiements' },
  { id: 'rapports', label: 'Rapports' },
  { id: 'stock', label: 'Ajustements Stock' },
];

const TopHeader: React.FC<TopHeaderProps> = ({ currentPage, onNavigate }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0d1520]/95 backdrop-blur border-b border-slate-800">
      <div className="flex items-center h-14 px-6 gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-[#137fec] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>store</span>
          </div>
          <span className="text-white font-black text-sm tracking-tight">Store Manager</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Recherche globale..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 focus:ring-1 focus:ring-[#137fec]/30"
            />
          </div>
        </div>

        {/* Nav Links */}
        {/* <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === item.id
                  ? 'bg-[#137fec]/15 text-[#137fec]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav> */}

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#137fec] rounded-full"></span>
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-[#137fec] flex items-center justify-center text-white text-xs font-bold ml-1">
            AD
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
