import { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  ArrowUpRight,
  Save,
  CalendarPlus,
  RefreshCw,
  WandSparkles,
  Image,
  Download as DownloadIcon,
  ExternalLink,
  Upload,
  CheckCircle2,
  Camera,
  Layers,
  Eye,
  Palette,
  Check,
  Share2
} from 'lucide-react';
import {
  type Shared,
  Field,
  PlatformBadge,
  CopyButton,
  Empty,
  Modal,
  ProductArt,
  Download,
  platformList
} from './ui';
import {
  conceptsFor,
  draftCopy,
  uid,
  localDate,
  contentTypes,
  money,
  PHOTO_BANK_TARGET,
  DAILY_THEMES
} from './domain.mjs';
import type { Platform, Concept, Product, PhotoBankItem } from './types';
import { photoData } from './Products';
import { generateContent } from './services/generate';
import {
  renderBrandedComposition,
  requestAiImageFromReference,
  type CompositionPreset,
  compressUploadedImage
} from './services/imageComposer';

export type Context = { productId?: string; postId?: string; contentId?: string };

export function ScheduleModal({
  store,
  update,
  notify,
  platform,
  text,
  productId,
  visual,
  onClose
}: {
  platform: Platform;
  text: string;
  productId: string;
  visual?: Concept;
  onClose: () => void;
} & Shared) {
  const [date, setDate] = useState(localDate());
  const [time, setTime] = useState('19:00');

  return (
    <Modal title="Ajouter au calendrier" onClose={onClose}>
      <form
        onSubmit={e => {
          e.preventDefault();
          const p = store.products.find(prod => prod.id === productId);
          update(s => ({
            ...s,
            posts: [
              ...s.posts,
              {
                id: uid(),
                date,
                time,
                platform,
                productId,
                title: p?.name ? `${p.name} · ${platform}` : 'Nouvelle publication',
                text,
                type: 'Présentation produit',
                goal: s.settings.brandGoal,
                visual,
                format: platform === 'Facebook' ? '4:5' : '9:16',
                cta: 'Écrivez-nous sur WhatsApp pour commander.',
                paid: false,
                status: 'Prêt',
                demo: !!p?.demo
              }
            ]
          }));
          notify('Contenu ajouté au calendrier éditorial.');
          onClose();
        }}
      >
        <p className="form-intro">
          L’ajout au calendrier organise votre travail. Vous publierez vous-même sur vos
          réseaux au moment venu.
        </p>
        <div className="form-grid">
          <Field label="Date de publication">
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </Field>
          <Field label="Heure · Douala">
            <input
              type="time"
              required
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </Field>
        </div>
        <div className="modal-actions">
          <button className="button" type="submit">
            <CalendarPlus size={16} /> Planifier ce contenu
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Studio(props: Shared & { context: Context }) {
  const { store, update, notify, navigate, context } = props;
  const post = store.posts.find(p => p.id === context.postId);
  const saved = store.contents.find(c => c.id === context.contentId);

  const [productId, setProductId] = useState(
    context.productId || post?.productId || saved?.productId || ''
  );
  const [original, setOriginal] = useState(post?.text || saved?.text || '');
  const [tone, setTone] = useState('Naturel');
  const [goal, setGoal] = useState('Générer des conversations WhatsApp');
  const [cta, setCta] = useState(
    'Écrivez-nous sur WhatsApp pour commander.' +
      (store.settings.whatsapp ? ' https://wa.me/' + store.settings.whatsapp : '')
  );
  const [active, setActive] = useState<Platform>(
    post?.platform || saved?.platform || 'Facebook'
  );
  const [texts, setTexts] = useState<Record<Platform, string>>({
    Facebook: '',
    TikTok: '',
    WhatsApp: ''
  });
  const [alternatives, setAlternatives] = useState<Record<Platform, string>[]>([]);
  const [mode, setMode] = useState('');
  const [busy, setBusy] = useState(false);
  const [variant, setVariant] = useState(0);
  const [schedule, setSchedule] = useState(false);
  const [connected, setConnected] = useState(false);

  const product = store.products.find(p => p.id === productId);
  const available = store.products.filter(p => p.active && p.stock > 0);

  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(s => setConnected(s.textAI))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const draft = localStorage.getItem('nickshop-writer-draft');
    if (draft && !post && !saved) {
      try {
        const d = JSON.parse(draft);
        setOriginal(d.original || '');
        setProductId(context.productId || d.productId || '');
        setTone(d.tone || 'Naturel');
        setGoal(d.goal || goal);
        setCta(d.cta || cta);
      } catch {}
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'nickshop-writer-draft',
        JSON.stringify({ original, productId, tone, goal, cta })
      );
    } catch {}
  }, [original, productId, tone, goal, cta]);

  async function generate(nextVariant = variant) {
    if (!original.trim() && !product) {
      notify('Choisissez un produit ou saisissez votre texte de départ.');
      return;
    }
    if (product && (!product.active || product.stock === 0)) {
      notify('Ce produit est inactif ou en rupture de stock.');
      return;
    }
    setBusy(true);
    try {
      const data = await generateContent({
        kind: 'copy',
        product,
        original,
        tone,
        goal,
        cta,
        variant: nextVariant
      });
      setTexts(data.result as Record<Platform, string>);
      setMode(data.mode);
      setVariant(nextVariant);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function generateVariants() {
    if (!original.trim() && !product) {
      notify('Choisissez un produit ou saisissez votre texte de départ.');
      return;
    }
    setBusy(true);
    try {
      const results = await Promise.all(
        [1, 2, 3].map(offset =>
          generateContent({
            kind: 'copy',
            product,
            original,
            tone,
            goal,
            cta,
            variant: variant + offset
          })
        )
      );
      const versions = results.map(r => r.result as Record<Platform, string>);
      setAlternatives(versions);
      setTexts(versions[0]);
      setMode(results[0].mode);
      setVariant(variant + 3);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function transform(kind: string) {
    if (!texts[active]) return;
    if (kind === 'Court') {
      const p = product;
      setTexts({
        ...texts,
        [active]: `${p?.name || 'NickShop'}\n${(original || p?.description || '').split('\n')[0]}\n${
          p ? money(p.price) : ''
        }\n${cta}`
      });
      setMode('template');
    } else {
      setTone(kind);
      notify(`Ton « ${kind} » sélectionné. Cliquez sur Générer pour l’appliquer aux trois versions.`);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">RÉDACTION MULTIPLATEFORME AVEC CONTEXTE VÉRIFIÉ</div>
          <h1>Le studio de contenu<span className="gold">.</span></h1>
          <p>
            Rédigez des publications adaptées aux codes de Facebook, TikTok et WhatsApp
            sans inventer de caractéristiques non vérifiées.
          </p>
        </div>
        <span className="connection-chip">
          <i className={connected ? 'online' : ''} />
          {connected ? 'Gemini IA configuré' : 'Modèles éditoriaux locaux (hors ligne)'}
        </span>
      </div>

      <div className="editor-layout">
        {/* BRIEF CRÉATIF */}
        <form
          className="panel input-panel"
          onSubmit={e => {
            e.preventDefault();
            generate();
          }}
        >
          <div className="section-heading">
            <h2>
              <WandSparkles size={19} /> Votre brief créatif
            </h2>
            <span className="step-number">01</span>
          </div>

          <Field label="Produit à mettre en lumière">
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
            >
              <option value="">Sans produit spécifique</option>
              {available.map(p => (
                <option value={p.id} key={p.id}>
                  {p.name} {p.demo ? '· Démo' : ''}
                </option>
              ))}
            </select>
          </Field>

          {product && (
            <div className="selected-product">
              <ProductArt product={product} />
              <div>
                <strong>{product.name}</strong>
                <small>
                  {money(product.price)} · {product.stock} en stock{' '}
                  {product.cost ? `· Coût d’achat : ${money(product.cost)}` : ''}
                </small>
              </div>
            </div>
          )}

          <Field label="Que souhaitez-vous raconter ou mettre en avant ?">
            <textarea
              rows={5}
              maxLength={6000}
              placeholder="Ex. : Arrivage ce matin de 12 flacons, parfum chaud pour les soirées à Douala..."
              value={original}
              onChange={e => setOriginal(e.target.value)}
            />
          </Field>

          <Field label="Objectif commercial de la publication">
            <select
              value={goal}
              onChange={e => setGoal(e.target.value)}
            >
              {[
                'Générer des conversations WhatsApp',
                'Faire découvrir un produit',
                'Instaurer la confiance (conseil beauté)',
                'Présenter une offre vérifiée',
                'Répondre à une objection client',
                'Obtenir des commandes directes'
              ].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="Ton de la publication">
            <div className="choice-row">
              {['Naturel', 'Premium', 'Persuasif'].map(t => (
                <button
                  type="button"
                  className={tone === t ? 'selected' : ''}
                  onClick={() => setTone(t)}
                  key={t}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Appel à l’action (WhatsApp)">
            <input
              required
              maxLength={300}
              value={cta}
              onChange={e => setCta(e.target.value)}
            />
          </Field>

          <button type="submit" disabled={busy} className="button full">
            <Sparkles size={17} className={busy ? 'spin' : ''} />
            {busy ? 'Création en cours…' : 'Générer les versions pour Facebook, TikTok & WhatsApp'}
          </button>

          <p className="small-text muted">
            {connected
              ? 'Génération assistée par Gemini côté serveur.'
              : 'Sans clé API, les modèles éditoriaux locaux sont utilisés immédiatement.'}{' '}
            Relisez toujours le contenu avant de le poster.
          </p>
        </form>

        {/* CONTENU GÉNÉRÉ */}
        <section className="panel output-panel">
          <div className="section-heading">
            <div>
              <h2>Votre contenu, adapté à chaque réseau</h2>
              <p>Formats personnalisés : Facebook, script TikTok, statuts WhatsApp</p>
            </div>
            <span className="step-number">02</span>
          </div>

          <div className="platform-tabs">
            {platformList.map(p => (
              <button
                key={p}
                className={active === p ? 'active' : ''}
                onClick={() => setActive(p)}
              >
                <PlatformBadge platform={p} />
              </button>
            ))}
          </div>

          {texts[active] ? (
            <>
              <div className="generated-note">
                <Sparkles size={13} />
                {mode === 'ai'
                  ? 'Généré avec Gemini · à relire'
                  : 'Modèle éditorial certifié NickShop · sans IA'}
                {product?.demo ? ' · Produit de démonstration' : ''}
              </div>

              <textarea
                className="copy-editor"
                aria-label={`Texte ${active}`}
                value={texts[active]}
                onChange={e => setTexts({ ...texts, [active]: e.target.value })}
              />

              <div className="copy-meta">
                <span>{texts[active].length} caractères</span>
                <span>Modifiable librement · enregistrez votre version</span>
              </div>

              <div className="refine-row">
                <span>Variantes :</span>
                {['Court', 'Premium', 'Persuasif', 'Naturel'].map(t => (
                  <button
                    key={t}
                    className="pill-button"
                    onClick={() => transform(t)}
                  >
                    {t === 'Court' ? 'Raccourcir' : `Plus ${t.toLowerCase()}`}
                  </button>
                ))}
                <button
                  className="pill-button"
                  disabled={busy}
                  onClick={generateVariants}
                >
                  3 angles créatifs
                </button>
                <button
                  className="pill-button"
                  disabled={busy}
                  onClick={() => generate(variant + 1)}
                >
                  <RefreshCw size={12} /> Autre variante
                </button>
              </div>

              {alternatives.length > 0 && (
                <div className="choice-row variant-choices">
                  {alternatives.map((version, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => setTexts(version)}
                    >
                      Angle {index + 1}
                    </button>
                  ))}
                </div>
              )}

              <div className="output-actions">
                <CopyButton text={texts[active]} notify={notify} />
                <button
                  className="button secondary small"
                  onClick={() => {
                    update(s => ({
                      ...s,
                      contents: [
                        {
                          id: uid(),
                          platform: active,
                          text: texts[active],
                          productId,
                          created: new Date().toISOString(),
                          demo: product?.demo
                        },
                        ...s.contents
                      ]
                    }));
                    notify('Contenu enregistré dans la bibliothèque.');
                  }}
                >
                  <Save size={15} /> Enregistrer
                </button>
                <button
                  className="button small"
                  onClick={() => setSchedule(true)}
                >
                  <CalendarPlus size={15} /> Au calendrier
                </button>
              </div>

              {post && (
                <button
                  className="text-button mt-4"
                  onClick={() => {
                    update(s => ({
                      ...s,
                      posts: s.posts.map(p =>
                        p.id === post.id
                          ? { ...p, text: texts[active], platform: active, productId }
                          : p
                      )
                    }));
                    notify('Publication du calendrier mise à jour.');
                  }}
                >
                  Mettre à jour la publication d’origine <ArrowUpRight size={15} />
                </button>
              )}

              <button
                className="visual-link"
                onClick={() => {
                  sessionStorage.setItem(
                    'nickshop-visual-brief',
                    JSON.stringify({ productId, post: texts[active], platform: active })
                  );
                  navigate('visual', productId);
                }}
              >
                <Image size={19} />
                <span>
                  Donner une image à ces mots ?
                  <strong>Explorer les directions visuelles et prompts</strong>
                </span>
                <ArrowUpRight size={18} />
              </button>
            </>
          ) : (
            <div className="writer-empty">
              <div className="writer-paper">
                <span />
                <span />
                <span />
                <Sparkles size={25} />
              </div>
              <h3>Les belles histoires commencent ici.</h3>
              <p>
                Choisissez un produit en stock, partagez vos faits vérifiés, et laissez
                le studio rédiger vos versions Facebook, TikTok et WhatsApp.
              </p>
              <div>
                <PlatformBadge platform="Facebook" />
                <PlatformBadge platform="TikTok" />
                <PlatformBadge platform="WhatsApp" />
              </div>
            </div>
          )}
        </section>
      </div>

      {schedule && (
        <ScheduleModal
          {...props}
          platform={active}
          text={texts[active]}
          productId={productId}
          onClose={() => setSchedule(false)}
        />
      )}
    </>
  );
}

export function VisualStudio(props: Shared & { context: Context }) {
  const { store, update, notify, navigate, context } = props;
  const post = store.posts.find(p => p.id === context.postId);

  const [productId, setProductId] = useState(
    context.productId || post?.productId || ''
  );
  const [postText, setPostText] = useState(post?.text || '');
  const [platform, setPlatform] = useState<Platform>('Facebook');
  const [format, setFormat] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [style, setStyle] = useState('Premium minimaliste');
  const [goal, setGoal] = useState('Générer des conversations WhatsApp');
  const [preset, setPreset] = useState<CompositionPreset>('luxury_podium');

  // Mode de mise en scène : 'raw_product' (image vierge sur podium 3D) ou 'full_photo' (photo complète)
  const [imageType, setImageType] = useState<'raw_product' | 'full_photo'>('raw_product');

  // Photo de référence / importée
  const [referencePhoto, setReferencePhoto] = useState<PhotoBankItem | null>(null);
  const [customUploadedUrl, setCustomUploadedUrl] = useState<string>('');

  // Personnalisation des textes de l'affiche
  const [customHeadline, setCustomHeadline] = useState('');
  const [customSubtext, setCustomSubtext] = useState('');
  const [badgeText, setBadgeText] = useState('✨ ARRIVAGE EXCLUSIF · DOUALA');
  const [showPrice, setShowPrice] = useState(true);
  const [showCta, setShowCta] = useState(true);
  const [showBadge, setShowBadge] = useState(true);

  // État interface & modals
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderedImageUrl, setRenderedImageUrl] = useState('');
  const [ideas, setIdeas] = useState<Concept[]>([]);
  const [variant, setVariant] = useState(0);
  const [activeTab, setActiveTab] = useState<'composer' | 'concepts'>('composer');
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('arrivage');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Initialisation depuis sessionStorage ou context
  useEffect(() => {
    const savedPhotoStr = sessionStorage.getItem('nickshop-selected-reference-photo');
    if (savedPhotoStr) {
      try {
        const p = JSON.parse(savedPhotoStr);
        setReferencePhoto(p);
        if (p.productId) setProductId(p.productId);
        sessionStorage.removeItem('nickshop-selected-reference-photo');
      } catch {}
    }

    const savedBrief = sessionStorage.getItem('nickshop-visual-brief');
    if (savedBrief) {
      try {
        const b = JSON.parse(savedBrief);
        if (b.post) setPostText(b.post);
        if (b.platform) {
          setPlatform(b.platform);
          setFormat(b.platform === 'WhatsApp' ? '9:16' : b.platform === 'TikTok' ? '9:16' : '1:1');
        }
        if (b.productId) setProductId(b.productId);
        sessionStorage.removeItem('nickshop-visual-brief');
      } catch {}
    }
  }, []);

  // 2. Synchronisation de la photo avec le produit si aucune photo active
  const product = store.products.find(p => p.id === productId);
  useEffect(() => {
    if (!referencePhoto && !customUploadedUrl && store.photoBank?.length) {
      if (product) {
        const found = store.photoBank.find(
          ph => ph.id === product.photoBankId || ph.productId === product.id
        );
        setReferencePhoto(found || store.photoBank[0]);
      } else {
        setReferencePhoto(store.photoBank[0]);
      }
    }
  }, [productId, product, store.photoBank, referencePhoto, customUploadedUrl]);

  // Image source effective
  const effectiveImageUrl = customUploadedUrl || referencePhoto?.url || '';

  // 3. Rendu interactif de l'affiche sur Canvas 2D
  const triggerCanvasRender = async () => {
    if (!canvasRef.current || !effectiveImageUrl) return;
    try {
      const dataUrl = await renderBrandedComposition(canvasRef.current, {
        referenceImageUrl: effectiveImageUrl,
        imageType,
        postText,
        product,
        preset,
        platform,
        format,
        customHeadline: customHeadline || undefined,
        customSubtext: customSubtext || undefined,
        badgeText: showBadge ? badgeText : undefined,
        showPrice,
        showCta,
        showBrand: true,
        showBadge,
        whatsappPhone: store.settings.whatsapp || '690 00 00 00'
      });
      setRenderedImageUrl(dataUrl);
    } catch (err) {
      console.warn('Erreur rendu Canvas affiche:', err);
    }
  };

  useEffect(() => {
    triggerCanvasRender();
  }, [
    effectiveImageUrl,
    imageType,
    postText,
    product,
    preset,
    platform,
    format,
    customHeadline,
    customSubtext,
    badgeText,
    showPrice,
    showCta,
    showBadge,
    store.settings.whatsapp
  ]);

  // Gestion de l'import depuis l'ordinateur / portable
  async function handleFileUpload(file: File) {
    try {
      notify('Chargement et optimisation de votre photo…');
      const compressed = await compressUploadedImage(file, 1400, 0.9);
      setCustomUploadedUrl(compressed);

      // On ajoute également cette photo à la banque pour progresser vers les 40 photos !
      const newTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Produit importé';
      const newItem: PhotoBankItem = {
        id: uid(),
        title: newTitle,
        url: compressed,
        category: 'Parfum',
        productId: product?.id,
        productName: product?.name,
        styleNotes: 'Photo importée depuis l’ordinateur. Flacon ou produit pour affiche.',
        tags: ['import-pc', 'affiche-ia'],
        created: localDate(),
        demo: false
      };

      update(s => ({
        ...s,
        photoBank: [newItem, ...(s.photoBank || [])]
      }));

      setReferencePhoto(newItem);
      notify(`Photo importée avec succès ! Ajoutée à votre photothèque (${(store.photoBank?.length || 0) + 1}/40).`);
    } catch (err) {
      notify((err as Error).message);
    }
  }

  // Application rapide d'un thème "Ce que je veux partager aujourd'hui"
  function applyTheme(themeId: string) {
    setSelectedThemeId(themeId);
    const theme = DAILY_THEMES.find(t => t.id === themeId);
    if (!theme) return;

    const prodName = product?.name || referencePhoto?.title || 'Votre Parfum';
    setCustomHeadline(theme.headlineTemplate(prodName));
    setCustomSubtext(theme.subtextTemplate(prodName));
    setBadgeText(theme.badge);
    setPreset(theme.preset as CompositionPreset);

    if (!postText.trim()) {
      setPostText(theme.hookCopy(prodName));
    }
    notify(`Angle appliqué : « ${theme.label} »`);
  }

  // Génération de l'affiche / illustration IA
  async function handleGenerateAiAffiche() {
    if (!effectiveImageUrl) {
      notify('Veuillez d’abord importer ou sélectionner une photo.');
      return;
    }
    setIsGenerating(true);
    notify('Création de votre affiche publicitaire haute définition…');

    try {
      const activeRef: PhotoBankItem = referencePhoto || {
        id: uid(),
        title: product?.name || 'Photo sélectionnée',
        url: effectiveImageUrl,
        category: 'Parfum',
        styleNotes: 'Flacon de parfum de luxe NickShop',
        tags: ['affiche'],
        created: localDate()
      };

      const res = await requestAiImageFromReference({
        referencePhoto: activeRef,
        postText,
        product,
        platform,
        format,
        style
      });

      if (res.mode === 'ai' && res.imageUrl) {
        setRenderedImageUrl(res.imageUrl);
        notify('Affiche IA générée avec succès !');
      } else {
        await triggerCanvasRender();
        notify('Affiche publicitaire composée en haute résolution !');
      }

      // Générer aussi 3 directions de prompts
      const conceptsData = await generateContent({
        kind: 'visual',
        product: product || {
          id: '',
          name: customHeadline || 'Parfum NickShop',
          category: 'Parfum',
          price: 18000,
          description: customSubtext,
          features: '',
          stock: 1,
          active: true,
          photo: effectiveImageUrl
        },
        variant
      });
      setIdeas(conceptsData.result as Concept[]);
      setVariant(v => v + 1);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSaveAfficheToBank() {
    if (!renderedImageUrl) {
      notify('Aucune affiche générée à enregistrer.');
      return;
    }
    const newId = uid();
    const newTitle = `Affiche · ${product?.name || customHeadline || 'NickShop'} (${format})`;
    const newItem: PhotoBankItem = {
      id: newId,
      title: newTitle,
      url: renderedImageUrl,
      category: 'Statut & Promo',
      productId: product?.id,
      productName: product?.name,
      aspectRatio: format,
      styleNotes: `Affiche publicitaire attractive créée pour ${platform} sur le thème « ${badgeText} ».`,
      tags: ['affiche-ia', platform.toLowerCase(), preset],
      created: localDate(),
      isAiGenerated: true,
      demo: false
    };

    update(s => ({
      ...s,
      photoBank: [newItem, ...(s.photoBank || [])]
    }));
    notify('Affiche enregistrée dans votre banque de photos !');
  }

  function handleDownloadVisual() {
    if (!renderedImageUrl) {
      notify('Aucune affiche prête.');
      return;
    }
    const a = document.createElement('a');
    a.href = renderedImageUrl;
    a.download = `nickshop-affiche-${(product?.name || 'creation').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${format.replace(':', 'x')}.png`;
    a.click();
    notify('Téléchargement de votre affiche HD (PNG 1080p) lancé.');
  }

  function handleShareWhatsApp() {
    const textToShare = `${badgeText ? `${badgeText}\n` : ''}${customHeadline || product?.name || 'NickShop'}\n${customSubtext}\n\n👉 Contactez-nous pour commander : https://wa.me/237${(store.settings.whatsapp || '690000000').replace(/[^0-9]/g, '')}`;
    navigator.clipboard?.writeText(textToShare);
    notify('Texte promotionnel copié ! Téléchargez l’affiche pour l’ajouter à votre statut WhatsApp.');
  }

  function handleAssociateToPost() {
    if (!post) {
      notify('Aucune publication du calendrier sélectionnée.');
      return;
    }
    update(s => ({
      ...s,
      posts: s.posts.map(p =>
        p.id === post.id
          ? {
              ...p,
              format,
              visual: {
                id: uid(),
                title: `Affiche · ${product?.name || customHeadline}`,
                scene: `Affiche publicitaire sur podium luxe (${preset})`,
                palette: preset,
                typo: 'Manrope & DM Sans',
                why: 'Cohérence visuelle immédiate avec la photo de référence et le texte.',
                text: customHeadline || product?.name || '',
                format,
                prompt: referencePhoto?.styleNotes || '',
                productId: product?.id,
                referencePhotoId: referencePhoto?.id,
                referencePhotoUrl: effectiveImageUrl,
                generatedImageUrl: renderedImageUrl
              }
            }
          : p
      )
    }));
    notify('Affiche associée à la publication du calendrier !');
  }

  const photoCount = store.photoBank?.length || 0;
  const progressPercent = Math.min(100, Math.round((photoCount / PHOTO_BANK_TARGET) * 100));

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">CRÉATEUR D'AFFICHES PUBLICITAIRES & IA</div>
          <h1>Générateur d’affiches attractives<span className="gold">.</span></h1>
          <p>
            Donnez une photo vierge de votre produit (importée depuis votre ordinateur ou choisie dans votre bibliothèque).
            L’IA la met en scène sur un podium de luxe avec éclairage commercial et génère une affiche prête à publier selon ce que vous voulez partager aujourd’hui.
          </p>
        </div>
        <div className="actions-cluster">
          <button className="button secondary" onClick={() => navigate('photobank')}>
            <Camera size={15} /> Photothèque ({photoCount} / {PHOTO_BANK_TARGET})
          </button>
        </div>
      </div>

      {/* BANDEAU OBJECTIF 40 PHOTOS & PROPULSEUR QUOTIDIEN */}
      <section className="panel photobank-progression-panel mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="progress-radial-pill">
              <Camera size={18} className="gold" />
              <span><strong>{photoCount}</strong> / {PHOTO_BANK_TARGET}</span>
            </div>
            <div>
              <h2 className="text-sm font-bold m-0">
                {photoCount >= PHOTO_BANK_TARGET
                  ? '🎯 Objectif 40 photos atteint : roulement automatique 100% prêt !'
                  : `Objectif 40 photos : ${photoCount} / 40 enregistrées (${progressPercent}%)`}
              </h2>
              <p className="text-xs muted m-0">
                {photoCount >= PHOTO_BANK_TARGET
                  ? 'L’IA dispose d’une banque complète pour vous proposer chaque jour une affiche et un texte uniques sans répétition.'
                  : `Plus que ${PHOTO_BANK_TARGET - photoCount} photos pour débloquer un mois complet de roulement automatique quotidien.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="button small"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Importer une photo ({fileInputRef.current ? 'PC/Mobile' : ''})
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 1 : SOURCE DE LA PHOTO DU PRODUIT */}
      <section className="panel reference-banner-panel mb-6">
        <div className="reference-header-row">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Upload size={18} className="gold" />
              1. Photo du produit à mettre en valeur
            </h2>
            <p className="text-sm muted">
              Importez une photo vierge depuis votre ordinateur ou choisissez un flacon déjà enregistré dans votre bibliothèque.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
            <button
              type="button"
              className="button highlight-btn small"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Importer depuis mon ordinateur
            </button>

            <button
              type="button"
              className="button secondary small"
              onClick={() => setShowLibraryModal(true)}
            >
              <Camera size={14} /> Choisir dans ma bibliothèque ({photoCount})
            </button>
          </div>
        </div>

        {/* Aperçu du flacon actif et sélection du mode de mise en scène */}
        <div className="active-source-row mt-4 flex flex-col md:flex-row items-center gap-4 p-3 rounded-lg bg-black/30 border border-amber-900/20">
          <div className="active-thumb-wrap relative w-20 h-20 rounded-md overflow-hidden bg-black/60 border border-amber-600/30 flex-shrink-0">
            {effectiveImageUrl ? (
              <img
                src={effectiveImageUrl}
                alt="Produit sélectionné"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-center muted">
                Aucune image
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="eyebrow">IMAGE DU PRODUIT :</span>
              <strong>{referencePhoto?.title || product?.name || 'Photo importée'}</strong>
            </div>
            <p className="text-xs muted mt-1">
              {referencePhoto?.styleNotes || 'Prête pour la mise en scène publicitaire sur podium studio.'}
            </p>

            {/* Sélecteur de type d'image : Vierge (Podium) ou Complète */}
            <div className="mt-2 flex gap-3">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer font-medium">
                <input
                  type="radio"
                  name="imageType"
                  checked={imageType === 'raw_product'}
                  onChange={() => setImageType('raw_product')}
                />
                🏷️ <strong>Image vierge du produit</strong> (Flacon seul · Mise en scène sur podium de luxe 3D)
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer font-medium">
                <input
                  type="radio"
                  name="imageType"
                  checked={imageType === 'full_photo'}
                  onChange={() => setImageType('full_photo')}
                />
                📸 <strong>Photo complète</strong> (Shooting avec décor · Couverture plein format)
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* DISPOSITION PRINCIPALE ÉDITEUR D'AFFICHES */}
      <div className="editor-layout visual-layout">
        {/* COLONNE GAUCHE : CE QUE JE VEUX PARTAGER AUJOURD'HUI & PARAMÈTRES */}
        <form
          className="panel input-panel"
          onSubmit={e => {
            e.preventDefault();
            handleGenerateAiAffiche();
          }}
        >
          <div className="section-heading">
            <h2>2. Ce que je veux partager aujourd'hui</h2>
            <span className="step-number">02</span>
          </div>

          {/* SÉLECTEUR RAPIDE D'ANGLES COMMERCIAUX DU JOUR */}
          <div className="mb-4">
            <label className="label block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
              Choisir un angle de partage pour aujourd’hui :
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DAILY_THEMES.map(theme => (
                <button
                  type="button"
                  key={theme.id}
                  className={`choice-tile text-left p-2.5 rounded-lg border text-xs transition-all ${
                    selectedThemeId === theme.id
                      ? 'border-amber-400 bg-amber-950/40 font-bold text-amber-200'
                      : 'border-white/10 bg-black/20 hover:border-amber-700/50'
                  }`}
                  onClick={() => applyTheme(theme.id)}
                >
                  <div className="font-semibold">{theme.label}</div>
                  <small className="muted block text-[11px] mt-0.5">{theme.badge}</small>
                </button>
              ))}
            </div>
          </div>

          <Field label="Produit NickShop concerné">
            <select
              value={productId}
              onChange={e => {
                setProductId(e.target.value);
                const foundProd = store.products.find(p => p.id === e.target.value);
                if (foundProd) {
                  const matchPhoto = store.photoBank.find(
                    ph => ph.id === foundProd.photoBankId || ph.productId === foundProd.id
                  );
                  if (matchPhoto) setReferencePhoto(matchPhoto);
                }
              }}
            >
              <option value="">Sélectionner un produit (facultatif)</option>
              {store.products
                .filter(p => p.active && p.stock > 0)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({money(p.price)})
                  </option>
                ))}
            </select>
          </Field>

          {/* TEXTES DE L'AFFICHE */}
          <div className="p-3 bg-black/20 rounded-lg border border-white/5 space-y-3">
            <Field label="Badge supérieur de l'affiche">
              <input
                value={badgeText}
                onChange={e => setBadgeText(e.target.value)}
                placeholder="Ex. : ✨ ARRIVAGE DU JOUR · DOUALA"
              />
            </Field>

            <Field label="Titre accrocheur sur l'affiche">
              <input
                value={customHeadline}
                onChange={e => setCustomHeadline(e.target.value)}
                placeholder="Ex. : Arrivage Exclusif · Éclat d'Ambre"
              />
            </Field>

            <Field label="Argumentaire vendeur court">
              <input
                value={customSubtext}
                onChange={e => setCustomSubtext(e.target.value)}
                placeholder="Ex. : Flacons reçus ce matin. Sillage intense et tenue 8h+ garantie."
              />
            </Field>
          </div>

          <Field label="Texte du post accompagnateur (Cohérence WhatsApp & Réseaux)">
            <textarea
              rows={3}
              maxLength={3000}
              placeholder="Ex. : Arrivage ce matin de notre parfum signature à Douala. Tenue 8h+, sillage chaleureux et envoûtant pour vos soirées. 12 000 FCFA avec livraison express."
              value={postText}
              onChange={e => setPostText(e.target.value)}
            />
          </Field>

          <div className="form-grid">
            <Field label="Format de l'affiche">
              <select
                value={format}
                onChange={e => setFormat(e.target.value as any)}
              >
                <option value="1:1">Carré 1:1 · Facebook & Instagram (1080 × 1080)</option>
                <option value="4:5">Portrait 4:5 · Fil d’actualité (1080 × 1350)</option>
                <option value="9:16">Vertical 9:16 · Statut WhatsApp & TikTok (1080 × 1920)</option>
              </select>
            </Field>

            <Field label="Ambiance stylistique">
              <select
                value={preset}
                onChange={e => setPreset(e.target.value as CompositionPreset)}
              >
                <option value="luxury_podium">Podium Marbre & Or (Grand Luxe)</option>
                <option value="whatsapp_flash">Statut WhatsApp Flash (Commercial)</option>
                <option value="douala_sunset">Coucher de Soleil Douala (Chaleureux)</option>
                <option value="black_gold_editorial">Noir & Or Prestige (Éditorial)</option>
                <option value="minimal_studio">Studio Contemporain Épuré</option>
              </select>
            </Field>
          </div>

          {/* OPTIONS D'AFFICHAGE */}
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={showBadge}
                onChange={e => setShowBadge(e.target.checked)}
              />
              Badge d'arrivée / urgence
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={e => setShowPrice(e.target.checked)}
              />
              Pastille prix en FCFA
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={showCta}
                onChange={e => setShowCta(e.target.checked)}
              />
              Bouton WhatsApp
            </label>
          </div>

          <button className="button full highlight-btn mt-4" disabled={isGenerating}>
            <Sparkles size={17} className={isGenerating ? 'spin' : ''} />
            {isGenerating
              ? 'Création de l’affiche IA en cours…'
              : 'Créer mon affiche attractive (Podium & Haute Définition)'}
          </button>
        </form>

        {/* COLONNE DROITE : RENDU VISUEL DE L'AFFICHE & ACTIONS */}
        <section className="panel visual-output-container">
          <div className="section-heading">
            <div>
              <h2>Votre affiche publicitaire finale</h2>
              <p>Rendu haute résolution (1080p) prêt à publier sur vos statuts WhatsApp et réseaux</p>
            </div>
            <div className="tabs">
              <button
                className={activeTab === 'composer' ? 'active' : ''}
                onClick={() => setActiveTab('composer')}
              >
                Affiche HD
              </button>
              <button
                className={activeTab === 'concepts' ? 'active' : ''}
                onClick={() => setActiveTab('concepts')}
              >
                Prompts IA ({ideas.length || 3})
              </button>
            </div>
          </div>

          {activeTab === 'composer' ? (
            <div className="composer-preview-wrap">
              {/* Canvas 2D en arrière-plan */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              <div className={`rendered-art-box ratio-${format.replace(':', '-')}`}>
                {renderedImageUrl ? (
                  <img
                    src={renderedImageUrl}
                    alt="Affiche publicitaire générée"
                    className="rendered-preview-img"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="render-placeholder">
                    <Sparkles size={36} className="gold mb-2" />
                    <span>Création de l'affiche sur le podium studio…</span>
                  </div>
                )}

                <div className="format-indicator-pill">
                  {format === '9:16'
                    ? 'Statut WhatsApp / TikTok 9:16'
                    : format === '4:5'
                    ? 'Portrait 4:5'
                    : 'Carré 1:1'}
                </div>
              </div>

              {/* BARRE D'ACTIONS DU VISUEL GÉNÉRÉ */}
              <div className="visual-actions-bar mt-4">
                <button
                  type="button"
                  className="button highlight-btn"
                  onClick={handleDownloadVisual}
                >
                  <DownloadIcon size={16} /> Télécharger l’affiche (PNG HD)
                </button>

                <button
                  type="button"
                  className="button secondary"
                  onClick={handleShareWhatsApp}
                >
                  <Share2 size={15} /> Copier pour WhatsApp
                </button>

                <button
                  type="button"
                  className="button secondary"
                  onClick={handleSaveAfficheToBank}
                >
                  <Save size={15} /> Enregistrer dans la photothèque
                </button>

                {post && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={handleAssociateToPost}
                  >
                    <CalendarPlus size={15} /> Lier au calendrier
                  </button>
                )}
              </div>

              <div className="reference-comparison-card mt-4">
                <div className="ref-side">
                  <span className="eyebrow">IMAGE SOURCE DU FLACON</span>
                  <div className="ref-mini-box">
                    {effectiveImageUrl && (
                      <img
                        src={effectiveImageUrl}
                        alt="Source"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div>
                      <strong>{referencePhoto?.title || product?.name || 'Photo importée'}</strong>
                      <p className="text-xs muted">{imageType === 'raw_product' ? 'Podium 3D actif' : 'Plein format actif'}</p>
                    </div>
                  </div>
                </div>
                <div className="ref-text-side">
                  <span className="eyebrow">MESSAGE PUBLICITAIRE ASSOCIÉ</span>
                  <p className="text-xs">{postText || customHeadline || 'Publication NickShop'}</p>
                </div>
              </div>
            </div>
          ) : (
            /* ONGLET PROMPTS DÉTAILLÉS */
            <div className="concepts-list-panel">
              <p className="text-sm muted mb-4">
                Ces prompts multimodaux décrivent votre flacon et ordonnent à l’IA de préserver
                la géométrie exacte du produit et le prestige de NickShop.
              </p>

              {ideas.length > 0 ? (
                ideas.map((idea, idx) => (
                  <article key={idea.id} className="concept-brief-box mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="eyebrow">DIRECTION 0{idx + 1} · {idea.format}</span>
                      <CopyButton text={idea.prompt} notify={notify} />
                    </div>
                    <h4>{idea.title}</h4>
                    <p className="text-sm">{idea.scene}</p>
                    <p className="text-xs gold font-semibold mt-1">Palette : {idea.palette}</p>
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer">Voir le prompt de génération</summary>
                      <pre className="prompt-pre">{idea.prompt}</pre>
                    </details>
                  </article>
                ))
              ) : (
                <div className="p-6 text-center muted">
                  <Sparkles size={24} className="mx-auto mb-2 gold" />
                  <p>Cliquez sur « Créer mon affiche » pour obtenir 3 directions visuelles détaillées.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* MODAL DE SÉLECTION DE PHOTO DANS LA BIBLIOTHÈQUE */}
      {showLibraryModal && (
        <Modal
          title="Choisir une photo dans votre bibliothèque"
          onClose={() => setShowLibraryModal(false)}
        >
          <div className="p-2">
            <p className="text-sm muted mb-4">
              Sélectionnez une photo de votre photothèque pour créer une affiche commerciale immédiate.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {(store.photoBank || []).map(item => (
                <div
                  key={item.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    referencePhoto?.id === item.id
                      ? 'border-amber-400 bg-amber-950/40'
                      : 'border-white/10 bg-black/20 hover:border-amber-700/50'
                  }`}
                  onClick={() => {
                    setReferencePhoto(item);
                    setCustomUploadedUrl('');
                    if (item.productId) setProductId(item.productId);
                    setShowLibraryModal(false);
                    notify(`Photo « ${item.title} » sélectionnée pour l'affiche.`);
                  }}
                >
                  <div className="w-full h-28 rounded overflow-hidden bg-black/50 mb-2">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <strong className="block text-xs truncate">{item.title}</strong>
                  <small className="text-[11px] muted">{item.category}</small>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}


