import React, { useEffect, useState } from 'react';
import { type Product, type Category } from '@/data/erp-data';
import { fetchProducts, fetchProductById, createProductWithImages, updateProductWithImages, updateProductIsActive, deleteProduct } from '@/api/products';
import { fetchCategories } from '@/api/category';
import { fetchSubCategories, type SubCategory } from '@/api/subcategories';
import type { Size } from '@/api/sizes';
import type { Color } from '@/api/colors';

const SIZE_OPTIONS: Size[] = [
  // Letter sizes
  { id: 'XS', name: 'XS', createdAt: '' },
  { id: 'S', name: 'S', createdAt: '' },
  { id: 'M', name: 'M', createdAt: '' },
  { id: 'L', name: 'L', createdAt: '' },
  { id: 'XL', name: 'XL', createdAt: '' },
  { id: 'XXL', name: 'XXL', createdAt: '' },
  // Numeric / measurement sizes
  { id: '36', name: '36', createdAt: '' },
  { id: '38', name: '38', createdAt: '' },
  { id: '40', name: '40', createdAt: '' },
  { id: '42', name: '42', createdAt: '' },
  { id: '44', name: '44', createdAt: '' },
  { id: '46', name: '46', createdAt: '' },
  { id: '48', name: '48', createdAt: '' },
  { id: '50', name: '50', createdAt: '' },
];

const COLOR_OPTIONS: Color[] = [
  { id: 'black', name: 'Noir', hexCode: '#000000', createdAt: '' },
  { id: 'white', name: 'Blanc', hexCode: '#FFFFFF', createdAt: '' },
  { id: 'red', name: 'Rouge', hexCode: '#EF4444', createdAt: '' },
  { id: 'blue', name: 'Bleu', hexCode: '#3B82F6', createdAt: '' },
  { id: 'green', name: 'Vert', hexCode: '#10B981', createdAt: '' },
  { id: 'yellow', name: 'Jaune', hexCode: '#F59E0B', createdAt: '' },
  { id: 'purple', name: 'Violet', hexCode: '#8B5CF6', createdAt: '' },
  { id: 'orange', name: 'Orange', hexCode: '#F97316', createdAt: '' },
  { id: 'pink', name: 'Rose', hexCode: '#EC4899', createdAt: '' },
  { id: 'brown', name: 'Brun', hexCode: '#854D3D', createdAt: '' },
  { id: 'gray', name: 'Gris', hexCode: '#6B7280', createdAt: '' },
  { id: 'silver', name: 'Argent', hexCode: '#9CA3AF', createdAt: '' },
  { id: 'gold', name: 'Or', hexCode: '#D97706', createdAt: '' },
];

const generateUniqueSku = (existing: Product[]): string => {
  const existingSkus = new Set(existing.map((p) => p.sku));
  let sku = '';
  do {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    sku = `SKU-${rand}`;
  } while (existingSkus.has(sku));
  return sku;
};

const StockBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    en_stock: { label: 'En Stock', cls: 'bg-emerald-500/15 text-emerald-400' },
    stock_faible: { label: 'Stock Faible', cls: 'bg-amber-500/15 text-amber-400' },
    rupture: { label: 'Rupture de Stock', cls: 'bg-rose-500/15 text-rose-400' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-500/15 text-slate-400' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
};

const getStockStatus = (stock: number): 'en_stock' | 'stock_faible' | 'rupture' => {
  if (stock <= 0) return 'rupture';
  if (stock < 15) return 'stock_faible';
  return 'en_stock';
};

