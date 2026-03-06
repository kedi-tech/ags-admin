import React from 'react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
  { id: 'produits', label: 'Produits', icon: 'inventory_2' },
  { id: 'categories', label: 'Catégories', icon: 'category' },
  { id: 'commandes', label: 'Commandes', icon: 'receipt_long' },
  { id: 'credit', label: 'Crédit', icon: 'credit_score' },
  { id: 'paiements', label: 'Paiements', icon: 'payments' },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: 'group' },
  { id: 'rapports', label: 'Rapports', icon: 'bar_chart' },
  { id: 'stock', label: 'Ajustements Stock', icon: 'tune' },
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0d1520] border-r border-slate-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#137fec] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>store</span>
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-tight leading-none">AGS</p>
            <p className="text-slate-400 text-xs mt-0.5">Système ERP</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-[#137fec]/15 text-[#137fec]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span
                className="material-symbols-outlined text-xl leading-none"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#137fec]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#137fec] flex items-center justify-center text-white text-xs font-bold">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Diaby Ibrahima</p>
            <p className="text-xs text-slate-400 truncate">Super Administrateur</p>
          </div>
          <button className="text-slate-400 hover:text-slate-200 transition-colors">
            <span className="material-symbols-outlined text-lg">more_vert</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
