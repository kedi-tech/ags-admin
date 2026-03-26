import React, { useEffect, useState } from 'react';
import { type User } from '@/data/erp-data';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/api/auth';

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const map: Record<string, { label: string; cls: string }> = {
    admin: { label: 'Administrateur', cls: 'bg-[#137fec]/15 text-[#137fec]' },
    personnel: { label: 'Agent', cls: 'bg-emerald-500/15 text-emerald-400' },
  };
  const r = map[role] || map.personnel;
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.cls}`}>{r.label}</span>;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status === 'actif' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
    {status === 'actif' ? 'Actif' : 'Bloqué'}
  </span>
);

const UserModal: React.FC<{
  user?: User | null;
  mode: 'add' | 'edit';
  onClose: () => void;
  onSave: (data: Partial<User>) => void;
  saving: boolean;
}> = ({ user, mode, onClose, onSave, saving }) => {
  const [form, setForm] = useState<{
    name: string;
    email: string;
    role: User['role'];
    status: User['status'];
    password?: string;
  }>({
    name: user?.name || '',
    email: user?.email || '',
    role: (user?.role || 'personnel') as User['role'],
    status: (user?.status ?? 'actif') as User['status'],
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#0d1520] z-10">
          <div>
            <h2 className="text-white font-bold text-lg">
              {mode === 'add' ? 'Ajouter un Utilisateur' : 'Modifier l’Utilisateur'}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {mode === 'add' ? 'Créer un Compte Utilisateur' : 'Mettre à jour les informations'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="personnel">Agent</option>
              </select>
            </div>
            {mode === 'add' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mot de passe initial</label>
                <input
                  type="password"
                  value={form.password ?? ''}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
                  placeholder="Mot de passe temporaire"
                />
              </div>
            )}
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

          {/* No explicit permissions UI anymore */}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 sticky bottom-0 bg-[#0d1520]">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              const avatar = form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              onSave({ ...(form as any), avatar } as any);
            }}
            disabled={
              saving ||
              !form.name.trim() ||
              !form.email.trim() ||
              (mode === 'add' && !form.password?.trim())
            }
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {mode === 'add' ? 'Créer un Compte Utilisateur' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Users: React.FC = () => {
  const PAGE_SIZE = 6;
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState('tous');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const apiUsers = await fetchUsers();
        if (!cancelled && Array.isArray(apiUsers)) {
          // Map backend auth users into our User shape as best as possible
          const mapped: User[] = apiUsers.map((u, index) => {
            const name = (u as any).name || (u as any).fullName || (u as any).username || (u as any).email || 'Utilisateur';
            const email = (u as any).email || '';
            const backendRole = String((u as any).role || '').toUpperCase();
            const role: User['role'] =
              backendRole === 'ADMIN' ? 'admin' : 'personnel';
            const backendStatus = String((u as any).status || '').toUpperCase();
            const status: User['status'] =
              backendStatus === 'ACTIVE' ? 'actif' : 'bloqué';
            const avatar =
              (u as any).avatar ||
              name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
            const lastLogin =
              (u as any).lastLogin ||
              (u as any).last_login ||
              (u as any).createdAt ||
              'Jamais';
            return {
              id: String((u as any).id ?? index + 1),
              name,
              email,
              role,
              lastLogin: String(lastLogin),
              status,
              avatar,
            };
          });
          setUsers(mapped);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Erreur lors du chargement des utilisateurs.";
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

  const handleSaveUser = async (data: Partial<User>) => {
    const toBackendRole = (role: User['role'] | undefined): "ADMIN" | "STAFF" =>
      role === 'admin' ? 'ADMIN' : 'STAFF';
    const toBackendStatus = (status: User['status'] | undefined): string =>
      status === 'actif' ? 'ACTIVE' : 'INACTIVE';

    try {
      if (editUser) {
        const backendId = (editUser.id && !Number.isNaN(Number(editUser.id)))
          ? Number(editUser.id)
          : editUser.id;

        const updated = await updateUser(backendId, {
          name: data.name,
          email: data.email,
          role: toBackendRole(data.role ?? editUser.role),
          status: toBackendStatus(data.status ?? editUser.status),
        });

        const name = (updated as any).name || data.name || editUser.name;
        const email = (updated as any).email || data.email || editUser.email;
        const backendRole = String((updated as any).role || '').toUpperCase();
        const role: User['role'] =
          backendRole === 'ADMIN' ? 'admin' : 'personnel';

        setUsers(users.map(u =>
          u.id === editUser.id ? { ...u, name, email, role } : u,
        ));
      } else {
        const created = await createUser({
          name: data.name,
          email: data.email,
          role: toBackendRole(data.role),
          password: (data as any).password,
        });

        const name = (created as any).name || data.name || '';
        const email = (created as any).email || data.email || '';
        const backendRole = String((created as any).role || '').toUpperCase();
        const role: User['role'] =
          backendRole === 'ADMIN' ? 'admin' : 'personnel';
        const id = String((created as any).id ?? `U${users.length + 1}`);

        const avatar =
          (created as any).avatar ||
          name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        setUsers([
          ...users,
          {
            id,
            name,
            email,
            role,
            lastLogin: String(
              (created as any).createdAt || (created as any).lastLogin || 'Jamais',
            ),
            status: 'actif',
            avatar,
          },
        ]);
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde utilisateur', err);
      throw err;
    } finally {
      setEditUser(null);
    }
  };

  const handleDeleteUser = async (u: User) => {
    try {
      const backendId = (u.id && !Number.isNaN(Number(u.id)))
        ? Number(u.id)
        : u.id;
      await deleteUser(backendId);
      setUsers(users.filter(x => x.id !== u.id));
    } catch (err) {
      console.error('Erreur lors de la suppression utilisateur', err);
      throw err;
    } finally {
      setDeleteConfirm(null);
    }
  };

  const tabs = [
    { key: 'tous', label: 'Tous les Utilisateurs' },
    { key: 'admin', label: 'Administrateurs' },
    { key: 'personnel', label: 'Agents' },
  ];

  const filtered = users.filter(u => {
    const matchTab = tab === 'tous' || u.role === tab;
    const query = search.trim().toLowerCase();
    if (!query) return matchTab;
    const inName = u.name.toLowerCase().includes(query);
    const inEmail = u.email.toLowerCase().includes(query);
    return matchTab && (inName || inEmail);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedUsers = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-slate-400 text-sm mt-1">Contrôler l'accès et définir les rôles</p>
        </div>
        <button
          onClick={() => { setModalMode('add'); setEditUser(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors w-full sm:w-auto"
          disabled={saving}
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Ajouter un Utilisateur
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700 rounded-lg p-1 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.key ? 'bg-[#137fec] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher des utilisateurs..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-400">Affichage {filtered.length} utilisateurs</p>
          <div className="flex items-center gap-3">
            {loading && (
              <span className="text-xs text-slate-500">
                Synchronisation avec l&apos;API…
              </span>
            )}
            {loadError && (
              <span className="text-xs text-amber-300">
                {loadError}
              </span>
            )}
          </div>
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
              {paginatedUsers.map(u => (
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
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Page {currentPage} sur {totalPages} · {filtered.length} résultats
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
          onClose={() => { if (!saving) { setShowModal(false); setEditUser(null); } }}
          saving={saving}
          onSave={async (data) => {
            try {
              setSaving(true);
              await handleSaveUser(data);
              setShowModal(false);
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer l'utilisateur</h3>
            <p className="text-slate-400 text-sm mb-4">Êtes-vous sûr de vouloir supprimer <span className="text-white font-medium">{deleteConfirm.name}</span> ?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    setDeleting(true);
                    await handleDeleteUser(deleteConfirm);
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
