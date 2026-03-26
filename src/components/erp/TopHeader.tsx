import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TopHeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onMenuClick?: () => void;
}

const navItems = [
  { id: 'produits', label: 'Produits' },
  { id: 'commandes', label: 'Commandes' },
  { id: 'paiements', label: 'Paiements' },
  { id: 'rapports', label: 'Rapports' },
  { id: 'stock', label: 'Ajustements Stock' },
];

const TopHeader: React.FC<TopHeaderProps> = ({
  currentPage,
  onNavigate,
  onMenuClick,
}) => {
  const navigate = useNavigate();
  const name = typeof window !== "undefined" ? localStorage.getItem("name") : null;
  const handleSignOut = () => {
    try {
      // Clear auth/session state
      localStorage.removeItem('session');
      localStorage.removeItem('token');
      localStorage.removeItem('name');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
    } catch {
      // ignore storage errors
    }
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0d1520]/95 backdrop-blur border-b border-slate-800">
      <div className="flex items-center h-14 px-4 sm:px-6 gap-2 sm:gap-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-300 hover:bg-slate-800/60 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        {/* Logo */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
            <img
              src="/ags_logo.png"
              alt="Alliance Solution Group"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-white font-black text-sm tracking-tight">
            Alliance Solution Group
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md min-w-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Recherche..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 focus:ring-1 focus:ring-[#137fec]/30"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleSignOut}
            className="ml-1 inline-flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:border-slate-500 transition-colors"
          >
            <span className="w-7 h-7 rounded-full bg-[#137fec] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {(name ?? '?').charAt(0).toUpperCase()}
            </span>
            <span className="hidden md:inline">Déconnexion</span>
            <span className="material-symbols-outlined text-base text-slate-300">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
