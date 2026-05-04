import React, { useEffect, useState } from 'react';
import {
  type Banner,
  type CreateBannerPayload,
  fetchBanners,
  createBannerWithImage,
  updateBannerWithImage,
  deleteBanner,
} from '@/api/banners';

const IMAGE_MAX_DIMENSION = 1920;
const IMAGE_COMPRESS_QUALITY = 0.82;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > IMAGE_MAX_DIMENSION || height > IMAGE_MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height / width) * IMAGE_MAX_DIMENSION);
          width = IMAGE_MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * IMAGE_MAX_DIMENSION);
          height = IMAGE_MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => {
          if (!blob) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        IMAGE_COMPRESS_QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

// Single modal handles both create and edit
const BannerModal: React.FC<{
  banner?: Banner;       // undefined → create mode
  onClose: () => void;
  onSave: (banner: Banner) => void;
}> = ({ banner, onClose, onSave }) => {
  const isEdit = !!banner;

  const [title, setTitle] = useState(banner?.title ?? '');
  const [description, setDescription] = useState(banner?.description ?? '');
  const [btnLink, setBtnLink] = useState(banner?.btnLink ?? '#');
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(banner?.imageUrl ?? null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError('');
    let processed: File;
    try {
      processed = await compressImage(f);
    } catch {
      setError("Erreur lors de la compression de l'image.");
      return;
    }
    if (processed.size > MAX_FILE_SIZE) {
      setError(`L'image doit faire moins de ${MAX_FILE_SIZE / 1024 / 1024} Mo.`);
      return;
    }
    setFile(processed);
    setPreview(URL.createObjectURL(processed));
  };

  const handleSubmit = async () => {
    if (!isEdit && !file) { setError("Une image est obligatoire."); return; }
    setSaving(true);
    setError('');
    try {
      const payload: CreateBannerPayload = {
        title: title.trim() || null,
        description: description.trim() || null,
        btnLink: btnLink.trim() || '#',
        isActive,
      };

      let imageFile = file;
      if (isEdit && !file && banner?.imageUrl) {
        const res = await fetch(banner.imageUrl);
        const blob = await res.blob();
        const ext = blob.type.includes('png') ? 'png' : 'jpg';
        imageFile = new File([blob], `banner.${ext}`, { type: blob.type });
      }

      const saved = isEdit
        ? await updateBannerWithImage(banner!.id, payload, imageFile)
        : await createBannerWithImage(payload, imageFile!);
      onSave(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1520] border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <h2 className="text-base font-semibold text-white">
            {isEdit ? 'Modifier la bannière' : 'Nouvelle bannière'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Image {!isEdit && <span className="text-rose-400">*</span>}
              {isEdit && <span className="text-slate-500 font-normal">(laisser vide pour conserver l'actuelle)</span>}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-700 file:text-slate-100 hover:file:bg-slate-600 focus:outline-none focus:border-[#137fec]/50"
            />
            {preview && (
              <div className="mt-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                <img src={preview} alt="Aperçu" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Titre <span className="text-slate-500 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Soldes d'été"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Description <span className="text-slate-500 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Ex: Découvrez nos meilleures offres..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50 resize-none"
            />
          </div>

          {/* Button link */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Lien du bouton
            </label>
            <input
              type="text"
              value={btnLink}
              onChange={e => setBtnLink(e.target.value)}
              placeholder="#"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#137fec]/50"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</span>
            <button
              type="button"
              onClick={() => setIsActive(v => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? 'bg-[#137fec]' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors disabled:opacity-70 inline-flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {saving ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer la bannière'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmModal: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}> = ({ onConfirm, onCancel, deleting }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#0d1520] border border-slate-700/50 rounded-2xl w-full max-w-sm shadow-2xl">
      <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-rose-400">delete</span>
        </div>
        <h2 className="text-base font-semibold text-white">Supprimer la bannière ?</h2>
        <p className="text-sm text-slate-400">Cette action est irréversible.</p>
      </div>
      <div className="flex gap-3 px-6 pb-6">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-60"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors disabled:opacity-70 inline-flex items-center justify-center gap-2"
        >
          {deleting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {deleting ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </div>
  </div>
);

const Banners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await deleteBanner(confirmDeleteId);
      setBanners(prev => prev.filter(b => b.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBanners();
        setBanners(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Bannières</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {banners.length} bannière{banners.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-medium hover:bg-[#1070d4] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">add</span>
          Ajouter une bannière
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-2 border-slate-700 border-t-[#137fec] rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && banners.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">image</span>
          <p className="text-slate-400 text-sm">Aucune bannière pour le moment.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 bg-[#137fec]/10 text-[#137fec] rounded-lg text-sm font-medium hover:bg-[#137fec]/20 transition-colors"
          >
            Créer la première bannière
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading && banners.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {banners.map(banner => (
            <div
              key={banner.id}
              className="bg-[#0d1520] border border-slate-800 rounded-2xl overflow-hidden group"
            >
              {/* Image */}
              <div className="relative h-44 bg-slate-900">
                <img
                  src={banner.imageUrl}
                  alt={banner.title ?? 'Bannière'}
                  className="w-full h-full object-cover"
                />
                {/* Active badge */}
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  banner.isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-700/70 text-slate-400'
                }`}>
                  {banner.isActive ? 'Actif' : 'Inactif'}
                </span>
                {/* Action buttons — visible on hover */}
                <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditBanner(banner)}
                    className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                    title="Modifier"
                  >
                    <span className="material-symbols-outlined text-[16px] leading-none">edit</span>
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(banner.id)}
                    className="p-1.5 rounded-lg bg-black/50 text-rose-400 hover:bg-black/70 transition-colors"
                    title="Supprimer"
                  >
                    <span className="material-symbols-outlined text-[16px] leading-none">delete</span>
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="px-4 py-3 space-y-1.5">
                <p className="text-sm font-semibold text-white truncate">
                  {banner.title || <span className="text-slate-500 font-normal italic">Sans titre</span>}
                </p>
                {banner.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2">{banner.description}</p>
                )}
                {banner.btnLink && (
                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">link</span>
                    {banner.btnLink}
                  </p>
                )}
                <p className="text-[11px] text-slate-600">
                  {new Date(banner.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <BannerModal
          onClose={() => setShowCreate(false)}
          onSave={created => {
            setBanners(prev => [created, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <DeleteConfirmModal
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Edit modal */}
      {editBanner && (
        <BannerModal
          banner={editBanner}
          onClose={() => setEditBanner(null)}
          onSave={updated => {
            setBanners(prev => prev.map(b => b.id === updated.id ? updated : b));
            setEditBanner(null);
          }}
        />
      )}
    </div>
  );
};

export default Banners;
