import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Download as DownloadIcon,
  CalendarDays,
  List,
  Columns3,
  Copy,
  Trash2,
  PenLine,
  Image,
  RefreshCw,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { type Shared, Modal, Field, PlatformBadge, Status, Empty, Download, platformList } from './ui';
import {
  uid,
  localDate,
  getDoualaDate,
  buildSchedule,
  statuses,
  csvExport,
  icsExport,
  draftCopy,
  conceptsFor,
  contentTypes
} from './domain.mjs';
import type { Post, Platform } from './types';
import type { Context } from './Studio';

const weekday = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];

export default function Calendar(props: Shared & { context: Context }) {
  const { store, update, notify, navigate, context } = props;
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<'Mois' | 'Semaine' | 'Jour' | 'Liste'>('Mois');
  const [platform, setPlatform] = useState('Toutes');
  const [statusFilter, setStatusFilter] = useState('Tous');

  const [edit, setEdit] = useState<Post | null>(
    () => store.posts.find(p => p.id === context.postId) || null
  );
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Génération de planning
  const [start, setStart] = useState(localDate());
  const [days, setDays] = useState(7);
  const [frequency, setFrequency] = useState(4);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['Facebook', 'WhatsApp', 'TikTok']);
  const [productIds, setProductIds] = useState(
    store.products.filter(p => p.active && p.stock > 0).map(p => p.id)
  );
  const [goal, setGoal] = useState(store.settings.brandGoal);
  const [promotion, setPromotion] = useState('');
  const [important, setImportant] = useState('');
  const [budget, setBudget] = useState(store.settings.budget);
  const [mix, setMix] = useState([
    'Présentation produit',
    'Conseil beauté & parfum',
    'Démonstration',
    'Storytelling',
    'Publicité Meta Ads'
  ]);

  const month = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const first = new Date(month);
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7));

  const weekStart = new Date(cursor);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  const visibleDays = Array.from(
    { length: view === 'Semaine' ? 7 : 42 },
    (_, i) => {
      const d = new Date(view === 'Semaine' ? weekStart : first);
      d.setDate(d.getDate() + i);
      return d;
    }
  );

  const filtered = store.posts.filter(p => {
    const matchesPlatform = platform === 'Toutes' || p.platform === platform;
    const matchesStatus = statusFilter === 'Tous' || p.status === statusFilter;
    return matchesPlatform && matchesStatus;
  });

  const cursorDateStr = localDate(cursor);
  const period = filtered
    .filter(p => {
      if (view === 'Jour') {
        return p.date === cursorDateStr;
      }
      if (view === 'Semaine') {
        return p.date >= localDate(weekStart) && p.date <= localDate(visibleDays[6]);
      }
      return p.date.startsWith(localDate(month).slice(0, 7));
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  function move(step: number) {
    const date = new Date(cursor);
    if (view === 'Jour') {
      date.setDate(date.getDate() + step);
    } else if (view === 'Semaine') {
      date.setDate(date.getDate() + step * 7);
    } else {
      date.setDate(1);
      date.setMonth(date.getMonth() + step);
    }
    setCursor(date);
  }

  function newPost(date = localDate()) {
    setEdit({
      id: uid(),
      date,
      time: '19:00',
      platform: 'Facebook',
      productId: '',
      title: '',
      text: '',
      type: 'Présentation produit',
      goal,
      format: '4:5',
      cta: 'Écrivez-nous sur WhatsApp pour commander.',
      paid: false,
      status: 'Idée',
      demo: false
    });
  }

  function generate() {
    try {
      const posts = buildSchedule({
        start,
        days,
        perWeek: frequency,
        selectedPlatforms,
        products: store.products.filter(
          p => productIds.includes(p.id) && p.active && p.stock > 0
        ),
        goal,
        promotion,
        budget,
        important,
        mix
      });

      update(s => ({
        ...s,
        posts: [
          ...s.posts,
          ...posts.map(p => ({
            ...p,
            demo: !!s.products.find(x => x.id === p.productId)?.demo
          }))
        ],
        settings: { ...s.settings, budget }
      }));

      setCursor(new Date(start + 'T12:00:00'));
      setGenerating(false);
      notify(`${posts.length} publications ajoutées au calendrier avec succès.`);
    } catch (e) {
      notify((e as Error).message);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PLANIFICATION & RYTHME ÉDITORIAL</div>
          <h1>Votre calendrier éditorial<span className="gold">.</span></h1>
          <p>
            Structurez vos prises de parole sur Facebook, TikTok et WhatsApp pour
            maintenir un flux régulier de conversations qualifiées.
          </p>
        </div>

        <div className="button-group">
          <button className="button secondary" onClick={() => setExporting(true)}>
            <DownloadIcon size={16} /> Exporter
          </button>
          <button className="button" onClick={() => setGenerating(true)}>
            <Sparkles size={16} /> Créer un planning (7, 15, 30 j)
          </button>
        </div>
      </div>

      <section className="panel calendar-panel">
        <div className="calendar-toolbar">
          <div className="calendar-navigation">
            <button
              className="icon-button"
              aria-label="Période précédente"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <h2>
              {view === 'Jour'
                ? cursor.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : cursor.toLocaleDateString('fr-FR', {
                    month: 'long',
                    year: 'numeric'
                  })}
            </h2>
            <button
              className="icon-button"
              aria-label="Période suivante"
              onClick={() => move(1)}
            >
              <ChevronRight size={18} />
            </button>
            <button className="pill-button" onClick={() => setCursor(new Date())}>
              Aujourd’hui
            </button>
          </div>

          <div className="calendar-controls">
            <select
              aria-label="Filtrer par plateforme"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            >
              <option value="Toutes">Toutes les plateformes</option>
              {platformList.map(p => (
                <option key={p}>{p}</option>
              ))}
            </select>

            <select
              aria-label="Filtrer par statut"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="Tous">Tous les statuts</option>
              {statuses.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <div className="tabs compact">
              {[
                ['Mois', CalendarDays],
                ['Semaine', Columns3],
                ['Jour', Clock],
                ['Liste', List]
              ].map(([name, Icon]) => (
                <button
                  className={view === name ? 'active' : ''}
                  key={String(name)}
                  onClick={() => setView(name as any)}
                >
                  {typeof Icon !== 'string' && <Icon size={15} />}
                  <span>{String(name)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* VUE LISTE OU VUE JOUR */}
        {view === 'Liste' || view === 'Jour' ? (
          <div className="calendar-list">
            {period.map(p => (
              <button
                className="post-row"
                key={p.id}
                onClick={() => setEdit({ ...p })}
              >
                <div className="date-tile">
                  <span>
                    {new Date(p.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                      month: 'short'
                    })}
                  </span>
                  <strong>{p.date.slice(-2)}</strong>
                </div>

                <div className="post-row-main">
                  <h3>{p.title}</h3>
                  <div>
                    <PlatformBadge platform={p.platform} />
                    <small>
                      {p.time} · {p.demo ? 'Démo' : p.paid ? 'Publicité' : 'Organique'} ·{' '}
                      {store.products.find(x => x.id === p.productId)?.name || 'Sans produit'}
                    </small>
                  </div>
                </div>

                <Status value={p.status} />
              </button>
            ))}

            {!period.length && (
              <Empty
                title={
                  view === 'Jour'
                    ? 'Aucune publication pour cette journée'
                    : 'Une page blanche, plein de possibilités'
                }
                description="Ajoutez un contenu ou générez un planning équilibré."
              >
                <button
                  className="button"
                  onClick={() => newPost(view === 'Jour' ? cursorDateStr : localDate())}
                >
                  <Plus size={15} /> Programmer une publication
                </button>
              </Empty>
            )}
          </div>
        ) : (
          <>
            <div className="weekdays">
              {weekday.map(d => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className={`calendar-grid ${view === 'Semaine' ? 'week-view' : ''}`}>
              {visibleDays.map(date => {
                const key = localDate(date);
                const posts = filtered
                  .filter(p => p.date === key)
                  .sort((a, b) => a.time.localeCompare(b.time));

                return (
                  <div
                    key={key}
                    className={`calendar-day ${
                      date.getMonth() !== cursor.getMonth() ? 'other-month' : ''
                    } ${key === localDate() ? 'today' : ''}`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData('text/plain');
                      update(s => ({
                        ...s,
                        posts: s.posts.map(p =>
                          p.id === id ? { ...p, date: key } : p
                        )
                      }));
                      notify('Date de publication modifiée.');
                    }}
                  >
                    <div className="day-heading">
                      <span>{date.getDate()}</span>
                      <button
                        className="day-add"
                        aria-label={`Ajouter le ${key}`}
                        onClick={() => newPost(key)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {posts.map(p => (
                      <button
                        key={p.id}
                        data-post-id={p.id}
                        className={`calendar-event ${p.platform.toLowerCase()}`}
                        draggable
                        onDragStart={e => e.dataTransfer.setData('text/plain', p.id)}
                        onClick={() => setEdit({ ...p })}
                      >
                        <span>
                          {p.time} · {p.platform}
                          {p.demo ? ' · Démo' : ''}
                        </span>
                        <strong>{p.title}</strong>
                        <small>{p.status}</small>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="calendar-footer">
          <span>
            Fuseau horaire Africa/Douala · Le statut « Publié » doit être confirmé
            manuellement une fois le contenu posté.
          </span>
          <button className="text-button" onClick={() => newPost()}>
            <Plus size={14} /> Ajouter une publication
          </button>
        </div>
      </section>

      {/* ZONE D'IMPRESSION / PDF */}
      <section className="print-export">
        <p>{period.length} publications · Heures du Cameroun (Douala)</p>
        {period.map(p => (
          <article className="print-post" key={p.id}>
            <h2>
              {p.date} · {p.time} · {p.platform}
            </h2>
            <h3>{p.title}</h3>
            <p>
              {p.status} · {p.paid ? 'Publicité payante' : 'Organique'}
              {p.demo ? ' · Démonstration' : ''}
            </p>
            <p>
              <b>Produit :</b>{' '}
              {store.products.find(x => x.id === p.productId)?.name || 'Sans produit'} ·{' '}
              <b>Objectif :</b> {p.goal}
            </p>
            <p className="print-text">{p.text}</p>
            {p.visual && (
              <>
                <p>
                  <b>Visuel :</b> {p.visual.scene}
                </p>
                <p>
                  <b>Prompt :</b> {p.visual.prompt}
                </p>
              </>
            )}
            <p>
              <b>Format :</b> {p.format} · <b>Appel à l’action :</b> {p.cta}
            </p>
          </article>
        ))}
      </section>

      {/* MODAL GÉNÉRER UN PLANNING */}
      {generating && (
        <Modal title="Construire votre planning (7, 15 ou 30 jours)" onClose={() => setGenerating(false)}>
          <form
            onSubmit={e => {
              e.preventDefault();
              generate();
            }}
          >
            <p className="form-intro">
              Générez un calendrier équilibré alternant découverte, confiance, engagement
              et conversion. Les produits en rupture de stock sont automatiquement exclus.
            </p>

            <div className="form-grid">
              <Field label="Premier jour">
                <input
                  type="date"
                  required
                  value={start}
                  onChange={e => setStart(e.target.value)}
                />
              </Field>

              <Field label="Durée du cycle">
                <select
                  value={days}
                  onChange={e => setDays(Number(e.target.value))}
                >
                  {[7, 15, 30].map(d => (
                    <option value={d} key={d}>
                      {d} jours
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Publications par semaine">
                <input
                  type="number"
                  min="1"
                  max="21"
                  required
                  value={frequency}
                  onChange={e => setFrequency(Number(e.target.value))}
                />
              </Field>

              <Field label="Budget Meta Ads prévu (FCFA)">
                <input
                  type="number"
                  min="0"
                  required
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                />
              </Field>
            </div>

            <Field label="Plateformes ciblées">
              <div className="choice-row">
                {platformList.map(p => (
                  <button
                    type="button"
                    className={selectedPlatforms.includes(p) ? 'selected' : ''}
                    key={p}
                    onClick={() =>
                      setSelectedPlatforms(
                        selectedPlatforms.includes(p)
                          ? selectedPlatforms.filter(x => x !== p)
                          : [...selectedPlatforms, p]
                      )
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Produits en stock à mettre en avant">
              <div className="checkbox-list">
                {store.products
                  .filter(p => p.active && p.stock > 0)
                  .map(p => (
                    <label key={p.id}>
                      <input
                        type="checkbox"
                        checked={productIds.includes(p.id)}
                        onChange={() =>
                          setProductIds(
                            productIds.includes(p.id)
                              ? productIds.filter(x => x !== p.id)
                              : [...productIds, p.id]
                          )
                        }
                      />
                      {p.name} ({p.stock} en stock)
                    </label>
                  ))}
              </div>
            </Field>

            <Field label="Types de contenus à mixer">
              <div className="checkbox-list">
                {[
                  'Présentation produit',
                  'Conseil beauté & parfum',
                  'Démonstration',
                  'Storytelling',
                  'Témoignage client',
                  'Promotion commerciale',
                  'Publicité Meta Ads'
                ].map(t => (
                  <label key={t}>
                    <input
                      type="checkbox"
                      checked={mix.includes(t)}
                      onChange={() =>
                        setMix(
                          mix.includes(t)
                            ? mix.filter(x => x !== t)
                            : [...mix, t]
                        )
                      }
                    />
                    {t}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Objectif commercial global">
              <textarea
                required
                rows={2}
                maxLength={500}
                value={goal}
                onChange={e => setGoal(e.target.value)}
              />
            </Field>

            <Field label="Promotions vérifiées et conditions (facultatif)">
              <textarea
                rows={2}
                maxLength={1000}
                value={promotion}
                onChange={e => setPromotion(e.target.value)}
                placeholder="Renseignez uniquement des conditions réelles et confirmées."
              />
            </Field>

            <Field label="Événements clés / dates importantes (facultatif)">
              <input
                value={important}
                maxLength={500}
                onChange={e => setImportant(e.target.value)}
                placeholder="Ex. : Arrivage parfums vendredi, salon samedi..."
              />
            </Field>

            <div className="modal-actions">
              <button className="button" type="submit">
                <Sparkles size={16} /> Générer le planning
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL ÉDITION PUBLICATION */}
      {edit && (
        <Modal
          title={
            store.posts.some(p => p.id === edit.id)
              ? 'Détails de la publication'
              : 'Nouvelle publication'
          }
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              update(s => ({
                ...s,
                posts: s.posts.some(p => p.id === edit.id)
                  ? s.posts.map(p => (p.id === edit.id ? edit : p))
                  : [...s.posts, edit]
              }));
              setEdit(null);
              notify('Publication enregistrée dans le calendrier.');
            }}
          >
            <Field label="Titre de la publication">
              <input
                required
                maxLength={150}
                value={edit.title}
                onChange={e => setEdit({ ...edit, title: e.target.value })}
              />
            </Field>

            <div className="form-grid">
              <Field label="Date prévue">
                <input
                  type="date"
                  required
                  value={edit.date}
                  onChange={e => setEdit({ ...edit, date: e.target.value })}
                />
              </Field>

              <Field label="Heure · Douala">
                <input
                  type="time"
                  required
                  value={edit.time}
                  onChange={e => setEdit({ ...edit, time: e.target.value })}
                />
              </Field>

              <Field label="Plateforme">
                <select
                  value={edit.platform}
                  onChange={e =>
                    setEdit({ ...edit, platform: e.target.value as Platform })
                  }
                >
                  {platformList.map(p => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>

              <Field label="Statut de publication">
                <select
                  value={edit.status}
                  onChange={e => setEdit({ ...edit, status: e.target.value })}
                >
                  {statuses.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>

              <Field label="Produit associé">
                <select
                  value={edit.productId}
                  onChange={e =>
                    setEdit({
                      ...edit,
                      productId: e.target.value,
                      demo: !!store.products.find(p => p.id === e.target.value)?.demo
                    })
                  }
                >
                  <option value="">Sans produit spécifique</option>
                  {store.products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {!p.active || !p.stock ? '· Indisponible' : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Type de publication">
                <select
                  value={edit.type}
                  onChange={e => setEdit({ ...edit, type: e.target.value })}
                >
                  {contentTypes.map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Objectif marketing">
              <input
                value={edit.goal}
                onChange={e => setEdit({ ...edit, goal: e.target.value })}
              />
            </Field>

            <Field label="Texte complet de la publication">
              <textarea
                rows={6}
                required
                maxLength={12000}
                value={edit.text}
                onChange={e => setEdit({ ...edit, text: e.target.value })}
              />
            </Field>

            <div className="button-group">
              <button
                type="button"
                className="pill-button"
                onClick={() => {
                  const p = store.products.find(prod => prod.id === edit.productId);
                  setEdit({
                    ...edit,
                    text: draftCopy(p, '', 'Naturel', edit.cta, Math.floor(Math.random() * 3))[
                      edit.platform
                    ]
                  });
                  notify('Texte régénéré à partir d’un modèle local.');
                }}
              >
                <RefreshCw size={13} /> Régénérer le texte
              </button>
              <button
                type="button"
                className="pill-button"
                onClick={() =>
                  setEdit({
                    ...edit,
                    visual: conceptsFor(
                      store.products.find(p => p.id === edit.productId),
                      { platform: edit.platform }
                    )[0]
                  })
                }
              >
                <Image size={13} /> Générer concept visuel
              </button>

              {edit.status !== 'Publié' && (
                <button
                  type="button"
                  className="pill-button bg-emerald-50 text-emerald-800 border-emerald-300"
                  onClick={() => {
                    setEdit({
                      ...edit,
                      status: 'Publié',
                      publishedAt: new Date().toISOString()
                    });
                    notify('Statut mis à jour sur « Publié ».');
                  }}
                >
                  <CheckCircle2 size={13} /> Marquer comme publié
                </button>
              )}
            </div>

            {edit.visual && (
              <details className="visual-details">
                <summary>{edit.visual.title}</summary>
                <p>{edit.visual.scene}</p>
                <p className="prompt-text">{edit.visual.prompt}</p>
              </details>
            )}

            <div className="form-grid">
              <Field label="Format">
                <input
                  value={edit.format}
                  onChange={e => setEdit({ ...edit, format: e.target.value })}
                />
              </Field>
              <Field label="Appel à l’action">
                <input
                  value={edit.cta}
                  onChange={e => setEdit({ ...edit, cta: e.target.value })}
                />
              </Field>
            </div>

            <label className="check-field">
              <input
                type="checkbox"
                checked={edit.paid}
                onChange={e => setEdit({ ...edit, paid: e.target.checked })}
              />
              Publicité payante Meta Ads
            </label>

            <div className="editor-shortcuts">
              <button
                type="button"
                className="text-button"
                disabled={!store.posts.some(p => p.id === edit.id)}
                onClick={() => {
                  navigate('studio', edit.id);
                  setEdit(null);
                }}
              >
                <PenLine size={14} /> Ouvrir dans le studio
              </button>
              <button
                type="button"
                className="text-button"
                disabled={!store.posts.some(p => p.id === edit.id)}
                onClick={() => {
                  navigate('visual', edit.id);
                  setEdit(null);
                }}
              >
                <Image size={14} /> Ouvrir le générateur visuel
              </button>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="icon-button danger-text"
                aria-label="Supprimer la publication"
                onClick={() => {
                  if (confirm('Supprimer cette publication du calendrier ?')) {
                    update(s => ({
                      ...s,
                      posts: s.posts.filter(p => p.id !== edit.id)
                    }));
                    setEdit(null);
                  }
                }}
              >
                <Trash2 size={17} />
              </button>
              <button
                type="button"
                className="button secondary small"
                onClick={() => {
                  update(s => ({
                    ...s,
                    posts: [...s.posts, { ...edit, id: uid(), title: edit.title + ' (copie)' }]
                  }));
                  notify('Publication dupliquée.');
                }}
              >
                <Copy size={14} /> Dupliquer
              </button>
              <button className="button" type="submit">
                Enregistrer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL EXPORT */}
      {exporting && (
        <Modal title="Exporter votre calendrier" onClose={() => setExporting(false)}>
          <p className="form-intro">
            Export de {period.length} publication(s) pour la période affichée.
          </p>
          <div className="export-options">
            <button
              className="button secondary"
              disabled={!period.length}
              onClick={() =>
                Download(
                  'nickshop-calendrier.csv',
                  csvExport(period, store.products),
                  'text/csv;charset=utf-8'
                )
              }
            >
              Télécharger le CSV
            </button>
            <button
              className="button secondary"
              disabled={!period.length}
              onClick={() =>
                Download(
                  'nickshop-calendrier.ics',
                  icsExport(period),
                  'text/calendar;charset=utf-8'
                )
              }
            >
              Télécharger le calendrier (.ics)
            </button>
            <button
              className="button secondary"
              disabled={!period.length}
              onClick={() => {
                setExporting(false);
                setView('Liste');
                setTimeout(() => window.print(), 150);
              }}
            >
              Imprimer / Enregistrer en PDF
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
