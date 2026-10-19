import { useState, useMemo } from 'react';
import {
  Camera,
  Plus,
  Search,
  Sparkles,
  Download as DownloadIcon,
  Trash2,
  Tag,
  Eye,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  PenLine,
  Image as ImageIcon,
  Layers,
  X,
  Upload
} from 'lucide-react';
import type { Shared } from './ui';
import type { PhotoBankItem, PhotoCategory } from './types';
import { uid, localDate, PHOTO_BANK_TARGET } from './domain.mjs';
import { compressUploadedImage } from './services/imageComposer';
import { Modal, Field, Download } from './ui';

const CATEGORIES: ('Toutes' | PhotoCategory)[] = [
  'Toutes',
  'Parfum',
  'Soin & Beauté',
  'Packaging & Coffret',
  'Shooting Lifestyle',
  'Statut & Promo'
];

export default function PhotoBank(props: Shared) {
  const { store, update, notify, navigate } = props;

  const [activeCategory, setActiveCategory] = useState<'Toutes' | PhotoCategory>('Toutes');
  const [search, setSearch] = useState('');
  const [uploadModal, setUploadModal] = useState(false);
  const [inspectPhoto, setInspectPhoto] = useState<PhotoBankItem | null>(null);

  // Formulaire d'ajout
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PhotoCategory>('Parfum');
  const [productId, setProductId] = useState('');
  const [styleNotes, setStyleNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const photos = store.photoBank || [];

  const filtered = useMemo(() => {
    return photos.filter(p => {
      if (activeCategory !== 'Toutes' && p.category !== activeCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.productName || '').toLowerCase().includes(q) ||
        (p.styleNotes || '').toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [photos, activeCategory, search]);

  async function handleFileSelect(file: File) {
    try {
      setUploading(true);
      const compressed = await compressUploadedImage(file, 1200, 0.88);
      setPhotoDataUrl(compressed);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (err) {
      notify((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleAddPhoto() {
    if (!photoDataUrl) {
      notify('Veuillez sélectionner ou déposer une photo.');
      return;
    }
    if (!title.trim()) {
      notify('Veuillez renseigner un titre pour cette photo.');
      return;
    }

    const prod = store.products.find(p => p.id === productId);
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newItem: PhotoBankItem = {
      id: uid(),
      title: title.trim(),
      url: photoDataUrl,
      category,
      productId: productId || undefined,
      productName: prod?.name || undefined,
      styleNotes: styleNotes.trim() || 'Photo de référence de marque NickShop.',
      tags: tags.length ? tags : ['nickshop', category.toLowerCase()],
      aspectRatio: '1:1',
      created: localDate(),
      demo: false
    };

    update(s => ({
      ...s,
      photoBank: [newItem, ...(s.photoBank || [])]
    }));

    notify('Photo ajoutée à la banque de photos avec succès.');
    resetForm();
    setUploadModal(false);
  }

  function resetForm() {
    setTitle('');
    setCategory('Parfum');
    setProductId('');
    setStyleNotes('');
    setTagsInput('');
    setPhotoDataUrl('');
  }

  function handleDelete(photo: PhotoBankItem) {
    if (confirm(`Supprimer la photo « ${photo.title} » de la banque d'images ?`)) {
      update(s => ({
        ...s,
        photoBank: (s.photoBank || []).filter(p => p.id !== photo.id)
      }));
      notify('Photo supprimée de la banque.');
      if (inspectPhoto?.id === photo.id) setInspectPhoto(null);
    }
  }

  function handleUseAsAiReference(photo: PhotoBankItem) {
    // Naviguer vers le studio visuel avec cette photo en référence
    sessionStorage.setItem('nickshop-selected-reference-photo', JSON.stringify(photo));
    navigate('visual', photo.productId);
    notify(`Photo « ${photo.title} » sélectionnée comme référence d’inspiration IA.`);
  }

  function handleDownloadPhoto(photo: PhotoBankItem) {
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = `nickshop-${photo.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
    a.click();
    notify('Téléchargement de la photo lancé.');
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PATRIMOINE VISUEL DE LA MARQUE</div>
          <h1>Banque de photos & Références IA<span className="gold">.</span></h1>
          <p>
            Votre photothèque de marque : flacons de parfums, packaging de luxe, textures et shooting.
            L’IA s’inspire directement de ces photos pour générer des illustrations cohérentes avec vos textes.
          </p>
        </div>
        <div className="actions-cluster">
          <button className="button" onClick={() => setUploadModal(true)}>
            <Plus size={16} /> Ajouter une photo de référence
          </button>
        </div>
      </div>

      {/* BANDEAU OBJECTIF 40 PHOTOS POUR ROULEMENT AUTOMATIQUE */}
      <section className="panel photobank-progression-panel mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="progress-radial-pill">
              <Camera size={18} className="gold" />
              <span><strong>{photos.length}</strong> / {PHOTO_BANK_TARGET}</span>
            </div>
            <div>
              <h2 className="text-sm font-bold m-0">
                {photos.length >= PHOTO_BANK_TARGET
                  ? '🎯 Objectif 40 photos atteint : Roulement automatique quotidien 100% opérationnel !'
                  : `Objectif 40 photos : ${photos.length} / ${PHOTO_BANK_TARGET} photos (${Math.min(100, Math.round((photos.length / PHOTO_BANK_TARGET) * 100))}%)`}
              </h2>
              <p className="text-xs muted m-0">
                {photos.length >= PHOTO_BANK_TARGET
                  ? 'L’IA dispose d’un stock suffisant pour vous proposer chaque jour une affiche et un texte uniques sans doublon.'
                  : `À partir de 40 photos enregistrées, l'IA dispose d'un mois complet de roulement sans jamais répéter le même flacon.`}
              </p>
            </div>
          </div>
          <button className="button highlight-btn small" onClick={() => setUploadModal(true)}>
            <Upload size={14} /> Importer depuis l'ordinateur
          </button>
        </div>
        <div className="progress-bar-track mt-3">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(100, Math.round((photos.length / PHOTO_BANK_TARGET) * 100))}%` }}
          />
        </div>
      </section>

      {/* BANDEAU INDICATEURS & RÉSUMÉ */}
      <div className="photobank-stats-strip">
        <div className="photobank-stat-card">
          <Camera size={20} className="gold" />
          <div>
            <strong>{photos.length} photos</strong>
            <span>Dans la photothèque NickShop</span>
          </div>
        </div>

        <div className="photobank-stat-card">
          <Sparkles size={20} className="gold" />
          <div>
            <strong>Prêtes pour l’IA</strong>
            <span>Style, reflets et flacons calibrés</span>
          </div>
        </div>

        <div className="photobank-stat-card">
          <Layers size={20} className="gold" />
          <div>
            <strong>{CATEGORIES.length - 1} catégories</strong>
            <span>Parfums, soins, coffrets & lifestyle</span>
          </div>
        </div>
      </div>

      {/* BARRE D'OUTILS & FILTRES */}
      <div className="toolbar photobank-toolbar">
        <div className="tabs scrollable-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={activeCategory === cat ? 'active' : ''}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
              <small>
                {cat === 'Toutes'
                  ? photos.length
                  : photos.filter(p => p.category === cat).length}
              </small>
            </button>
          ))}
        </div>

        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="Rechercher une photo"
            placeholder="Rechercher par flacon, produit, tag ou style…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* GRILLE DES PHOTOS */}
      {filtered.length === 0 ? (
        <div className="panel empty-panel text-center p-8">
          <ImageIcon size={48} className="muted mx-auto mb-3" />
          <h3>Aucune photo trouvée</h3>
          <p className="muted">
            {search
              ? `Aucun résultat pour « ${search} ». Essayez un autre mot-clé.`
              : 'Votre photothèque est prête à accueillir vos photos de produits.'}
          </p>
          <button className="button mt-4" onClick={() => setUploadModal(true)}>
            <Plus size={16} /> Ajouter une première photo
          </button>
        </div>
      ) : (
        <div className="photobank-grid">
          {filtered.map(photo => (
            <article className="panel photobank-card" key={photo.id}>
              <div
                className="photobank-image-wrap"
                onClick={() => setInspectPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  referrerPolicy="no-referrer"
                  className="photobank-thumb"
                  loading="lazy"
                />
                <span className="photobank-category-badge">{photo.category}</span>
                <button
                  type="button"
                  className="photobank-zoom-btn"
                  title="Agrandir et inspecter"
                  onClick={e => {
                    e.stopPropagation();
                    setInspectPhoto(photo);
                  }}
                >
                  <Eye size={16} />
                </button>
              </div>

              <div className="photobank-content">
                <div className="photobank-header">
                  <h3 title={photo.title}>{photo.title}</h3>
                  {photo.productName && (
                    <span className="photobank-product-tag">
                      {photo.productName}
                    </span>
                  )}
                </div>

                <p className="photobank-notes" title={photo.styleNotes}>
                  {photo.styleNotes}
                </p>

                <div className="photobank-tags-row">
                  {photo.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="tag-chip">
                      #{tag}
                    </span>
                  ))}
                  {photo.tags.length > 3 && (
                    <span className="tag-chip muted">+{photo.tags.length - 3}</span>
                  )}
                </div>

                <div className="photobank-card-actions">
                  <button
                    className="button full small highlight-btn"
                    onClick={() => handleUseAsAiReference(photo)}
                  >
                    <Sparkles size={14} /> Créer l’affiche avec ce flacon
                  </button>

                  <div className="photobank-icon-row">
                    <button
                      className="icon-button"
                      title="Télécharger l'image"
                      onClick={() => handleDownloadPhoto(photo)}
                    >
                      <DownloadIcon size={16} />
                    </button>

                    {photo.productId && (
                      <button
                        className="icon-button"
                        title="Créer un texte pour ce produit"
                        onClick={() => navigate('studio', photo.productId)}
                      >
                        <PenLine size={16} />
                      </button>
                    )}

                    <button
                      className="icon-button danger-text"
                      title="Supprimer la photo"
                      onClick={() => handleDelete(photo)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* MODAL D'AJOUT DE PHOTO */}
      {uploadModal && (
        <Modal title="Ajouter une photo à la banque NickShop" onClose={() => setUploadModal(false)}>
          <div className="form-grid">
            <Field label="Fichier image (Photo du flacon, packaging ou shooting)">
              <div className="upload-dropzone">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={e => {
                    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                  }}
                  id="photobank-file-input"
                  style={{ display: 'none' }}
                />
                {photoDataUrl ? (
                  <div className="upload-preview-container">
                    <img
                      src={photoDataUrl}
                      alt="Aperçu sélection"
                      className="upload-preview-img"
                    />
                    <label
                      htmlFor="photobank-file-input"
                      className="button secondary small mt-2"
                    >
                      Changer la photo
                    </label>
                  </div>
                ) : (
                  <label htmlFor="photobank-file-input" className="upload-label-box">
                    <Upload size={32} className="gold" />
                    <strong>
                      {uploading ? 'Traitement & optimisation…' : 'Cliquez pour choisir une photo'}
                    </strong>
                    <small className="muted">
                      Formats supportés : JPG, PNG, WEBP (compressé automatiquement pour la rapidité)
                    </small>
                  </label>
                )}
              </div>
            </Field>

            <Field label="Titre de la photo">
              <input
                required
                placeholder="Ex. : Éclat d’Ambre — Flacon royal sur marbre noir"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </Field>

            <div className="form-grid">
              <Field label="Catégorie">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as PhotoCategory)}
                >
                  <option value="Parfum">Parfum</option>
                  <option value="Soin & Beauté">Soin & Beauté</option>
                  <option value="Packaging & Coffret">Packaging & Coffret</option>
                  <option value="Shooting Lifestyle">Shooting Lifestyle</option>
                  <option value="Statut & Promo">Statut & Promo</option>
                </select>
              </Field>

              <Field label="Associer à un produit (facultatif)">
                <select
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                >
                  <option value="">Aucun produit associé</option>
                  {store.products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Notes de style pour guider l’IA (détails du flacon, couleurs, lumière)">
              <textarea
                rows={3}
                placeholder="Ex. : Flacon ambré taillé, bouchon doré sculpté, reflets d’eau sur marbre sombre, ambiance lumière chaude de Douala…"
                value={styleNotes}
                onChange={e => setStyleNotes(e.target.value)}
              />
              <small className="muted">
                Ces détails seront transmis à l’IA pour reproduire fidèlement l’ambiance et la forme du produit.
              </small>
            </Field>

            <Field label="Mots-clés / Tags (séparés par des virgules)">
              <input
                placeholder="ambre, or, luxe, flacon, soirée, cameroun"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
              />
            </Field>

            <div className="output-actions mt-4">
              <button
                type="button"
                className="button secondary"
                onClick={() => setUploadModal(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="button"
                disabled={!photoDataUrl || !title.trim()}
                onClick={handleAddPhoto}
              >
                <CheckCircle2 size={16} /> Enregistrer dans la photothèque
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL D'INSPECTION DE PHOTO */}
      {inspectPhoto && (
        <Modal
          title={inspectPhoto.title}
          onClose={() => setInspectPhoto(null)}
        >
          <div className="inspect-photo-modal">
            <div className="inspect-image-box">
              <img
                src={inspectPhoto.url}
                alt={inspectPhoto.title}
                referrerPolicy="no-referrer"
                className="inspect-full-img"
              />
            </div>

            <div className="inspect-details">
              <div className="inspect-meta-row">
                <span className="badge">{inspectPhoto.category}</span>
                {inspectPhoto.productName && (
                  <span className="badge secondary">{inspectPhoto.productName}</span>
                )}
                <span className="text-sm muted">Ajoutée le {inspectPhoto.created}</span>
              </div>

              <h4>Directives stylistiques pour l’IA</h4>
              <p className="inspect-style-notes">{inspectPhoto.styleNotes}</p>

              <div className="tag-list">
                {inspectPhoto.tags.map(t => (
                  <span key={t} className="tag-chip">
                    #{t}
                  </span>
                ))}
              </div>

              <div className="inspect-actions mt-6">
                <button
                  className="button full"
                  onClick={() => {
                    handleUseAsAiReference(inspectPhoto);
                    setInspectPhoto(null);
                  }}
                >
                  <Sparkles size={16} /> Créer une illustration IA inspirée de cette photo
                </button>

                <div className="button-group mt-2">
                  <button
                    className="button secondary"
                    onClick={() => handleDownloadPhoto(inspectPhoto)}
                  >
                    <DownloadIcon size={15} /> Télécharger
                  </button>

                  <button
                    className="button secondary danger-text"
                    onClick={() => handleDelete(inspectPhoto)}
                  >
                    <Trash2 size={15} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
