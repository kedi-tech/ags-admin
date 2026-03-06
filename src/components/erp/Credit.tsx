import React, { useState } from 'react';
import { creditAccounts as initialAccounts, creditTransactions, type CreditAccount } from '@/data/erp-data';

const CreditStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    actif: { label: 'Actif', cls: 'bg-emerald-500/15 text-emerald-400' },
    avertissement: { label: 'Avertissement', cls: 'bg-amber-500/15 text-amber-400' },
    bloqué: { label: 'Bloqué', cls: 'bg-rose-500/15 text-rose-400' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-500/15 text-slate-400' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
};

const SettleModal: React.FC<{ account: CreditAccount; onClose: () => void; onConfirm: (accountId: string, amountPaid: number) => void }> = ({ account, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('virement');
  const [date, setDate] = useState('2024-10-15');
  const [notes, setNotes] = useState('');

  const amountNum = parseFloat(amount) || 0;
  const newBalance = Math.max(0, account.outstandingBalance - amountNum);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Régler le Paiement de Crédit</h2>
            <p className="text-slate-400 text-xs mt-0.5">{account.company}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-800/40 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">Solde Actuel</span>
            <span className="text-lg font-black text-rose-400">GNF {account.outstandingBalance.toLocaleString('fr-FR')}</span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Montant à Payer (GNF)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date de Paiement</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Méthode de Paiement</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="virement">Virement</option>
                <option value="chèque">Chèque</option>
                <option value="espèces">Espèces</option>
                <option value="carte">Carte</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes / Référence</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            />
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">Nouveau Solde Restant</span>
            <span className={`text-lg font-black ${newBalance <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              GNF {Math.max(newBalance, 0).toLocaleString('fr-FR')}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
          <button
            onClick={() => { onConfirm(account.id, amountNum); onClose(); }}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            Confirmer le Paiement
          </button>
        </div>
      </div>
    </div>
  );
};

const CreditAccountModal: React.FC<{ onClose: () => void; onSave: (data: Partial<CreditAccount>) => void }> = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    company: '',
    contact: '',
    creditLimit: '',
    outstandingBalance: '0',
    status: 'actif' as CreditAccount['status'],
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-lg">Nouveau compte de crédit</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Entreprise</label>
            <input
              value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
              placeholder="Nom de l'entreprise"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact</label>
            <input
              value={form.contact}
              onChange={e => setForm({ ...form, contact: e.target.value })}
              placeholder="Nom du contact"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Limite de crédit (GNF)</label>
              <input
                type="number"
                value={form.creditLimit}
                onChange={e => setForm({ ...form, creditLimit: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Solde impayé (GNF)</label>
              <input
                type="number"
                value={form.outstandingBalance}
                onChange={e => setForm({ ...form, outstandingBalance: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Statut</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as CreditAccount['status'] })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
            >
              <option value="actif">Actif</option>
              <option value="avertissement">Avertissement</option>
              <option value="bloqué">Bloqué</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
          <button
            onClick={() => {
              onSave({
                company: form.company,
                contact: form.contact,
                creditLimit: parseFloat(form.creditLimit) || 0,
                outstandingBalance: parseFloat(form.outstandingBalance) || 0,
                status: form.status,
                lastPayment: 'Jamais',
              });
              onClose();
            }}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            Créer le compte
          </button>
        </div>
      </div>
    </div>
  );
};

const CreditDetail: React.FC<{ account: CreditAccount; onBack: () => void; onSettle: (accountId: string, amountPaid: number) => void }> = ({ account, onBack, onSettle }) => {
  const [showSettle, setShowSettle] = useState(false);
  const availableCredit = account.creditLimit - account.outstandingBalance;
  const utilization = (account.outstandingBalance / account.creditLimit) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-[#137fec] hover:text-blue-400 transition-colors font-medium">Portail Grossiste</button>
        <span className="material-symbols-outlined text-slate-500 text-base">chevron_right</span>
        <button onClick={onBack} className="text-[#137fec] hover:text-blue-400 transition-colors font-medium">Portefeuille Clients</button>
        <span className="material-symbols-outlined text-slate-500 text-base">chevron_right</span>
        <span className="text-white font-medium">{account.company}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{account.company}</h1>
          <p className="text-slate-400 text-sm mt-1">Contact : {account.contact}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors">
            <span className="material-symbols-outlined text-lg">download</span>
            Télécharger le Relevé
          </button>
          <button
            onClick={() => setShowSettle(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            Ajouter un Paiement
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Limite de Crédit Actuelle</p>
          <p className="text-2xl font-black text-white">GNF {account.creditLimit.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-slate-400 mt-2">Bonne situation</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Solde Impayé</p>
          <p className="text-2xl font-black text-rose-400">GNF {account.outstandingBalance.toLocaleString('fr-FR')}</p>
          <div className="mt-2">
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-rose-400 rounded-full" style={{ width: `${utilization}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{utilization.toFixed(0)}% utilisé</p>
          </div>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Crédit Disponible</p>
          <p className="text-2xl font-black text-emerald-400">GNF {availableCredit.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-slate-400 mt-2">Échéance dans 12 jours</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Transaction Ledger */}
        <div className="col-span-2 bg-[#0d1520] border border-slate-800 rounded-xl">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="text-white font-bold">Grand Livre des Transactions</h3>
            <p className="text-slate-400 text-xs mt-0.5">Affichage 5 sur 42 transactions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Solde</th>
                </tr>
              </thead>
              <tbody>
                {creditTransactions.map(tx => (
                  <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-slate-400">{tx.date}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        tx.type === 'paiement_reçu' ? 'bg-emerald-500/15 text-emerald-400' :
                        tx.type === 'achat_crédit' ? 'bg-cyan-500/15 text-cyan-400' :
                        'bg-slate-500/15 text-slate-400'
                      }`}>
                        {tx.type === 'achat_crédit' ? 'Achat à Crédit' : tx.type === 'paiement_reçu' ? 'Paiement Reçu' : 'Ajustement'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-300">{tx.description}</td>
                    <td className={`px-6 py-3.5 text-sm font-semibold text-right ${tx.amount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {tx.amount > 0 ? '+' : ''}GNF {Math.abs(tx.amount).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-right text-white">GNF {tx.balance.toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-4">
          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4">Conditions de Crédit</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Conditions de Paiement</span>
                <span className="text-sm font-medium text-white">Net 30 Jours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Taux Standard</span>
                <span className="text-sm font-medium text-white">8.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Frais de Retard</span>
                <span className="text-sm font-medium text-amber-400">Net 15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Dernière Révision</span>
                <span className="text-sm font-medium text-white">01 Oct 2024</span>
              </div>
            </div>
          </div>
          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <h3 className="text-white font-bold mb-4">Contact de Facturation</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-[#137fec]/15 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[#137fec] text-base">person</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{account.contact}</p>
                <p className="text-xs text-slate-400">Responsable des Comptes Fournisseurs</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">Centre de Distribution du New Jersey</p>
          </div>
        </div>
      </div>

      {showSettle && <SettleModal account={account} onClose={() => setShowSettle(false)} onConfirm={onSettle} />}
    </div>
  );
};

const Credit: React.FC = () => {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
  const [settleAccount, setSettleAccount] = useState<CreditAccount | null>(null);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CreditAccount | null>(null);

  const handleSettle = (accountId: string, amountPaid: number) => {
    setAccounts(accounts.map(a =>
      a.id === accountId
        ? { ...a, outstandingBalance: Math.max(0, a.outstandingBalance - amountPaid), lastPayment: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
        : a
    ));
    setSettleAccount(null);
  };

  const handleCreateAccount = (data: Partial<CreditAccount>) => {
    const id = `CR${String(accounts.length + 1).padStart(3, '0')}`;
    setAccounts([...accounts, {
      id,
      company: data.company || '',
      contact: data.contact || '',
      creditLimit: data.creditLimit || 0,
      outstandingBalance: data.outstandingBalance ?? 0,
      status: data.status || 'actif',
      lastPayment: data.lastPayment || 'Jamais',
    }]);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
    setSelectedAccount(null);
    setDeleteConfirm(null);
  };

  const currentAccount = selectedAccount ? accounts.find(a => a.id === selectedAccount.id) ?? selectedAccount : null;
  if (currentAccount) {
    return <CreditDetail account={currentAccount} onBack={() => setSelectedAccount(null)} onSettle={handleSettle} />;
  }

  const totalDebt = accounts.reduce((s, a) => s + a.outstandingBalance, 0);
  const totalLimit = accounts.reduce((s, a) => s + a.creditLimit, 0);
  const utilization = ((totalDebt / totalLimit) * 100).toFixed(1);
  const activeDebtors = accounts.filter(a => a.status !== 'bloqué').length;

  const filtered = accounts.filter(a =>
    a.company.toLowerCase().includes(search.toLowerCase()) ||
    a.contact.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestion du Crédit Grossiste</h1>
          <p className="text-slate-400 text-sm mt-1">Surveiller l'exposition et gérer les cycles de règlement</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors">
          <span className="material-symbols-outlined text-lg">add</span>
          Nouveau Compte de Crédit
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-500/15 rounded-lg">
              <span className="material-symbols-outlined text-rose-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            </div>
          </div>
          <p className="text-2xl font-black text-white">GNF {totalDebt.toLocaleString('fr-FR')}</p>
          <p className="text-sm text-slate-400 mt-1">Dette Totale du Marché</p>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500/15 rounded-lg">
              <span className="material-symbols-outlined text-amber-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>donut_large</span>
            </div>
          </div>
          <p className="text-2xl font-black text-white">{utilization}%</p>
          <p className="text-sm text-slate-400 mt-1">Utilisation du Crédit</p>
          <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${utilization}%` }} />
          </div>
        </div>
        <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#137fec]/15 rounded-lg">
              <span className="material-symbols-outlined text-[#137fec] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            </div>
          </div>
          <p className="text-2xl font-black text-white">{activeDebtors}</p>
          <p className="text-sm text-slate-400 mt-1">Débiteurs Actifs</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-80">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher des comptes..."
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50"
        />
      </div>

      {/* Accounts Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <p className="text-sm text-slate-400">Affichage {filtered.length} sur 42 comptes de crédit actifs</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Entreprise</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Limite de Crédit</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Solde Impayé</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Utilisation</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Statut du Compte</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(acc => {
                const util = (acc.outstandingBalance / acc.creditLimit) * 100;
                return (
                  <tr key={acc.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-semibold text-white">{acc.company}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{acc.contact}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">GNF {acc.creditLimit.toLocaleString('fr-FR')}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-rose-400">GNF {acc.outstandingBalance.toLocaleString('fr-FR')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${util > 90 ? 'bg-rose-400' : util > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${util}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{util.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><CreditStatusBadge status={acc.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedAccount(acc)}
                          className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors text-xs"
                          title="Historique"
                        >
                          <span className="material-symbols-outlined text-base">history</span>
                        </button>
                        <button
                          onClick={() => setSettleAccount(acc)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Régler"
                        >
                          <span className="material-symbols-outlined text-base">payments</span>
                        </button>
                        <button
                          onClick={() => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, status: a.status === 'bloqué' ? 'actif' : 'bloqué' } : a))}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Bloquer/Débloquer"
                        >
                          <span className="material-symbols-outlined text-base">block</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(acc)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {settleAccount && <SettleModal account={settleAccount} onClose={() => setSettleAccount(null)} onConfirm={handleSettle} />}
      {showCreateModal && <CreditAccountModal onClose={() => setShowCreateModal(false)} onSave={handleCreateAccount} />}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer le compte</h3>
            <p className="text-slate-400 text-sm mb-4">Êtes-vous sûr de vouloir supprimer <span className="text-white font-medium">{deleteConfirm.company}</span> ?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
              <button onClick={() => handleDeleteAccount(deleteConfirm.id)} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Credit;