const ProductModal: React.FC<{
  product?: Product | null;
  onClose: () => void;
  onSave: (p: Partial<Product>, files: File[], deleteImageIds: string[]) => Promise<void> | void;
  categories: Category[];
  subCategories?: SubCategory[];
  sizes?: Size[];
  colors?: Color[];
}> = ({ product, onClose, onSave, categories, subCategories = [], sizes = [], colors = [] }) => {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    categoryId: (product?.categoryId as string) || '',
    subCategoryId: product?.subCategoryId || '',
    // For editing, pre-fill with existing scalar size/color coming from backend
    sizeIds: product?.sizeName ? [product.sizeName] : ([] as string[]),
    colorIds: product?.colorName ? [product.colorName] : ([] as string[]),
    imageUrl: product?.imageUrl || '',
    // Keep numeric fields as strings for better UX in number inputs
    price: product ? String(product.price) : '',
    deliveryPrice: product?.deliveryPrice != null ? String(product.deliveryPrice) : '',
    stock: product ? String(product.stock) : '',
    isActive: product?.isActive ?? true,
    isPromotional: product?.isPromotional ?? false,
    promotionalPrice: product?.promotionalPrice != null ? String(product.promotionalPrice) : '',
  });
  const [sizeToAdd, setSizeToAdd] = useState('');
  const [colorToAdd, setColorToAdd] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState("");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>(product?.images ?? []);
  const [deleteImageIds, setDeleteImageIds] = useState<string[]>([]);

  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviewUrls([]);
      return;
    }
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d1520] border border-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">{product ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}</h2>
            <p className="text-slate-400 text-xs mt-0.5">Remplissez les informations ci-dessous</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
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
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Description (optionnel)
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 resize-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Image du produit {product ? '' : '(requis)'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const list = e.target.files;
                  const selected = list ? Array.from(list) : [];
                  // Allow selecting images incrementally (1 by 1 or in groups)
                  setFiles(prev => [...prev, ...selected]);
                  setImageError("");
                }}
                multiple
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-700 file:text-slate-100 hover:file:bg-slate-600 focus:outline-none focus:border-[#137fec]/50"
              />
              {imageError && (
                <p className="mt-1 text-[11px] text-rose-400">{imageError}</p>
              )}
              {existingImages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-3">
                  {existingImages.map(img => (
                    <div
                      key={img.id}
                      className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-900"
                    >
                      <img
                        src={img.url}
                        alt={form.name || "Image existante"}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setExistingImages(prev => prev.filter(e => e.id !== img.id));
                          setDeleteImageIds(prev =>
                            prev.includes(img.id) ? prev : [...prev, img.id],
                          );
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/80 text-[10px] text-slate-100 flex items-center justify-center hover:bg-rose-600 transition-colors"
                        aria-label="Supprimer l'image existante"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {previewUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-3">
                  {previewUrls.map((url, idx) => (
                    <div
                      key={url + idx}
                      className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-900"
                    >
                      <img
                        src={url}
                        alt={`Aperçu ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFiles(prev => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/80 text-[10px] text-slate-100 flex items-center justify-center hover:bg-rose-600 transition-colors"
                        aria-label="Supprimer l'image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                SKU {product ? '' : '(généré automatiquement)'}
              </label>
              <input
                value={product ? product.sku : 'Sera généré automatiquement'}
                disabled
                className="w-full bg-slate-900/60 border border-dashed border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Catégorie</label>
              <select
                value={form.categoryId}
                onChange={e =>
                  setForm({
                    ...form,
                    categoryId: e.target.value,
                    subCategoryId: '',
                  })
                }
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sous-catégorie</label>
              <select
                value={form.subCategoryId}
                onChange={e => setForm({ ...form, subCategoryId: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="">Sélectionner une sous-catégorie</option>
                {subCategories
                  .filter(sc => !form.categoryId || sc.categoryId === form.categoryId)
                  .map(sc => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Tailles
              </label>
              <div className="flex gap-2">
                <select
                  value={sizeToAdd}
                  onChange={e => setSizeToAdd(e.target.value)}
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#137fec]/50"
                >
                  <option value="">Sélectionner une taille</option>
                  {sizes.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!sizeToAdd) return;
                    if (!form.sizeIds.includes(sizeToAdd)) {
                      setForm({ ...form, sizeIds: [...form.sizeIds, sizeToAdd] });
                    }
                    setSizeToAdd('');
                  }}
                  className="px-3 py-2 bg-[#137fec] text-white rounded-lg text-xs font-medium hover:bg-[#1070d4] transition-colors"
                >
                  Ajouter
                </button>
              </div>
              {form.sizeIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {form.sizeIds.map(id => {
                    const label = sizes.find(s => s.id === id)?.name ?? id;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-100 border border-slate-600"
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, sizeIds: form.sizeIds.filter(x => x !== id) })
                          }
                          className="text-slate-400 hover:text-rose-400"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Couleurs
              </label>
              <div className="flex gap-2">
                {/* <select
                  value={colorToAdd}
                  onChange={e => setColorToAdd(e.target.value)}
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#137fec]/50"
                >
                  <option value="">Sélectionner une couleur</option>
                  {colors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select> */}
                {/* <button
                  type="button"
                  onClick={() => {
                    if (!colorToAdd) return;
                    if (!form.colorIds.includes(colorToAdd)) {
                      setForm({ ...form, colorIds: [...form.colorIds, colorToAdd] });
                    }
                    setColorToAdd('');
                  }}
                  className="px-3 py-2 bg-[#137fec] text-white rounded-lg text-xs font-medium hover:bg-[#1070d4] transition-colors"
                >
                  Ajouter
                </button> */}
                <div>
                  <input type="color" value={colorToAdd} onChange={e => setColorToAdd(e.target.value)} />
                  <button
                    type="button"
                    className="px-3 py-2 bg-[#137fec] text-white rounded-lg text-xs font-medium hover:bg-[#1070d4] transition-colors"
                    onClick={() => {
                      if (!colorToAdd) return;
                      if (!form.colorIds.includes(colorToAdd)) {
                        setForm({
                          ...form,
                          colorIds: [...form.colorIds, colorToAdd],
                        });
                      }
                      setColorToAdd('');
                    }}
                  >
                    Ajouter
                  </button>
                </div>
              </div>
              {form.colorIds.map(color => (
                <span
                  key={color}
                  className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-800 border border-slate-600"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: color }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        colorIds: form.colorIds.filter(c => c !== color),
                      })
                    }
                    className="text-slate-400 hover:text-rose-400 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Produit en promotion ?
              </label>
              <select
                value={form.isPromotional ? 'oui' : 'non'}
                onChange={e => setForm({ ...form, isPromotional: e.target.value === 'oui' })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="non">Non</option>
                <option value="oui">Oui</option>
              </select>
            </div>
            {form.isPromotional && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Prix promotionnel (GNF)
                </label>
                <input
                  type="number"
                  value={form.promotionalPrice}
                  onChange={e => setForm({ ...form, promotionalPrice: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prix(GNF)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prix de Livraison (GNF)</label>
              <input
                type="number"
                value={form.deliveryPrice}
                onChange={e => setForm({ ...form, deliveryPrice: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quantité en Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Statut du Produit</label>
              <select
                value={form.isActive ? 'actif' : 'inactif'}
                onChange={e => setForm({ ...form, isActive: e.target.value === 'actif' })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137fec]/50"
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={async () => {
              try {
                setSaving(true);
                setImageError("");

                // When creating a new product, image is required
                if (!product && (!files || files.length === 0)) {
                  setImageError("Une image est obligatoire pour créer un produit.");
                  return;
                }

                const parsedPrice =
                  form.price === '' ? 0 : parseFloat(form.price);
                const parsedCompanyPrice =
                  form.deliveryPrice === '' ? null : parseFloat(form.deliveryPrice);
                const parsedStock =
                  form.stock === '' ? 0 : parseInt(form.stock, 10);
                const parsedPromoPrice =
                  form.promotionalPrice === '' ? null : parseFloat(form.promotionalPrice);

                await onSave(
                  {
                    name: form.name,
                    description: form.description,
                    imageUrl: form.imageUrl,
                    price: parsedPrice,
                    deliveryPrice: parsedCompanyPrice ?? null,
                    stock: parsedStock,
                    isActive: form.isActive,
                    isPromotional: form.isPromotional,
                    promotionalPrice: parsedPromoPrice,
                    categoryId: form.categoryId || undefined,
                    subCategoryId: form.subCategoryId,
                    ...(form.sizeIds.length
                      ? { size: form.sizeIds.join(',') as any }
                      : {}),
                    ...(form.colorIds.length
                      ? { color: form.colorIds.join(',') as any }
                      : {}),
                  } as any,
                  files,
                  deleteImageIds,
                );
                onClose();
              } catch (err) {
                console.error(err);
                setImageError(
                  err instanceof Error
                    ? err.message
                    : "Erreur lors de l'enregistrement du produit."
                );
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            <span>{product ? 'Enregistrer le Produit' : 'Créer le Produit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductDetail: React.FC<{
  product: Product;
  onBack: () => void;
}> = ({ product, onBack }) => {
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const images = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Retour à la liste des produits
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            {product.name}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-200">
              {product.sku}
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {product.categoryName || 'Catégorie inconnue'}
          </p>
          {product.description && (
            <p className="mt-4 text-sm text-slate-300 max-w-2xl leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
        <div className="text-right space-y-2">
          <div className="text-xs text-slate-400">
            Créé le{' '}
            {new Date(product.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          {product.author && (
            <div className="flex items-center justify-end gap-2">
              <div className="w-6 h-6 rounded-full bg-[#137fec] flex items-center justify-center text-white text-[10px] font-bold">
                {product.author.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-400">
                Ajouté par <span className="text-slate-200 font-medium">{product.author.name}</span>
              </span>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <StockBadge status={getStockStatus(product.stock)} />
            <span className="text-xs text-slate-400">
              {product.stock} unités en stock
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              Statut
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.isActive
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-500/15 text-slate-300'
                }`}
            >
              {product.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Tarification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 rounded-lg p-3">
                <p className="text-xs text-slate-400">Prix</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  GNF {product.price.toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-3">
                <p className="text-xs text-slate-400">Delivery price</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  GNF {(product.deliveryPrice ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-3">
                <p className="text-xs text-slate-400">Valeur du Stock</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  GNF {(product.price * product.stock).toFixed(2)}
                </p>
              </div>
            </div>
            {product.isPromotional && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  <p className="text-xs text-emerald-300">Prix promotionnel</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-200">
                    GNF {(product.promotionalPrice ?? product.price).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Catégorie & Variantes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Catégorie</p>
                <p className="mt-1 text-slate-200">
                  {product.categoryName ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Sous-catégorie</p>
                <p className="mt-1 text-slate-200">
                  {product.subCategoryName ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tailles</p>
                <p className="mt-1 text-slate-200">
                  {product.sizeName ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Couleurs</p>
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  {product.colorName
                    ? product.colorName.split(',').map((color, i) => (
                        <span
                          key={color + i}
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))
                    : <span className="text-slate-400">—</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-[#0d1520] border border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Images du produit
            </h2>
            {images.length === 0 ? (
              <div className="h-40 rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 text-xs">
                <span className="material-symbols-outlined text-3xl mb-2">
                  image_not_supported
                </span>
                Aucune image disponible pour ce produit.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {images.map((url, idx) => (
                  <div
                    key={url + idx}
                    onClick={() => setEnlargedImageUrl(url)}
                    className="w-20 h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 cursor-zoom-in hover:border-[#137fec]/50 transition-colors group"
                  >
                    <img
                      src={url}
                      alt={`Image ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Lightbox / Enlarged Image Overlay */}
      {enlargedImageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setEnlargedImageUrl(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); setEnlargedImageUrl(null); }}
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <div className="max-w-[90vw] max-h-[90vh] relative animate-in zoom-in-95 duration-300">
            <img 
              src={enlargedImageUrl} 
              alt="Product Enlarged" 
              className="w-full h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const Products: React.FC = () => {
  const PAGE_SIZE = 6;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingSelectId, setPendingSelectId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [apiProducts, apiCategories, apiSubCategories] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchSubCategories(),
        ]);
        if (!cancelled) {
          if (Array.isArray(apiProducts)) {
            setProducts(apiProducts);
          }
          if (Array.isArray(apiCategories)) {
            setCategories(apiCategories);
          }
          if (Array.isArray(apiSubCategories)) {
            setSubCategories(apiSubCategories);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Erreur lors du chargement des produits.";
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

  // Check if a product has been requested (e.g. from Orders page)
  useEffect(() => {
    try {
      const fromStorage = window.localStorage.getItem('erp:selectedProductId');
      if (fromStorage) {
        setPendingSelectId(fromStorage);
        window.localStorage.removeItem('erp:selectedProductId');
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (!pendingSelectId || !products.length) return;
    const match = products.find(p => String(p.id) === pendingSelectId);
    if (match) {
      setSelectedProduct(match);
      setPendingSelectId(null);
    }
  }, [pendingSelectId, products]);

  const openDetail = async (id: string) => {
    setSelectedError('');
    const local = products.find((p) => p.id === id) || null;
    if (local) {
      setSelectedProduct(local);
    }
    setSelectedLoading(true);
    try {
      const fresh = await fetchProductById(id);
      setSelectedProduct(fresh);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de charger le détail du produit.";
      setSelectedError(message);
    } finally {
      setSelectedLoading(false);
    }
  };

  const filtered = products.filter(p => {
    const matchCat =
      activeCategory === 'all' || p.categoryId === activeCategory;
    const matchSubCat =
      activeSubCategory === 'all' || p.subCategoryId === activeSubCategory;
    const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matchSearch = !words.length || words.every(w =>
      p.name.toLowerCase().includes(w) || p.sku.toLowerCase().includes(w)
    );
    return matchCat && matchSubCat && matchSearch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory, activeSubCategory]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSave = async (data: Partial<Product>, files: File[], deleteImageIds: string[]) => {
    if (editProduct) {
      const subCategoryId = data.subCategoryId ?? editProduct.subCategoryId;
      const categoryId = data.categoryId ?? editProduct.categoryId;

      const basePayload: any = {
        name: data.name ?? editProduct.name,
        description: data.description ?? editProduct.description ?? null,
        price: data.price ?? editProduct.price,
        deliveryPrice: data.deliveryPrice ?? editProduct.deliveryPrice ?? null,
        stock: data.stock ?? editProduct.stock,
        sku: editProduct.sku,
        isActive: data.isActive ?? editProduct.isActive,
        isPromotional: data.isPromotional ?? editProduct.isPromotional,
        promotionalPrice: data.promotionalPrice ?? editProduct.promotionalPrice ?? null,
        subCategoryId,
        categoryId,
        size: (data as any).size ?? editProduct.sizeName ?? null,
        color: (data as any).color ?? editProduct.colorName ?? null,
        imageUrl: data.imageUrl ?? editProduct.imageUrl,
      };

      const updated = await updateProductWithImages(
        editProduct.id,
        basePayload,
        files || [],
        deleteImageIds || [],
      );

      setProducts(products.map(p => (p.id === editProduct.id ? updated : p)));
    } else {
      const subCategoryId = data.subCategoryId!;
      const categoryId = data.categoryId;

      if (!files || files.length === 0) {
        throw new Error("Une image est obligatoire pour créer un produit.");
      }

      const sku = generateUniqueSku(products);

      const created = await createProductWithImages(
        {
          name: data.name || '',
          description: data.description ?? null,
          price: data.price ?? 0,
          deliveryPrice: data.deliveryPrice ?? null,
          stock: data.stock ?? 0,
          sku,
          isPromotional: data.isPromotional ?? false,
          promotionalPrice: data.promotionalPrice ?? null,
          isActive: data.isActive ?? true,
          categoryId,
          subCategoryId,
          // Cast to any so we can pass backend-only fields
          ...(data as any).size && { size: (data as any).size },
          ...(data as any).color && { color: (data as any).color },
        } as any,
        files,
      );

      setProducts([...products, created]);
    }
    setEditProduct(null);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Voulez-vous vraiment supprimer ce produit ?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: unknown) {
      console.error("Failed to delete product", err);
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du produit.";
      alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  if (selectedProduct) {
    return (
      <div className="p-6 space-y-3">
        {selectedError && (
          <div className="mb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
            {selectedError}
          </div>
        )}
        {selectedLoading && (
          <div className="mb-2 text-xs text-slate-400">
            Chargement des informations du produit…
          </div>
        )}
        <ProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Produits</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez et suivez votre inventaire détail et gros</p>
        </div>
        <div className="flex items-center gap-3">
          {/* <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800/50 transition-colors">
            <span className="material-symbols-outlined text-lg">upload</span>
            Importer
          </button> */}
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
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou SKU..."
            className="bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 w-72"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={activeCategory}
            onChange={e => {
              setActiveCategory(e.target.value);
              setActiveSubCategory('all');
            }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#137fec]/50"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={activeSubCategory}
            onChange={e => setActiveSubCategory(e.target.value)}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#137fec]/50"
          >
            <option value="all">Toutes les sous-catégories</option>
            {subCategories
              .filter(sc => activeCategory === 'all' || sc.categoryId === activeCategory)
              .map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1520] border border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Affichage {filtered.length} sur {products.length} produits
          </p>
          {loading && (
            <span className="text-xs text-slate-500">
              Synchronisation avec l&apos;API…
            </span>
          )}
        </div>
        {loadError && (
          <div className="px-6 py-2 border-b border-slate-800 text-xs text-amber-300 bg-amber-500/5">
            {loadError} · Affichage des données locales.
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Sous-catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tailles</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Couleurs</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Prix</th>
                {/* <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery price</th> */}
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400 text-base">
                            inventory_2
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-400">{p.sku}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{p.categoryName}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{p.subCategoryName ?? '-'}</td>
                  <td className="px-6 py-4 text-xs text-slate-300">
                    {p.sizeName || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {p.colorName
                        ? p.colorName.split(',').map((color, i) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))
                        : <span className="text-xs text-slate-500">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">GNF {p.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <label className={`relative inline-flex items-center ${togglingId === p.id ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={p.isActive}
                        disabled={togglingId === p.id}
                        onChange={async () => {
                          const next = !p.isActive;
                          setTogglingId(p.id);
                          // Optimistic UI update
                          setProducts(products.map(pp =>
                            pp.id === p.id ? { ...pp, isActive: next } : pp
                          ));
                          try {
                            await updateProductIsActive(p.id, next);
                          } catch (err) {
                            // Revert on error
                            setProducts(products.map(pp =>
                              pp.id === p.id ? { ...pp, isActive: p.isActive } : pp
                            ));
                            console.error('Failed to update product status', err);
                          } finally {
                            setTogglingId(null);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-checked:bg-[#137fec] rounded-full peer peer-focus:outline-none transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-[#0d1520] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                      <span className="ml-2 text-xs text-slate-400 flex items-center gap-1">
                        {p.isActive ? 'Actif' : 'Inactif'}
                        {togglingId === p.id && (
                          <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        )}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <StockBadge status={getStockStatus(p.stock)} />
                      <span className="text-xs text-slate-400">{p.stock}</span>
                    </div>
                  </td>
             
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openDetail(p.id)}
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">
                          visibility
                        </span>
                      </button>
                      <button
                        onClick={() => { setEditProduct(p); setShowModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {deletingId === p.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-rose-400/40 border-t-rose-400 rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-base">delete</span>
                        )}
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
          <p className="text-sm text-slate-400">
            Page {currentPage} sur {totalPages} · {filtered.length} résultats
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-700 text-slate-400 rounded-lg text-sm hover:bg-slate-800/50 transition-colors disabled:opacity-50"
            >
              Précédent
            </button>
            <button className="px-3 py-1.5 bg-[#137fec] text-white rounded-lg text-sm">
              {currentPage}
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-700 text-slate-400 rounded-lg text-sm hover:bg-slate-800/50 transition-colors disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          subCategories={subCategories}
          sizes={SIZE_OPTIONS}
          colors={COLOR_OPTIONS}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Products;
