import { useState, useMemo } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Send,
  AlertTriangle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MessageCircle,
  PenLine,
  Camera,
  RefreshCw,
  Share2
} from 'lucide-react';
import {
  type Shared,
  ProductArt,
  PlatformBadge,
  Status,
  CopyButton
} from './ui';
import {
  formatDoualaDateFull,
  getDoualaDate,
  money,
  generateDailyTasks,
  computeCommercialMetrics,
  getDailyPhotoProposal,
  PHOTO_BANK_TARGET,
  uid
} from './domain.mjs';
import type { Post, DailyTask } from './types';

export default function Today({ store, update, navigate, notify }: Shared) {
  const todayStr = getDoualaDate();
  const dateFormatted = formatDoualaDateFull();

  // Tâches quotidiennes ordonnées
  const tasks = useMemo(() => {
    return generateDailyTasks(store, todayStr);
  }, [store, todayStr]);

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Publication vedette du jour
  const todayPosts = store.posts.filter(p => p.date === todayStr);
  const featuredPost: Post | undefined =
    todayPosts.find(p => p.status !== 'Publié') ||
    todayPosts[0] ||
    store.posts
      .filter(p => p.date >= todayStr && p.status !== 'Publié')
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];

  const featuredProduct = featuredPost
    ? store.products.find(p => p.id === featuredPost.productId)
    : undefined;

  // Métriques commerciales du jour
  const todayMetrics = useMemo(() => {
    return computeCommercialMetrics(store.orders, store.dailyLogs, store.products, {
      startDate: todayStr,
      endDate: todayStr
    });
  }, [store.orders, store.dailyLogs, store.products, todayStr]);

  // Alerte stock faible
  const lowStock = store.products.filter(
    p => p.active && p.stock <= (p.lowStockThreshold ?? 3)
  );

  function toggleTask(taskId: string) {
    update(s => {
      const existing: DailyTask[] = s.tasks || [];
      const found = existing.find(t => t.id === taskId);
      let updatedTasks: DailyTask[];
      if (found) {
        updatedTasks = existing.map(t =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
      } else {
        const taskObj = tasks.find(t => t.id === taskId);
        if (taskObj) {
          updatedTasks = [...existing, { ...taskObj, completed: true } as DailyTask];
        } else {
          updatedTasks = existing;
        }
      }
      return { ...s, tasks: updatedTasks };
    });
  }

  // Offset manuel pour tirer une autre photo du jour
  const [photoOffset, setPhotoOffset] = useState(0);

  // Proposition automatique basée sur la photothèque
  const dailyProposal = useMemo(() => {
    return getDailyPhotoProposal(store, todayStr, photoOffset);
  }, [store, todayStr, photoOffset]);

  function handleUsePhotoProposalForAffiche() {
    sessionStorage.setItem('nickshop-selected-reference-photo', JSON.stringify(dailyProposal.photo));
    sessionStorage.setItem(
      'nickshop-visual-brief',
      JSON.stringify({
        productId: dailyProposal.product?.id,
        post: dailyProposal.copies.WhatsApp,
        platform: 'WhatsApp'
      })
    );
    navigate('visual', dailyProposal.product?.id);
    notify(`Photo « ${dailyProposal.photo.title} » ouverte dans le générateur d'affiches.`);
  }

  function handleAddProposalToPlanning() {
    update(s => ({
      ...s,
      posts: [
        {
          id: uid(),
          date: todayStr,
          time: '18:30',
          platform: 'WhatsApp',
          productId: dailyProposal.product?.id || '',
          title: dailyProposal.headline,
          text: dailyProposal.copies.WhatsApp,
          type: 'Présentation produit',
          goal: 'Générer des conversations WhatsApp',
          format: '9:16',
          cta: dailyProposal.cta,
          paid: false,
          status: 'Prêt',
          visual: {
            id: uid(),
            title: `Affiche · ${dailyProposal.headline}`,
            scene: `Affiche podium luxe inspirée de ${dailyProposal.photo.title}`,
            palette: dailyProposal.preset,
            typo: 'Manrope & DM Sans',
            why: 'Cohérence immédiate avec la photo de la banque et le thème du jour.',
            text: dailyProposal.headline,
            format: '9:16',
            prompt: dailyProposal.photo.styleNotes,
            productId: dailyProposal.product?.id,
            referencePhotoId: dailyProposal.photo.id,
            referencePhotoUrl: dailyProposal.photo.url
          }
        },
        ...s.posts
      ]
    }));
    notify('Proposition ajoutée à vos publications du jour !');
  }

  function markPostAsPublished(postId: string) {
    update(s => ({
      ...s,
      posts: s.posts.map(p =>
        p.id === postId
          ? {
              ...p,
              status: 'Publié',
              publishedAt: new Date().toISOString()
            }
          : p
      )
    }));
    notify('Publication marquée comme publiée. Bravo !');
  }

  function postponeTask(taskId: string) {
    notify('Tâche reportée à demain dans votre planning.');
  }

  return (
    <div className="today-view">
      {/* 1. EN-TÊTE QUOTIDIEN */}
      <section className="panel today-header-card">
        <div className="today-header-top">
          <div className="today-date-badge">
            <span className="live-dot" />
            <span className="douala-tz">Douala · Cameroun (GMT+1)</span>
          </div>
          <button className="text-button" onClick={() => navigate('calendar')}>
            <CalendarDays size={15} /> Voir le calendrier complet <ArrowRight size={14} />
          </button>
        </div>

        <div className="today-header-content">
          <div>
            <div className="eyebrow">BRIEFING DU MATIN</div>
            <h1 className="today-title">{dateFormatted}</h1>
            <p className="today-goal-quote">
              <b>Objectif du jour :</b>{' '}
              {store.settings.brandGoal ||
                'Générer des conversations WhatsApp et faire découvrir la sélection NickShop.'}
            </p>
          </div>

          <div className="today-progress-widget">
            <div className="progress-numbers">
              <strong>{completedCount} / {tasks.length}</strong>
              <span>tâches terminées</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <small className="muted">{progressPercent}% du plan quotidien accompli</small>
          </div>
        </div>
      </section>

      {/* Alerte stock faible si existant */}
      {lowStock.length > 0 && (
        <div className="alert-card low-stock-banner">
          <AlertTriangle size={18} />
          <div className="alert-copy">
            <strong>Stock à surveiller</strong>
            <p>
              {lowStock.map(p => `${p.name} (${p.stock} restant${p.stock > 1 ? 's' : ''})`).join(', ')}.
              Évitez de concentrer vos publicités sur un produit proche de la rupture.
            </p>
          </div>
          <button className="button secondary small" onClick={() => navigate('products')}>
            Voir le stock
          </button>
        </div>
      )}

      {/* 2. GRILLE PRINCIPALE : TÂCHES & PUBLICATION DU JOUR */}
      <div className="today-grid">
        {/* COLONNE GAUCHE : LISTE DE TÂCHES ORDONNÉE */}
        <section className="panel tasks-panel">
          <div className="section-heading">
            <div>
              <h2>Que devez-vous faire aujourd’hui ?</h2>
              <p>Progression pas à pas · environ 10 à 25 minutes au total</p>
            </div>
            <span className="badge-count">{tasks.length} actions</span>
          </div>

          <div className="tasks-list">
            {tasks.map((task, index) => {
              const prod = store.products.find(p => p.id === task.productId);
              return (
                <div
                  key={task.id}
                  className={`task-card ${task.completed ? 'completed' : ''}`}
                >
                  <button
                    className="task-toggle"
                    aria-label={task.completed ? 'Marquer non terminée' : 'Marquer terminée'}
                    onClick={() => toggleTask(task.id)}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={22} className="check-icon" />
                    ) : (
                      <Circle size={22} className="circle-icon" />
                    )}
                  </button>

                  <div className="task-content">
                    <div className="task-meta">
                      <span className="task-step">Étape 0{index + 1}</span>
                      {task.platform && <PlatformBadge platform={task.platform as any} />}
                      <span className="task-duration">
                        <Clock size={12} /> ~{task.estimatedMinutes} min
                      </span>
                    </div>

                    <h3 className="task-title">{task.title}</h3>
                    <p className="task-reason">{task.reason}</p>

                    {prod && (
                      <div className="task-product-tag">
                        <ShoppingBag size={13} />
                        <span>{prod.name} ({money(prod.price)})</span>
                      </div>
                    )}

                    <div className="task-actions">
                      {task.actionType === 'post' && task.targetId && (
                        <button
                          className="button small"
                          onClick={() => navigate('studio', task.targetId)}
                        >
                          <PenLine size={13} /> Ouvrir le contenu
                        </button>
                      )}
                      {task.actionType === 'sales' && (
                        <button
                          className="button small"
                          onClick={() => navigate('sales')}
                        >
                          <Plus size={13} /> Saisir les ventes du jour
                        </button>
                      )}
                      {task.actionType === 'whatsapp' && (
                        <button
                          className="button small"
                          onClick={() => {
                            if (task.targetId) navigate('studio', task.targetId);
                            else navigate('studio');
                          }}
                        >
                          <Send size={13} /> Rédiger le statut
                        </button>
                      )}
                      {task.actionType === 'stock' && (
                        <button
                          className="button secondary small"
                          onClick={() => navigate('products')}
                        >
                          Mettre à jour le stock
                        </button>
                      )}

                      {!task.completed && (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => postponeTask(task.id)}
                        >
                          Reporter
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* COLONNE DROITE : LA PUBLICATION DU JOUR & MESURES */}
        <div className="today-sidebar-col">
          {/* CARTE : LA PUBLICATION DU JOUR */}
          <section className="panel spotlight-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">AU PROGRAMME</span>
                <h2>La publication du jour</h2>
              </div>
              {featuredPost && <Status value={featuredPost.status} />}
            </div>

            {featuredPost ? (
              <div className="featured-post-card">
                <div className="spotlight-header">
                  <PlatformBadge platform={featuredPost.platform} />
                  <span className="spotlight-time">
                    <Clock size={13} /> {featuredPost.time}
                  </span>
                  <span className="spotlight-format">{featuredPost.format}</span>
                </div>

                {featuredProduct && (
                  <div className="spotlight-product-row">
                    <div className="spotlight-thumb">
                      <ProductArt product={featuredProduct} />
                    </div>
                    <div>
                      <strong>{featuredProduct.name}</strong>
                      <small>{money(featuredProduct.price)} · {featuredProduct.stock} en stock</small>
                    </div>
                  </div>
                )}

                <div className="spotlight-text-box">
                  <div className="spotlight-text-label">Texte prêt à publier :</div>
                  <p className="spotlight-text">{featuredPost.text}</p>
                </div>

                {featuredPost.visual ? (
                  <div className="spotlight-visual-box">
                    {featuredPost.visual.generatedImageUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-amber-900/20 max-h-52">
                        <img
                          src={featuredPost.visual.generatedImageUrl}
                          alt={featuredPost.visual.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <strong>Idée visuelle : {featuredPost.visual.title}</strong>
                    <p>{featuredPost.visual.scene}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="button highlight-btn small"
                        onClick={() => navigate('visual', featuredPost.productId)}
                      >
                        <Sparkles size={13} /> Ouvrir dans le Générateur visuel IA
                      </button>
                    </div>
                    <details className="mt-2">
                      <summary>Voir le prompt d'image associé</summary>
                      <p className="prompt-text">{featuredPost.visual.prompt}</p>
                    </details>
                  </div>
                ) : (
                  <div className="spotlight-visual-box">
                    <strong>Visuel à préparer</strong>
                    <p className="muted text-xs">Aucun visuel n'est encore associé à ce post.</p>
                    <button
                      className="button highlight-btn small mt-2"
                      onClick={() => navigate('visual', featuredPost.productId)}
                    >
                      <Sparkles size={13} /> Générer l'illustration IA depuis la banque de photos
                    </button>
                  </div>
                )}

                <div className="spotlight-actions">
                  <CopyButton text={featuredPost.text} notify={notify} />
                  <button
                    className="button secondary small"
                    onClick={() => navigate('studio', featuredPost.id)}
                  >
                    <PenLine size={14} /> Modifier
                  </button>
                  {featuredPost.status !== 'Publié' ? (
                    <button
                      className="button small"
                      onClick={() => markPostAsPublished(featuredPost.id)}
                    >
                      <CheckCircle2 size={14} /> Marquer comme publié
                    </button>
                  ) : (
                    <span className="published-badge">
                      <CheckCircle2 size={14} /> Déjà publié
                    </span>
                  )}
                </div>

                <small className="muted note-privacy">
                  Conseil : la copie du texte ne marque pas la publication comme publiée.
                  Marquez-la manuellement une fois mise en ligne sur votre réseau.
                </small>
              </div>
            ) : (
              <div className="spotlight-empty">
                <Sparkles size={28} className="muted-icon" />
                <h3>Aucun contenu prévu aujourd'hui</h3>
                <p>
                  Votre calendrier est libre pour la journée. Préparez un statut
                  WhatsApp ou programmez une publication.
                </p>
                <button className="button" onClick={() => navigate('studio')}>
                  <Plus size={15} /> Créer un contenu
                </button>
              </div>
            )}
          </section>

          {/* CARTE : PROPOSITION DU JOUR BASÉE SUR VOTRE PHOTOTHÈQUE */}
          <section className="panel photobank-proposal-panel mt-6">
            <div className="section-heading">
              <div>
                <span className="eyebrow flex items-center gap-1.5">
                  <Camera size={13} className="gold" />
                  ROULEMENT QUOTIDIEN AUTOMATIQUE
                </span>
                <h2>Proposition du jour (Photothèque)</h2>
              </div>
              <button
                type="button"
                className="text-button text-xs flex items-center gap-1"
                onClick={() => setPhotoOffset(o => o + 1)}
                title="Tirer une autre photo de la banque"
              >
                <RefreshCw size={13} /> Autre flacon
              </button>
            </div>

            {/* Progression vers l'objectif de 40 photos */}
            <div className="photobank-progress-box mb-4 p-3 rounded-lg bg-black/30 border border-amber-900/30">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-amber-200">
                  Photothèque : {dailyProposal.totalPhotos} / {dailyProposal.targetPhotos} photos ({dailyProposal.progressPercent}%)
                </span>
                <span className="text-[11px] muted">
                  {dailyProposal.isFullRotationReady ? '🎉 100% prêt' : `Encore ${dailyProposal.remainingToTarget} pour roulement infini`}
                </span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${dailyProposal.progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] muted mt-1.5 leading-snug">
                {dailyProposal.milestoneStatus}
              </p>
            </div>

            {/* Carte du flacon sélectionné */}
            <div className="proposal-item-card p-3 rounded-lg bg-black/20 border border-white/5">
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-md overflow-hidden bg-black/50 border border-amber-600/30 flex-shrink-0 relative">
                  <img
                    src={dailyProposal.photo.url}
                    alt={dailyProposal.photo.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1 right-1 bg-black/70 text-[9px] px-1 rounded text-amber-300">
                    #{dailyProposal.photoIndex + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/40 mb-1">
                    {dailyProposal.badge}
                  </div>
                  <h3 className="text-sm font-bold truncate leading-tight">
                    {dailyProposal.headline}
                  </h3>
                  <p className="text-xs muted line-clamp-2 mt-0.5">
                    {dailyProposal.subtext}
                  </p>
                  <div className="text-xs gold font-semibold mt-1">
                    {money(dailyProposal.price)} · {dailyProposal.product?.name || dailyProposal.photo.title}
                  </div>
                </div>
              </div>

              {/* Texte WhatsApp préparé */}
              <div className="mt-3 p-2 rounded bg-black/40 border border-white/5 text-xs text-stone-300 max-h-24 overflow-y-auto">
                <div className="font-semibold text-amber-300 text-[11px] mb-1">Texte WhatsApp du jour :</div>
                <p className="whitespace-pre-line text-[11px]">{dailyProposal.copies.WhatsApp}</p>
              </div>

              {/* Boutons d'action rapide */}
              <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-white/5">
                <button
                  type="button"
                  className="button highlight-btn small flex-1"
                  onClick={handleUsePhotoProposalForAffiche}
                >
                  <Sparkles size={13} /> Créer l'affiche avec ce flacon
                </button>

                <CopyButton text={dailyProposal.copies.WhatsApp} notify={notify} />

                <button
                  type="button"
                  className="button secondary small"
                  onClick={handleAddProposalToPlanning}
                  title="Ajouter au planning du jour"
                >
                  <Plus size={13} /> Planifier
                </button>
              </div>
            </div>
          </section>

          {/* CARTE : CE QU'IL FAUT MESURER AUJOURD'HUI */}
          <section className="panel metric-snapshot-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">PILOTAGE COMMERCIAL</span>
                <h2>Que devez-vous mesurer ?</h2>
              </div>
              <button className="text-button" onClick={() => navigate('sales')}>
                Saisir <ChevronRight size={14} />
              </button>
            </div>

            <p className="small-text muted">
              Chaque soir, notez vos commandes réelles et vos conversations pour vérifier
              la rentabilité de votre journée.
            </p>

            <div className="today-metrics-grid">
              <div className="today-metric-tile">
                <span>CA encaissé (aujourd’hui)</span>
                <strong>{money(todayMetrics.encashedRevenue)}</strong>
                <small>{todayMetrics.deliveredCount} commande(s) livrée(s)</small>
              </div>

              <div className="today-metric-tile">
                <span>Pipeline (confirmées)</span>
                <strong>{money(todayMetrics.pipelineValue)}</strong>
                <small>{todayMetrics.pipelineCount} en préparation</small>
              </div>

              <div className="today-metric-tile">
                <span>Conversations WhatsApp</span>
                <strong>{todayMetrics.conversations}</strong>
                <small>prospects reçus</small>
              </div>

              <div className="today-metric-tile">
                <span>Dépenses pub</span>
                <strong>{money(todayMetrics.adSpend)}</strong>
                <small>Meta Ads du jour</small>
              </div>
            </div>

            <div className="snapshot-action">
              <button
                className="button full"
                onClick={() => navigate('sales')}
              >
                <TrendingUp size={15} /> Enregistrer mes résultats du jour (10 min)
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
