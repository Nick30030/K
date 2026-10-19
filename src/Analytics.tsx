import { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  MessageCircle,
  Megaphone,
  Sparkles,
  PieChart,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { type Shared, Empty } from './ui';
import {
  computeCommercialMetrics,
  generateLocalAIAnalysis,
  getDoualaDate,
  money
} from './domain.mjs';

type PeriodOption = 'today' | '7days' | '30days' | 'month' | 'all';

export default function Analytics({ store, navigate }: Shared) {
  const [period, setPeriod] = useState<PeriodOption>('all');
  const todayStr = getDoualaDate();

  // Définir la plage de dates selon la période
  const dateRange = useMemo(() => {
    const today = new Date(todayStr + 'T12:00:00');
    if (period === 'today') {
      return { startDate: todayStr, endDate: todayStr, label: "Aujourd'hui" };
    }
    if (period === '7days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { startDate: getDoualaDate(d), endDate: todayStr, label: '7 derniers jours' };
    }
    if (period === '30days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { startDate: getDoualaDate(d), endDate: todayStr, label: '30 derniers jours' };
    }
    if (period === 'month') {
      const startOfMonth = todayStr.slice(0, 7) + '-01';
      return { startDate: startOfMonth, endDate: todayStr, label: 'Mois en cours' };
    }
    return { startDate: undefined, endDate: undefined, label: 'Toutes les données' };
  }, [period, todayStr]);

  // Calcul des métriques commerciales
  const metrics = useMemo(() => {
    return computeCommercialMetrics(
      store.orders || [],
      store.dailyLogs || [],
      store.products || [],
      dateRange
    );
  }, [store.orders, store.dailyLogs, store.products, dateRange]);

  // Analyse IA en 6 volets
  const aiAnalysis = useMemo(() => {
    return generateLocalAIAnalysis(
      metrics,
      store.orders || [],
      store.posts || [],
      store.products || []
    );
  }, [metrics, store.orders, store.posts, store.products]);

  return (
    <div className="analytics-view">
      {/* EN-TÊTE DE LA PAGE */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">PILOTAGE & DÉCISIONS ÉCLAIRÉES</div>
          <h1>Tableau de bord commercial & Analyse IA<span className="gold">.</span></h1>
          <p>
            Analyse rigoureuse de vos ventes réelles, rentabilité publicitaire et
            recommandations stratégiques.
          </p>
        </div>

        {/* SÉLECTEUR DE PÉRIODE */}
        <div className="tabs">
          {[
            ['today', 'Aujourd’hui'],
            ['7days', '7 jours'],
            ['30days', '30 jours'],
            ['month', 'Ce mois'],
            ['all', 'Tout']
          ].map(([key, label]) => (
            <button
              key={key}
              className={period === key ? 'active' : ''}
              onClick={() => setPeriod(key as PeriodOption)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* BANDEAU D'EXPLICATION DES FORMULES & LIMITES */}
      <div className="info-banner mb-6">
        <Info size={18} />
        <div>
          <b>Transparence commerciale :</b> Le chiffre d'affaires n'est pas le bénéfice.
          Le CA encaissé ne retient que les commandes avec statut « Livrée ». Les commandes
          confirmées en attente constituent le pipeline. Les annulations sont exclues.
        </div>
      </div>

      {/* SECTION 1 : ASSISTANT D'ANALYSE IA EN 6 VOLETS */}
      <section className="panel ai-analysis-card mb-7">
        <div className="section-heading">
          <div className="flex items-center gap-2">
            <span className="icon-ai-sparkle">✧</span>
            <h2>Assistant d’analyse commerciale IA</h2>
          </div>
          <span className="confidence-chip">
            Degré de confiance : <b>{aiAnalysis.confidence}</b>
          </span>
        </div>

        <h3 className="ai-analysis-headline">{aiAnalysis.title}</h3>

        <div className="ai-six-grid">
          {/* 1. Constat */}
          <div className="ai-pillar">
            <span className="pillar-tag">1. Ce que montrent les données</span>
            <p>{aiAnalysis.findings}</p>
          </div>

          {/* 2. Hypothèses */}
          <div className="ai-pillar">
            <span className="pillar-tag">2. Hypothèses possibles</span>
            <p>{aiAnalysis.hypotheses}</p>
          </div>

          {/* 3. Données manquantes */}
          <div className="ai-pillar">
            <span className="pillar-tag">3. Informations manquantes</span>
            <p className="text-amber-800">{aiAnalysis.missingInfo}</p>
          </div>

          {/* 4. Décision recommandée */}
          <div className="ai-pillar highlight-pillar">
            <span className="pillar-tag">4. Décision recommandée</span>
            <p><strong>{aiAnalysis.recommendation}</strong></p>
          </div>

          {/* 5. Action concrète */}
          <div className="ai-pillar action-pillar">
            <span className="pillar-tag">5. Prochaine action concrète</span>
            <p>{aiAnalysis.action}</p>
            <button
              className="button small mt-2"
              onClick={() => navigate('studio')}
            >
              Passer à l’action <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2 : GRILLE D'INDICATEURS COMMERCIAUX */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>CA encaissé réel</span>
            <DollarSign size={17} />
          </div>
          <strong className="text-emerald-700">{money(metrics.encashedRevenue)}</strong>
          <small>{metrics.deliveredCount} commande(s) livrée(s) · {metrics.productsSold} article(s)</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Pipeline confirmées</span>
            <ShoppingBag size={17} />
          </div>
          <strong>{money(metrics.pipelineValue)}</strong>
          <small>{metrics.pipelineCount} commande(s) en préparation</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Panier moyen encaissé</span>
            <ShoppingBag size={17} />
          </div>
          <strong>{metrics.averageBasket ? money(metrics.averageBasket) : '—'}</strong>
          <small>par commande livrée</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Dépenses Meta Ads</span>
            <Megaphone size={17} />
          </div>
          <strong>{money(metrics.adSpend)}</strong>
          <small>{metrics.conversations} conversation(s) reçue(s)</small>
        </div>
      </div>

      {/* SECTION 3 : INDICATEURS DE RENTABILITÉ & ROAS */}
      <div className="dashboard-columns mb-6">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Efficacité publicitaire & ROAS</h2>
              <p>Évaluation des dépenses Meta Ads vs résultats vérifiés</p>
            </div>
            <Megaphone size={19} className="text-slate-400" />
          </div>

          <div className="profitability-grid">
            <div className="profit-tile">
              <span>Coût par conversation</span>
              <strong>{metrics.cpc !== null ? money(metrics.cpc) : '—'}</strong>
              <small>Dépenses ÷ conversations WhatsApp</small>
            </div>

            <div className="profit-tile">
              <span>Coût par commande (CPA)</span>
              <strong>{metrics.cpa !== null ? money(metrics.cpa) : '—'}</strong>
              <small>Dépenses ÷ commandes livrées</small>
            </div>

            <div className="profit-tile">
              <span>ROAS publicitaire</span>
              <strong className={metrics.roas && metrics.roas >= 3 ? 'text-emerald-700' : ''}>
                {metrics.roas !== null ? `${metrics.roas.toFixed(2)}×` : '—'}
              </strong>
              <small>CA attribué aux pubs ÷ dépenses pub</small>
            </div>

            <div className="profit-tile">
              <span>Marge contributive estimée</span>
              <strong className={metrics.margin >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                {money(metrics.margin)}
              </strong>
              <small>CA encaissé − coûts d’achat − livraison − pub</small>
            </div>
          </div>

          <div className="subtle-note mt-4">
            <b>Formule :</b> Marge contributive = {money(metrics.encashedRevenue)} (CA) −{' '}
            {money(metrics.productCost)} (Achat) − {money(metrics.deliveryCost)} (Livraison supportée) −{' '}
            {money(metrics.adSpend)} (Dépenses pub) = <b>{money(metrics.margin)}</b>.
          </div>
        </section>

        {/* RÉPARTITION PAR CANAL */}
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Ventes par canal d'origine</h2>
              <p>D'où proviennent vos commandes encaissées ?</p>
            </div>
            <PieChart size={19} className="text-slate-400" />
          </div>

          <div className="channel-bars-list">
            {metrics.channelBreakdown.map(c => {
              const share =
                metrics.encashedRevenue > 0
                  ? Math.round((c.revenue / metrics.encashedRevenue) * 100)
                  : 0;

              return (
                <div key={c.channel} className="channel-bar-item">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">{c.channel}</span>
                    <span className="text-slate-500">
                      {money(c.revenue)} ({c.deliveredOrders} livrée{c.deliveredOrders > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="subtle-note mt-5">
            Seules les commandes marquées comme « Livrée » sont comptabilisées dans le chiffre
            d'affaires par canal.
          </div>
        </section>
      </div>

      {/* SECTION 4 : PALMARÈS DES PRODUITS LES PLUS VENDUS */}
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Palmarès des produits les plus vendus</h2>
            <p>Identifiez les parfums et soins qui tirent votre rentabilité</p>
          </div>
          <button className="text-button" onClick={() => navigate('products')}>
            Voir le catalogue complet <ArrowRight size={14} />
          </button>
        </div>

        {metrics.topProducts.length > 0 ? (
          <div className="top-products-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Produit</th>
                  <th>Unités livrées</th>
                  <th>Chiffre d’affaires encaissé</th>
                  <th>Coût d'achat unitaire renseigné</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topProducts.map((p, idx) => {
                  const prod = store.products.find(prod => prod.id === p.id);
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="rank-badge">0{idx + 1}</span>
                      </td>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>{p.quantity} unité(s)</td>
                      <td>
                        <strong className="text-emerald-700">{money(p.revenue)}</strong>
                      </td>
                      <td>
                        {prod?.cost ? (
                          money(prod.cost)
                        ) : (
                          <span className="text-amber-700 text-xs">Non renseigné</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Aucune vente encaissée sur cette période"
            description="Enregistrez vos premières commandes livrées dans « Mes ventes » pour afficher ce palmarès."
          />
        )}
      </section>
    </div>
  );
}
