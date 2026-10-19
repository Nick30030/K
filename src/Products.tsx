import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, ArrowUpRight, Package, Upload, AlertTriangle, ShieldCheck, Sparkles, Camera } from 'lucide-react';
import { type Shared, ProductArt, Modal, Field, Empty } from './ui';
import type { Product } from './types';
import { money, uid, getDoualaDate } from './domain.mjs';

const empty = (): Product => ({
  id: uid(),
  name: '',
  brand: 'NickShop',
  category: 'Parfum',
  price: 0,
  cost: 0,
  variableCosts: 0,
  description: '',
  features: '',
  stock: 0,
  lowStockThreshold: 3,
  active: true,
  photo: '',
  updatedAt: getDoualaDate()
});

export async function photoData(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) {
    throw Error('Choisissez une image JPG, PNG ou WebP de moins de 3 Mo.');
  }
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(Error('Image illisible.'));
    r.readAsDataURL(file);
  });
}

export default function Products({ store, update, navigate, notify }: Shared) {
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [filter, setFilter] = useState('Tous');

  const items = store.products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'Tous') return true;
    if (filter === 'Actifs') return p.active && p.stock > 0;
    if (filter === 'Stock faible') return p.active && p.stock <= (p.lowStockThreshold || 3) && p.stock > 0;
    if (filter === 'En rupture') return p.stock === 0;
    return true;
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">CATALOGUE COMMERCIAL & CARACTÉRISTIQUES VÉRIFIÉES</div>
          <h1>Bibliothèque de produits<span className="gold">.</span></h1>
          <p>
            Enregistrez les prix, coûts d'achat et caractéristiques réelles pour
            calculer vos marges et générer des contenus fidèles.
          </p>
        </div>
        <button className="button" onClick={() => setEdit(empty())}>
          <Plus size={17} /> Ajouter un produit
        </button>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {['Tous', 'Actifs', 'Stock faible', 'En rupture'].map(t => (
            <button
              className={t === filter ? 'active' : ''}
              key={t}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="search-field">
          <Search size={17} />
          <input
            placeholder="Rechercher par nom, marque, catégorie..."
            aria-label="Rechercher un produit"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="product-grid">
        {items.map(p => {
          const isOut = p.stock === 0;
          const isLow = !isOut && p.stock <= (p.lowStockThreshold || 3);

          return (
            <article className="product-card" key={p.id}>
              <div className="product-cover">
                <ProductArt product={p} />
                <span className="cover-badge">
                  {p.demo ? 'Démonstration' : p.active ? 'Actif' : 'Inactif'}
                </span>
                <div className="cover-actions">
                  <button
                    className="icon-button"
                    aria-label={`Modifier ${p.name}`}
                    onClick={() => setEdit({ ...p })}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Supprimer ${p.name}`}
                    onClick={() => setDeleting(p)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="product-info">
                <div className="flex justify-between items-center mb-1">
                  <span className="eyebrow">{p.category}</span>
                  {p.brand && <small className="text-slate-400 font-medium">{p.brand}</small>}
                </div>

                <h2>{p.name}</h2>
                <p className="line-clamp-2">{p.description}</p>

                <div className="product-price">
                  <div>
                    <strong>{money(p.price)}</strong>
                    {p.cost ? (
                      <small className="block text-slate-400 text-xs mt-0.5">
                        Coût achat : {money(p.cost)} · Marge brute : {money(p.price - p.cost)}
                      </small>
                    ) : (
                      <small className="block text-amber-600 text-xs mt-0.5">
                        Coût d'achat non renseigné
                      </small>
                    )}
                  </div>

                  <span
                    className={
                      isOut
                        ? 'out-stock'
                        : isLow
                        ? 'stock-low text-amber-700 font-medium text-xs'
                        : 'stock'
                    }
                  >
                    {isOut ? 'Rupture' : isLow ? `⚠️ ${p.stock} restant(s)` : `${p.stock} en stock`}
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    className="button secondary full text-xs"
                    disabled={!p.active || p.stock === 0}
                    onClick={() => navigate('studio', p.id)}
                  >
                    Rédiger un post <ArrowUpRight size={14} />
                  </button>
                  <button
                    className="button highlight-btn full text-xs"
                    onClick={() => navigate('visual', p.id)}
                  >
                    <Sparkles size={14} /> Visuel IA
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!items.length && (
        <Empty
          title="Votre collection commence ici"
          description="Ajoutez un produit avec son prix de vente, son coût d'achat et ses caractéristiques vérifiées."
        >
          <button className="button" onClick={() => setEdit(empty())}>
            <Package size={16} /> Ajouter un produit
          </button>
        </Empty>
      )}

      {/* MODAL AJOUT / MODIFICATION PRODUIT */}
      {edit && (
        <Modal
          title={
            store.products.some(p => p.id === edit.id)
              ? 'Modifier le produit'
              : 'Nouveau produit NickShop'
          }
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              const updatedProduct = {
                ...edit,
                updatedAt: getDoualaDate(),
                demo: false
              };
              update(s => ({
                ...s,
                products: s.products.some(p => p.id === edit.id)
                  ? s.products.map(p => (p.id === edit.id ? updatedProduct : p))
                  : [...s.products, updatedProduct]
              }));
              setEdit(null);
              notify('Produit enregistré avec succès.');
            }}
          >
            <div className="form-grid">
              <Field label="Nom du produit">
                <input
                  required
                  maxLength={100}
                  placeholder="Ex. : Eau de Parfum Rose Impériale"
                  value={edit.name}
                  onChange={e => setEdit({ ...edit, name: e.target.value })}
                />
              </Field>

              <Field label="Marque / Gamme">
                <input
                  maxLength={100}
                  placeholder="Ex. : NickShop ou marque distributrice"
                  value={edit.brand || ''}
                  onChange={e => setEdit({ ...edit, brand: e.target.value })}
                />
              </Field>

              <Field label="Catégorie">
                <select
                  value={edit.category}
                  onChange={e => setEdit({ ...edit, category: e.target.value })}
                >
                  {[
                    'Parfum',
                    'Soin visage',
                    'Soin corps',
                    'Maquillage',
                    'Accessoire',
                    'Coffret cadeau',
                    'Autre'
                  ].map(x => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>

              <Field label="Prix de vente public (FCFA)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={edit.price}
                  onChange={e => setEdit({ ...edit, price: Number(e.target.value) })}
                />
              </Field>

              <Field
                label="Coût d'achat unitaire (FCFA)"
                hint="Permet de calculer automatiquement votre marge contributive réelle."
              >
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={edit.cost || ''}
                  placeholder="Ex. : 6500"
                  onChange={e => setEdit({ ...edit, cost: Number(e.target.value) })}
                />
              </Field>

              <Field label="Stock disponible actuel">
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={edit.stock}
                  onChange={e => setEdit({ ...edit, stock: Number(e.target.value) })}
                />
              </Field>

              <Field label="Seuil d'alerte stock faible">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={edit.lowStockThreshold ?? 3}
                  onChange={e =>
                    setEdit({ ...edit, lowStockThreshold: Number(e.target.value) })
                  }
                />
              </Field>
            </div>

            <Field
              label="Description vérifiée"
              hint="Description exacte pour que le studio de contenu rédige des textes fidèles."
            >
              <textarea
                required
                maxLength={2000}
                rows={3}
                placeholder="Notes de tête, sillage, texture, conseils d’application vérifiés..."
                value={edit.description}
                onChange={e => setEdit({ ...edit, description: e.target.value })}
              />
            </Field>

            <Field
              label="Caractéristiques vérifiées (flacon, volume, certification)"
              hint="Uniquement les informations figurant sur l'emballage."
            >
              <textarea
                rows={2}
                maxLength={1500}
                placeholder="Ex. : 50 ml, vaporisateur, fabrication certifiée..."
                value={edit.features}
                onChange={e => setEdit({ ...edit, features: e.target.value })}
              />
            </Field>

            {(store.photoBank || []).length > 0 && (
              <Field label="Photo de référence (depuis la Banque d'images)">
                <select
                  value={edit.photoBankId || ''}
                  onChange={e => {
                    const selectedPh = (store.photoBank || []).find(ph => ph.id === e.target.value);
                    if (selectedPh) {
                      setEdit({ ...edit, photo: selectedPh.url, photoBankId: selectedPh.id });
                    } else {
                      setEdit({ ...edit, photoBankId: undefined });
                    }
                  }}
                >
                  <option value="">-- Choisir dans la photothèque ou importer un fichier ci-dessous --</option>
                  {(store.photoBank || []).map(ph => (
                    <option key={ph.id} value={ph.id}>
                      {ph.title} ({ph.category})
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <label className="upload-area">
              <Upload size={21} />
              <span>{edit.photo ? 'Remplacer la photo de référence' : 'Ajouter une photo réelle du produit'}</span>
              <small>JPG, PNG ou WebP · 3 Mo maximum</small>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async e => {
                  if (e.target.files?.[0]) {
                    try {
                      setEdit({ ...edit, photo: await photoData(e.target.files[0]) });
                    } catch (err) {
                      notify((err as Error).message);
                    }
                  }
                }}
              />
            </label>

            {edit.photo && (
              <div className="photo-preview">
                <img src={edit.photo} alt="Photo du produit" />
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setEdit({ ...edit, photo: '' })}
                >
                  Retirer la photo
                </button>
              </div>
            )}

            <label className="check-field">
              <input
                type="checkbox"
                checked={edit.active}
                onChange={e => setEdit({ ...edit, active: e.target.checked })}
              />
              Produit actif pour la création de contenu et la vente
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setEdit(null)}
              >
                Annuler
              </button>
              <button className="button" type="submit">
                Enregistrer le produit
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL SUPPRESSION */}
      {deleting && (
        <Modal title="Supprimer ce produit ?" onClose={() => setDeleting(null)}>
          <p>
            « {deleting.name} » sera retiré du catalogue. Ses ventes et contenus
            existants seront conservés.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(null)}
            >
              Annuler
            </button>
            <button
              className="button danger"
              onClick={() => {
                update(s => ({
                  ...s,
                  products: s.products.filter(p => p.id !== deleting.id)
                }));
                setDeleting(null);
                notify('Produit supprimé.');
              }}
            >
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
