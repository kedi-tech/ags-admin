import React, { useState } from 'react';
import { users as initialUsers, type User } from '@/data/erp-data';

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const map: Record<string, { label: string; cls: string }> = {
    admin: { label: 'Administrateur', cls: 'bg-[#137fec]/15 text-[#137fec]' },
    personnel: { label: 'Personnel', cls: 'bg-emerald-500/15 text-emerald-400' },
    client: { label: 'Client', cls: 'bg-slate-500/15 text-slate-400' },
  };
  const r = map[role] || { label: role, cls: 'bg-slate-500/15 text-slate-400' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.cls}`}>{r.label}</span>;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status === 'actif' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
    {status === 'actif' ? 'Actif' : 'Bloqué'}
  </span>
);

const PERMISSIONS = [
  { section: 'Accès au Tableau de Bord', items: ['Voir les statistiques', 'Exporter les rapports', 'Voir les alertes'] },
  { section: 'Opérations de Vente', items: ['Traiter les ventes', 'Gestion des commandes', 'Remises et retours'] },
  { section: 'Gestion du Crédit', items: ['Voir les comptes crédit', 'Approuver les paiements', 'Bloquer les comptes'] },
  { section: 'Paramètres Système', items: ['Gestion des utilisateurs', 'Configuration système', 'Journaux d\'audit'] },
];

const UserModal: React.FC<{ user?: User | null; mode: 'add' | 'edit'; onClose: () => void; onSave: (data: Partial<User>) => void }> = ({ user, mode, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: (user?.role || 'personnel') as User['role'],
    status: (user?.status ?? 'actif') as User['status'],
  });
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const togglePermission = (key: string) => {
    setPermissions(p => ({ ...p, [key]: !p[key] }));
  };

  const selectAll = () => {
    const all: Record<string, boolean> = {};
    PERMISSIONS.forEach(section => {
      section.items.forEach(item => { all[`${section.section}-${item}`] = true; });
    });
    setPermissions(all);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#0d1520] z-10">
          <div>
            <h2 className="text-white font-bold text-lg">
              {mode === 'add' ? 'Ajouter un Compte Personnel' : 'Modifier les Permissions'}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {mode === 'add' ? 'Créer un Compte Utilisateur' : 'Grille des Droits d\'Accès'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nom Complet</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rôle Assigné</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value as User['role'] })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="admin">Administrateur</option>
                <option value="personnel">Personnel</option>
                <option value="client">Client</option>
              </select>
            </div>
            {mode === 'edit' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Statut</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as User['status'] })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
                >
                  <option value="actif">Actif</option>
                  <option value="bloqué">Bloqué</option>
                </select>
              </div>
            )}
          </div>

          {/* Permissions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Permissions du Personnel</h3>
              <button onClick={selectAll} className="text-xs text-[#137fec] font-medium hover:text-blue-400 transition-colors">
                Tout Sélectionner
              </button>
            </div>
            <div className="space-y-4">
              {PERMISSIONS.map(section => (
                <div key={section.section} className="bg-slate-800/30 rounded-xl p-4">
                  <p className="text-sm font-semibold text-white mb-3">{section.section}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map(item => {
                      const key = `${section.section}-${item}`;
                      return (
                        <label key={item} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!permissions[key]}
                            onChange={() => togglePermission(key)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-[#137fec] focus:ring-[#137fec]/30"
                          />
                          <span className="text-xs text-slate-300">{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 sticky bottom-0 bg-[#0d1520]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Annuler
          </button>
          <button
            onClick={() => {
              const avatar = form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              onSave({ ...form, avatar });
              onClose();
            }}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            {mode === 'add' ? 'Créer un Compte Utilisateur' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Users: React.FC = () => {
  const [users, setUsers] = useState(initialUsers);
  const [tab, setTab] = useState('tous');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  const handleSaveUser = (data: Partial<User>) => {
    if (editUser) {
      setUsers(users.map(u => u.id === editUser.id ? { ...u, ...data } : u));
    } else {
      const id = `U${String(users.length + 1).padStart(3, '0')}`;
      setUsers([...users, {
        id,
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'personnel',
        lastLogin: 'Jamais',
        status: data.status || 'actif',
        avatar: data.avatar || '??',
      }]);
    }
    setEditUser(null);
  };

  const handleDeleteUser = (u: User) => {
    setUsers(users.filter(x => x.id !== u.id));
    setDeleteConfirm(null);
  };

  const tabs = [
    { key: 'tous', label: 'Tous les Utilisateurs' },
    { key: 'admin', label: 'Administrateurs' },
    { key: 'personnel', label: 'Personnel' },
    { key: 'client', label: 'Clients' },
  ];

  const filtered = users.filter(u => {
    const matchTab = tab === 'tous' || u.role === tab;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-slate-400 text-sm mt-1">Contrôler l'accès et définir les rôles</p>
        </div>
        <button
          onClick={() => { setModalMode('add'); setEditUser(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Ajouter un Utilisateur
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-[#137fec] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher des utilisateurs..."
            className="bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <p className="text-sm text-slate-400">Affichage {filtered.length} utilisateurs</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Rôle Assigné</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Dernière Connexion</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        u.role === 'admin' ? 'bg-[#137fec]/20 text-[#137fec]' :
                        u.role === 'personnel' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {u.avatar}
                      </div>
                      <span className="text-sm font-semibold text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{u.email}</td>
                  <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                  <td className="px-6 py-4 text-sm text-slate-400">{u.lastLogin}</td>
                  <td className="px-6 py-4"><StatusBadge status={u.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setModalMode('edit'); setEditUser(u); setShowModal(true); }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors border border-slate-700 hover:border-[#137fec]/30"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                        Modifier
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(u)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-slate-700 hover:border-rose-500/30"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Banner */}
      <div className="bg-[#137fec]/5 border border-[#137fec]/20 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#137fec] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
          <p className="text-sm text-slate-300">Besoin d'aide avec les permissions utilisateurs ? <span className="text-[#137fec] font-medium">Support</span></p>
        </div>
        <button className="text-xs text-[#137fec] font-medium hover:text-blue-400 transition-colors">Contacter le Support</button>
      </div>

      {showModal && (
        <UserModal
          user={editUser}
          mode={modalMode}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSave={handleSaveUser}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer l'utilisateur</h3>
            <p className="text-slate-400 text-sm mb-4">Êtes-vous sûr de vouloir supprimer <span className="text-white font-medium">{deleteConfirm.name}</span> ?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
              <button onClick={() => handleDeleteUser(deleteConfirm)} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
