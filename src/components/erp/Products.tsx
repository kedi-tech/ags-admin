import React, { useState } from 'react';
import { products as initialProducts, categories, type Product } from '@/data/erp-data';

const CATEGORIES = ['Tous les Produits', ...categories.map(c => c.name)];

const StockBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    en_stock: { label: 'En Stock', cls: 'bg-emerald-500/15 text-emerald-400' },
    stock_faible: { label: 'Stock Faible', cls: 'bg-amber-500/15 text-amber-400' },
    rupture: { label: 'Rupture de Stock', cls: 'bg-rose-500/15 text-rose-400' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-500/15 text-slate-400' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
};

const ProductModal: React.FC<{ product?: Product | null; onClose: () => void; onSave: (p: Partial<Product>) => void }> = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    retailPrice: product?.retailPrice || 0,
    wholesalePrice: product?.wholesalePrice || 0,
    quantity: product?.quantity || 0,
    status: product?.status || 'actif',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">{product ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}</h2>
            <p className="text-slate-400 text-xs mt-0.5">Remplissez les informations ci-dessous</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nom du Produit</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Saisir le nom du produit"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">SKU</label>
              <input
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Catégorie</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prix Détail (GNF)</label>
              <input
                type="number"
                value={form.retailPrice}
                onChange={e => setForm({ ...form, retailPrice: +e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prix Gros (GNF)</label>
              <input
                type="number"
                value={form.wholesalePrice}
                onChange={e => setForm({ ...form, wholesalePrice: +e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quantité en Stock</label>
              <input
                type="number"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: +e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Statut du Produit</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as 'actif' | 'inactif' })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
          <button
            onClick={() => { onSave(form); onClose(); }}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            {product ? 'Enregistrer le Produit' : 'Créer le Produit'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Products: React.FC = () => {
  const [products, setProducts] = useState(initialProducts);
  const [activeCategory, setActiveCategory] = useState('Tous les Produits');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'Tous les Produits' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = (data: Partial<Product>) => {
    if (editProduct) {
      setProducts(products.map(p => p.id === editProduct.id ? { ...p, ...data } : p));
    } else {
      const newProduct: Product = {
        id: `P${String(products.length + 1).padStart(3, '0')}`,
        name: data.name || '',
        sku: data.sku || '',
        category: data.category || '',
        retailPrice: data.retailPrice || 0,
        wholesalePrice: data.wholesalePrice || 0,
        quantity: data.quantity || 0,
        status: data.status || 'actif',
        stockStatus: (data.quantity || 0) === 0 ? 'rupture' : (data.quantity || 0) < 15 ? 'stock_faible' : 'en_stock',
      };
      setProducts([...products, newProduct]);
    }
    setEditProduct(null);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Produits</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez et suivez votre inventaire détail et gros</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors">
            <span className="material-symbols-outlined text-lg">upload</span>
            Importer
          </button>
          <button
            onClick={() => { setEditProduct(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Ajouter un Nouveau Produit
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou SKU..."
            className="bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 w-72"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#137fec] text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-400">Affichage {filtered.length} sur {products.length} produits</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Prix Détail</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Prix Gros</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400 text-sm">inventory_2</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-400">{p.sku}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{p.category}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">GNF {p.retailPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">GNF {p.wholesalePrice.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <StockBadge status={p.stockStatus} />
                      <span className="text-xs text-slate-400">{p.quantity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={p.status === 'actif'}
                        onChange={() => setProducts(products.map(pp => pp.id === p.id ? { ...pp, status: pp.status === 'actif' ? 'inactif' : 'actif' } : pp))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-checked:bg-[#137fec] rounded-full peer peer-focus:outline-none transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                      <span className="ml-2 text-xs text-slate-400">{p.status === 'actif' ? 'Actif' : 'Inactif'}</span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditProduct(p); setShowModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
          <p className="text-sm text-slate-400">Affichage {filtered.length} sur {products.length} produits</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-slate-700 text-slate-400 rounded-lg text-sm hover:bg-slate-800/50 transition-colors">Précédent</button>
            <button className="px-3 py-1.5 bg-[#137fec] text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1.5 border border-slate-700 text-slate-400 rounded-lg text-sm hover:bg-slate-800/50 transition-colors">Suivant</button>
          </div>
        </div>
      </div>

      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Products;
