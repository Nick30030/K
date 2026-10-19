export const platforms = ['Facebook', 'TikTok', 'WhatsApp'];
export const statuses = ['Idée', 'À rédiger', 'Visuel à créer', 'Prêt', 'Programmé', 'Publié'];
export const contentTypes = [
  'Présentation produit',
  'Promotion commerciale',
  'Témoignage client',
  'Nouvel arrivage',
  'Storytelling',
  'Comparaison de produits',
  'Publication éducative',
  'Offre limitée',
  'Publicité Meta Ads',
  'Conseil beauté & parfum',
  'Réponse objection client',
  'Contenu de confiance'
];

export const orderStatuses = [
  'Nouveau prospect',
  'Commande confirmée',
  'En préparation',
  'Livrée',
  'Annulée',
  'Retournée',
  'En attente de paiement'
];

export const orderChannels = [
  'Facebook',
  'TikTok',
  'WhatsApp',
  'Publicité Meta Ads',
  'Autre'
];

export const uid = () => globalThis.crypto.randomUUID();
export const money = n => new Intl.NumberFormat('fr-CM').format(Number(n) || 0) + ' FCFA';

/**
 * Retourne la date au format YYYY-MM-DD calculée dans le fuseau horaire de Douala (Afrique Centrale).
 */
export function getDoualaDate(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date + (date.includes('T') ? '' : 'T12:00:00')) : date;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Format complet en français avec fuseau Africa/Douala.
 * Ex : "Lundi 19 octobre 2026"
 */
export function formatDoualaDateFull(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date + (date.includes('T') ? '' : 'T12:00:00')) : date;
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Douala',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function localDate(date = new Date()) {
  return getDoualaDate(date);
}

export function draftCopy(product, original, tone, cta, variant = 0) {
  const name = product?.name || 'notre sélection NickShop';
  const price = product ? `Prix : ${money(product.price)}.` : '';
  const detail = [original?.trim(), product?.description].filter(Boolean).join('\n');
  const hooks = tone === 'Persuasif'
    ? [`Votre prochain coup de cœur vous attend chez NickShop.`, `Envie de découvrir ${name} ?`, `Et si c’était votre prochain essentiel ?`]
    : tone === 'Premium'
    ? [`L’élégance, dans les moindres détails.`, `Un moment pour vous avec ${name}.`, `Votre nouvelle signature NickShop.`]
    : [`Et si vous découvriez ${name} ?`, `Un nouveau coup de cœur pour votre quotidien ?`, `Faites une place à ${name}.`];
  const hook = hooks[variant % hooks.length];
  const action = cta || 'Écrivez-nous sur WhatsApp pour commander.';
  return {
    Facebook: `${hook}\n\n${name}\n${detail}\n${price}\n\n${action}\n\n#NickShop #BeautéCameroun #Douala #Yaoundé`,
    TikTok: `HOOK · 0–3 s\n${hook}\n\nPLAN 1 · 3–10 s\nMontrez ${name} en gros plan, dans une lumière naturelle.\nTexte écran : « ${name} »\n\nPLAN 2 · 10–20 s\nPrésentez le flacon et ses détails vérifiés.\nVoix off : « ${detail || name} »\n\nPLAN 3 · 20–25 s\nTexte écran : « ${price} »\n${action}\n\nLÉGENDE\n${name}. ${price} ${action} #NickShop #Cameroun`,
    WhatsApp: `${name} ✨\n${detail}\n${price}\n\n${action}`
  };
}

export function conceptsFor(product, options = {}, variant = 0) {
  const name = product?.name || 'Votre produit';
  const styles = [
    {
      title: 'L’essentiel, sublimé',
      scene: 'Un socle en pierre claire, une lumière latérale douce et des ombres naturelles. Le produit reste au centre.',
      palette: 'Ivoire · sable · noir profond',
      typo: 'Manrope pour les titres, sans-serif lisible pour les détails.',
      why: 'Une composition épurée renforce la lisibilité du produit et la perception de qualité.'
    },
    {
      title: 'Votre rituel, votre signature',
      scene: 'Une scène de coiffeuse lumineuse, un tissu écru et un miroir flouté en arrière-plan. Le flacon au premier plan.',
      palette: 'Crème · brun chaud · or discret',
      typo: 'Un titre éditorial sobre et une typographie sans-serif pour le prix.',
      why: 'La mise en situation aide à se projeter dans un usage quotidien, sans promettre un résultat non vérifié.'
    },
    {
      title: 'Le détail qui fait envie',
      scene: 'Un cadrage rapproché du produit sur fond sombre avec un halo de lumière dorée. Espace négatif à droite pour le texte commercial.',
      palette: 'Noir charbon · ambre · ivoire',
      typo: 'Titre sans-serif semi-gras, prix et appel à l’action très lisibles.',
      why: 'Le contraste attire l’attention dans le fil et donne une place claire au parcours vers WhatsApp.'
    }
  ];
  return styles.map((_, i) => {
    const s = styles[(i + variant) % 3];
    const format = options.format || (options.platform === 'TikTok' ? '9:16 · 1080 × 1920' : '4:5 · 1080 × 1350');
    return {
      ...s,
      id: uid(),
      text: name,
      format,
      prompt: `Photographie commerciale réaliste pour NickShop, parfumerie et beauté au Cameroun. Produit : ${name}. Informations vérifiées : ${product?.description || 'aucune caractéristique supplémentaire fournie'}. ${s.scene} Palette : ${s.palette}. Direction : ${options.style || 'premium accessible'}, ${options.type || 'présentation produit'}. Objectif : ${options.goal || 'générer des conversations WhatsApp'}. Plateforme : ${options.platform || 'Facebook'}. Format : ${format}. Prévoir de l’espace pour ajouter « ${name} »${product ? ` et « ${money(product.price)} »` : ''} en postproduction. ${options.post ? `Contexte éditorial : ${options.post}.` : ''} Si une photo de référence est fournie, préserver exactement la forme, l’étiquette, le logo et les couleurs du flacon. Ne pas inventer de marque, de témoignage, de remise ou de promesse. Aucun texte incrusté généré. Composition élégante, sans surcharge.`
    };
  });
}

export function buildSchedule({
  start,
  days,
  perWeek,
  selectedPlatforms,
  products,
  goal,
  promotion = '',
  budget = 0,
  important = '',
  mix = /** @type {string[]} */ ([])
}) {
  if (!selectedPlatforms.length || !products.length) {
    throw Error('Choisissez une plateforme et au moins un produit actif en stock.');
  }
  const count = Math.max(1, Math.round((days * perWeek) / 7));
  const types = mix.length
    ? mix
    : ['Présentation produit', 'Publication éducative', 'Storytelling', 'Publicité Meta Ads'];

  return Array.from({ length: count }, (_, i) => {
    const date = new Date(start + 'T12:00:00');
    date.setDate(date.getDate() + Math.floor((i * days) / count));
    const product = products[i % products.length];
    const platform = selectedPlatforms[i % selectedPlatforms.length];
    let type = types[i % types.length];
    if (type === 'Publicité Meta Ads' && (platform !== 'Facebook' || !budget)) {
      type = 'Présentation produit';
    }
    const note =
      type === 'Témoignage client'
        ? 'Ajouter uniquement un avis réel avec l’accord du client.'
        : type === 'Promotion commerciale' || type === 'Offre limitée'
        ? promotion || 'Renseigner les conditions réelles de l’offre avant publication.'
        : '';

    return {
      id: uid(),
      date: localDate(date),
      time: platform === 'WhatsApp' ? '18:30' : '19:00',
      platform,
      productId: product.id,
      title: `${type} · ${product.name}`,
      text: draftCopy(product, [note, important].filter(Boolean).join('\n'), 'Naturel', 'Écrivez-nous sur WhatsApp pour commander.')[platform],
      type,
      goal,
      visual: conceptsFor(product, { platform })[0],
      format: platform === 'Facebook' ? '4:5' : '9:16',
      cta: 'Écrivez-nous sur WhatsApp pour commander.',
      paid: type === 'Publicité Meta Ads',
      status: 'Idée',
      demo: false
    };
  });
}

/**
 * Calcul rigoureux des indicateurs commerciaux réels :
 * - Chiffre d'affaires encaissé = commandes ayant le statut "Livrée" (avec montant encaissé)
 * - Commandes confirmées / pipeline = commandes en attente ou préparation (non encore encaissées)
 * - Commandes annulées ou retournées = EXCLUES du CA encaissé
 * - Marge estimée = CA encaissé - Coût d'achat des produits vendus - Coûts de livraison supportés - Dépenses pub
 */
export function computeCommercialMetrics(orders = [], dailyLogs = [], products = [], filter = {}) {
  const { startDate, endDate } = filter;

  // Filtrer les commandes selon la période
  const periodOrders = orders.filter(o => {
    if (startDate && o.date < startDate) return false;
    if (endDate && o.date > endDate) return false;
    return true;
  });

  // Filtrer les logs quotidiens
  const periodLogs = dailyLogs.filter(l => {
    if (startDate && l.date < startDate) return false;
    if (endDate && l.date > endDate) return false;
    return true;
  });

  // Séparer les statuts
  const deliveredOrders = periodOrders.filter(o => o.status === 'Livrée');
  const pipelineOrders = periodOrders.filter(o =>
    ['Commande confirmée', 'En préparation', 'En attente de paiement'].includes(o.status)
  );
  const cancelledOrders = periodOrders.filter(o => ['Annulée', 'Retournée'].includes(o.status));

  // CA encaissé réel
  const encashedRevenue = deliveredOrders.reduce((sum, o) => sum + (Number(o.collectedAmount) || 0), 0);

  // Valeur brute des commandes confirmées (pipeline commercial)
  const pipelineValue = pipelineOrders.reduce((sum, o) => {
    const raw = Number(o.quantity) * Number(o.unitPrice) - (Number(o.discount) || 0);
    return sum + (raw > 0 ? raw : 0);
  }, 0);

  // Produits vendus (uniquement sur commandes livrées/encaissées)
  const productsSold = deliveredOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);

  // Coût des produits vendus (achat unitaire)
  const productCost = deliveredOrders.reduce((sum, o) => {
    const prod = products.find(p => p.id === o.productId);
    const unitCost = Number(prod?.cost) || 0;
    return sum + unitCost * (Number(o.quantity) || 0);
  }, 0);

  // Coût de livraison supporté par NickShop
  const deliveryCost = deliveredOrders.reduce((sum, o) => sum + (Number(o.deliveryCost) || 0), 0);

  // Dépenses publicitaires dans la période
  const adSpend = periodLogs.reduce((sum, l) => sum + (Number(l.spend) || 0), 0);

  // Conversations WhatsApp enregistrées dans la période
  const conversations = periodLogs.reduce((sum, l) => sum + (Number(l.conversations) || 0), 0);

  // CA publicitaire (commandes issues de Meta Ads ou liées à une pub)
  const adAttributedRevenue = deliveredOrders
    .filter(o => o.channel === 'Publicité Meta Ads')
    .reduce((sum, o) => sum + (Number(o.collectedAmount) || 0), 0);

  // Indicateurs dérivés
  const deliveredCount = deliveredOrders.length;
  const averageBasket = deliveredCount > 0 ? encashedRevenue / deliveredCount : null;
  const cpc = conversations > 0 ? adSpend / conversations : null;
  const cpa = deliveredCount > 0 && adSpend > 0 ? adSpend / deliveredCount : null;
  const roas = adSpend > 0 ? adAttributedRevenue / adSpend : null;
  const margin = encashedRevenue - productCost - deliveryCost - adSpend;

  // Répartition par canal
  const channelBreakdown = orderChannels.map(c => {
    const channelOrders = periodOrders.filter(o => o.channel === c);
    const channelDelivered = channelOrders.filter(o => o.status === 'Livrée');
    const channelRev = channelDelivered.reduce((sum, o) => sum + (Number(o.collectedAmount) || 0), 0);
    return {
      channel: c,
      totalOrders: channelOrders.length,
      deliveredOrders: channelDelivered.length,
      revenue: channelRev
    };
  });

  // Top produits vendus
  const productSalesMap = {};
  for (const o of deliveredOrders) {
    if (!productSalesMap[o.productId]) {
      productSalesMap[o.productId] = {
        id: o.productId,
        name: o.productName,
        quantity: 0,
        revenue: 0
      };
    }
    productSalesMap[o.productId].quantity += Number(o.quantity) || 0;
    productSalesMap[o.productId].revenue += Number(o.collectedAmount) || 0;
  }
  const topProducts = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity);

  return {
    encashedRevenue,
    pipelineValue,
    totalOrders: periodOrders.length,
    deliveredCount,
    pipelineCount: pipelineOrders.length,
    cancelledCount: cancelledOrders.length,
    productsSold,
    averageBasket,
    adSpend,
    conversations,
    cpc,
    cpa,
    roas,
    margin,
    productCost,
    deliveryCost,
    adAttributedRevenue,
    channelBreakdown,
    topProducts
  };
}

export function metrics(result) {
  const { spend = 0, conversations = 0, orders = 0, revenue = 0, cost = 0 } = result;
  return {
    cpc: conversations ? spend / conversations : null,
    cpa: orders ? spend / orders : null,
    roas: spend ? revenue / spend : null,
    margin: revenue - cost - spend
  };
}

/**
 * Générateur de tâches quotidiennes ordonnées pour l'écran "Aujourd'hui".
 * Répond aux 5 questions opérationnelles du matin :
 * 1. Date locale
 * 2. Que faire aujourd'hui ?
 * 3. Quel contenu publier ?
 * 4. Quel visuel préparer ?
 * 5. Que mesurer ?
 */
export function generateDailyTasks(store, todayDate = localDate()) {
  const existingTasks = store.tasks || [];
  const todayPosts = store.posts.filter(p => p.date === todayDate && p.status !== 'Publié');
  const overduePosts = store.posts.filter(p => p.date < todayDate && p.status !== 'Publié' && !p.demo);
  const activeProducts = store.products.filter(p => p.active && p.stock > 0);
  const lowStockProducts = store.products.filter(p => p.active && p.stock <= (p.lowStockThreshold || 3));
  const todayLog = (store.dailyLogs || []).find(l => l.date === todayDate);

  const generated = [];

  // Tâche 1 : Publications prévues pour aujourd'hui
  todayPosts.forEach(post => {
    const prod = store.products.find(p => p.id === post.productId);
    generated.push({
      id: `task-post-${post.id}`,
      date: todayDate,
      title: `Publier sur ${post.platform} : « ${post.title} »`,
      platform: post.platform,
      productId: post.productId,
      reason: `Programmé pour aujourd'hui à ${post.time}. Le statut actuel est « ${post.status} ».`,
      estimatedMinutes: post.status === 'Prêt' ? 5 : 15,
      completed: false,
      actionType: 'post',
      targetId: post.id
    });
  });

  // Tâche 2 : Rattrapage si publication en retard
  if (overduePosts.length > 0 && !todayPosts.length) {
    const firstOverdue = overduePosts[0];
    generated.push({
      id: `task-overdue-${firstOverdue.id}`,
      date: todayDate,
      title: `Rattraper le contenu en retard : « ${firstOverdue.title} »`,
      platform: firstOverdue.platform,
      productId: firstOverdue.productId,
      reason: `Initialement prévu le ${firstOverdue.date}. Mettre à jour la date ou publier.`,
      estimatedMinutes: 10,
      completed: false,
      actionType: 'post',
      targetId: firstOverdue.id
    });
  }

  // Tâche 3 : Statut WhatsApp quotidien (crucial pour le e-commerce au Cameroun)
  const hasWhatsappToday = todayPosts.some(p => p.platform === 'WhatsApp');
  if (!hasWhatsappToday && activeProducts.length > 0) {
    const heroProduct = activeProducts[0];
    generated.push({
      id: `task-wa-status-${todayDate}`,
      date: todayDate,
      title: `Partager un statut WhatsApp sur « ${heroProduct.name} »`,
      platform: 'WhatsApp',
      productId: heroProduct.id,
      reason: 'Les statuts WhatsApp génèrent l’essentiel des conversations directes avec votre audience locale.',
      estimatedMinutes: 8,
      completed: false,
      actionType: 'whatsapp',
      targetId: heroProduct.id
    });
  }

  // Tâche 4 : Saisie des résultats commerciaux
  const hasLogged = todayLog && (todayLog.spend > 0 || todayLog.conversations > 0);
  generated.push({
    id: `task-log-sales-${todayDate}`,
    date: todayDate,
    title: 'Enregistrer les commandes et conversations du jour',
    platform: 'Multi-canal',
    reason: '10 minutes quotidiennes permettent d’avoir un ROAS et une marge fiables sans tableur lourd.',
    estimatedMinutes: 10,
    completed: !!hasLogged,
    actionType: 'sales'
  });

  // Tâche 5 : Alerte stock si produits faibles
  if (lowStockProducts.length > 0) {
    const p = lowStockProducts[0];
    generated.push({
      id: `task-stock-${p.id}-${todayDate}`,
      date: todayDate,
      title: `Vérifier le stock de « ${p.name} » (${p.stock} restant${p.stock > 1 ? 's' : ''})`,
      productId: p.id,
      reason: 'Éviter de promouvoir un produit presque épuisé sans réapprovisionnement prévu.',
      estimatedMinutes: 3,
      completed: false,
      actionType: 'stock',
      targetId: p.id
    });
  }

  // Fusionner avec l'état complété par l'utilisateur
  return generated.map(t => {
    const existing = existingTasks.find(e => e.id === t.id);
    return existing ? { ...t, completed: existing.completed } : t;
  });
}

/**
 * Assistant d'analyse IA structuré en 6 volets obligatoires :
 * 1. Ce que montrent les données
 * 2. Les hypothèses possibles
 * 3. Le degré de confiance
 * 4. Les informations manquantes
 * 5. La décision recommandée
 * 6. La prochaine action concrète
 */
export function generateLocalAIAnalysis(commercialMetrics, orders = [], posts = [], products = []) {
  const {
    encashedRevenue,
    deliveredCount,
    adSpend,
    conversations,
    cpc,
    roas,
    margin,
    channelBreakdown,
    topProducts
  } = commercialMetrics;

  const hasOrders = deliveredCount > 0;
  const hasSpend = adSpend > 0;
  const topProd = topProducts[0];
  const bestChannel = [...channelBreakdown].sort((a, b) => b.revenue - a.revenue)[0];

  if (!hasOrders && !hasSpend) {
    return {
      title: 'Historique de départ : collecte nécessaire',
      findings: 'Aucune commande livrée ni dépense publicitaire n’a encore été enregistrée pour cette période.',
      hypotheses: 'Le studio démarre ou les résultats de ces derniers jours n’ont pas encore été renseignés via le module « Mes ventes ».',
      confidence: 'Faible (aucun chiffre commercial réel)',
      missingInfo: 'Coûts d’achat unitaires de vos produits, nombre de conversations WhatsApp et commandes reçues.',
      recommendation: 'Prenez 5 minutes pour enregistrer au moins une commande récente et renseigner les coûts d’achat dans la bibliothèque.',
      action: 'Ouvrir l’onglet « Mes ventes » et saisir vos 2 ou 3 dernières ventes avec leur canal d’origine.'
    };
  }

  return {
    title: `Bilan : ${money(encashedRevenue)} encaissés sur ${deliveredCount} commande(s)`,
    findings: `Le chiffre d’affaires encaissé est de ${money(encashedRevenue)} (${deliveredCount} commande(s) livrée(s)). Dépenses pub enregistrées : ${money(adSpend)}. Conversations WhatsApp : ${conversations}.${topProd ? ` Produit phare : « ${topProd.name} » (${topProd.quantity} vendu(s)).` : ''}${bestChannel?.revenue > 0 ? ` Canal le plus rémunérateur : ${bestChannel.channel}.` : ''}`,
    hypotheses: topProd
      ? `Le produit « ${topProd.name} » bénéficie d’une meilleure réceptivité auprès de votre audience locale, ce qui favorise la conversion.`
      : 'Les premières commandes confirment l’intérêt pour la sélection NickShop.',
    confidence: deliveredCount >= 5 ? 'Moyen (tendance naissante)' : 'Faible (volume inférieur à 5 commandes)',
    missingInfo: [
      products.some(p => !p.cost) ? 'Coût d’achat manquant sur certains produits' : null,
      !hasSpend ? 'Dépenses Meta Ads non renseignées' : null,
      conversations === 0 ? 'Nombre de conversations WhatsApp attribuables inconnu' : null
    ].filter(Boolean).join(' · ') || 'Historique de réachat et taux de retour sur 30 jours.',
    recommendation: roas !== null && roas >= 3
      ? `Le ROAS actuel de ${roas.toFixed(1)}× est encourageant. Vérifiez vos marges réelles avant d’augmenter progressivement le budget.`
      : margin < 0
      ? 'La marge contributive est temporairement négative. Réduisez les dépenses publicitaires ou mettez en avant des produits à plus forte marge.'
      : 'Continuez à privilégier les publications axées sur le passage vers WhatsApp pour valider la rentabilité par canal.',
    action: topProd
      ? `Créer un nouveau contenu de confiance ou conseil parfum sur « ${topProd.name} » dans le studio.`
      : 'Programmer une publication Facebook avec appel direct vers WhatsApp.'
  };
}

export function csvExport(posts, products) {
  const rows = [
    [
      'Date',
      'Heure (Afrique/Douala)',
      'Plateforme',
      'Titre',
      'Produit',
      'Type',
      'Objectif',
      'Texte',
      'Idée visuelle',
      'Prompt',
      'Format',
      'Appel à l’action',
      'Diffusion',
      'Statut'
    ],
    ...posts.map(p => [
      p.date,
      p.time,
      p.platform,
      p.title,
      products.find(x => x.id === p.productId)?.name || '',
      p.type,
      p.goal,
      p.text,
      p.visual?.scene,
      p.visual?.prompt,
      p.format,
      p.cta,
      p.paid ? 'Publicité' : 'Organique',
      p.status
    ])
  ];
  return (
    '\uFEFF' +
    rows
      .map(row =>
        row
          .map(v => '"' + String(v ?? '').replaceAll('"', '""').replace(/^[=+@-]/, "'$&") + '"')
          .join(';')
      )
      .join('\r\n')
  );
}

export function icsExport(posts) {
  const esc = s =>
    String(s || '')
      .replaceAll('\\', '\\\\')
      .replaceAll('\n', '\\n')
      .replaceAll(',', '\\,')
      .replaceAll(';', '\\;');
  const fold = s => {
    const chunks = [];
    let line = '';
    for (const char of s) {
      if (new TextEncoder().encode(line + char).length > 73) {
        chunks.push(line);
        line = ' ' + char;
      } else line += char;
    }
    return [...chunks, line].join('\r\n');
  };
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NickShop//Content Studio//FR',
    ...posts.flatMap(p => {
      const date = new Date(`${p.date}T${p.time || '19:00'}:00+01:00`);
      const utc = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
      return [
        'BEGIN:VEVENT',
        `UID:${esc(p.id)}@nickshop`,
        `DTSTAMP:${utc(new Date())}`,
        `DTSTART:${utc(date)}`,
        `DTEND:${utc(new Date(date.getTime() + 30 * 60000))}`,
        fold(`SUMMARY:${esc(p.platform + ' · ' + p.title)}`),
        fold(`DESCRIPTION:${esc(p.text)}`),
        'END:VEVENT'
      ];
    }),
    'END:VCALENDAR'
  ].join('\r\n');
}

export function validateBackup(data) {
  if (
    !data ||
    (data.version !== 1 && data.version !== 2) ||
    !['products', 'posts', 'contents', 'ideas'].every(k => Array.isArray(data[k])) ||
    !data.settings ||
    typeof data.settings !== 'object' ||
    !data.results ||
    typeof data.results !== 'object'
  ) {
    throw Error('Fichier de sauvegarde NickShop invalide.');
  }

  const str = v => typeof v === 'string';

  if (
    data.products.some(
      p =>
        !p ||
        !str(p.id) ||
        !str(p.name) ||
        !str(p.category) ||
        !str(p.description) ||
        !str(p.features) ||
        !Number.isFinite(p.price) ||
        p.price < 0 ||
        !Number.isInteger(p.stock) ||
        p.stock < 0 ||
        typeof p.active !== 'boolean' ||
        !str(p.photo) ||
        (p.photo && !/^(data:image\/(png|jpeg|webp);base64,|\/src\/assets\/images\/|https?:\/\/)/.test(p.photo))
    )
  ) {
    throw Error('Les produits du fichier sont invalides.');
  }

  if (
    data.posts.some(
      p =>
        !p ||
        !str(p.id) ||
        !str(p.title) ||
        !str(p.text) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(p.date) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time) ||
        !platforms.includes(p.platform) ||
        !statuses.includes(p.status)
    )
  ) {
    throw Error('Les publications du fichier sont invalides.');
  }

  if (
    data.contents.some(c => !c || !str(c.id) || !str(c.text) || !platforms.includes(c.platform)) ||
    data.ideas.some(c => !c || !str(c.id) || !str(c.title) || !str(c.prompt) || !str(c.scene))
  ) {
    throw Error('La bibliothèque du fichier est invalide.');
  }

  // Initialisation sécurisée des nouvelles collections de la version 2 si manquantes
  data.orders = Array.isArray(data.orders) ? data.orders : [];
  data.dailyLogs = Array.isArray(data.dailyLogs) ? data.dailyLogs : [];
  data.tasks = Array.isArray(data.tasks) ? data.tasks : [];
  data.photoBank = Array.isArray(data.photoBank) ? data.photoBank : defaultPhotoBank();
  data.version = 2;

  return data;
}

/**
 * Photothèque officielle initiale de NickShop avec photos de haute qualité.
 */
export function defaultPhotoBank() {
  const today = '2026-10-19';
  return [
    {
      id: 'photo-ref-1',
      title: 'Éclat d’Ambre — Flacon Signature Or & Marbre',
      url: '/src/assets/images/perfume_gold_amber_1792422375641.jpg',
      category: 'Parfum',
      productId: 'demo-1',
      productName: 'Éclat d’Ambre',
      aspectRatio: '1:1',
      styleNotes: 'Flacon octogonal en verre ambré taillé, bouchon cylindrique doré gravé de motifs royaux, posé sur marbre noir avec fines gouttelettes d’eau et reflets or chaleureux.',
      tags: ['ambre', 'or', 'flacon luxe', 'marbre noir', 'parfum', 'signature'],
      created: today,
      demo: true
    },
    {
      id: 'photo-ref-2',
      title: 'Obsidian Noir — Eau de Parfum Intense Homme',
      url: '/src/assets/images/perfume_noir_homme_1792422378481.jpg',
      category: 'Parfum',
      productId: 'demo-2',
      productName: 'Rose de Minuit',
      aspectRatio: '1:1',
      styleNotes: 'Flacon rectangulaire noir obsidienne laqué, bouchon métallique bronze brossé, volute de fumée aromatique délicate, ardoise sombre et bois de cèdre brut.',
      tags: ['noir obsidienne', 'homme', 'intense', 'luxe masculin', 'fumée', 'bois'],
      created: today,
      demo: true
    },
    {
      id: 'photo-ref-3',
      title: 'Sérum Botanique Éclat — Actifs Naturels & Karité',
      url: '/src/assets/images/skincare_serum_dropper_1792422376480.jpg',
      category: 'Soin & Beauté',
      productId: 'demo-3',
      productName: 'Sérum Éclat Vitamine C',
      aspectRatio: '1:1',
      styleNotes: 'Flacon en verre ambré dépoli avec pipette compte-gouttes dorée, texture de beurre de karité frais et fleurs blanches sur pierre beige naturelle, lumière matinale douce.',
      tags: ['sérum', 'karité', 'soin visage', 'ingrédients naturels', 'éclat'],
      created: today,
      demo: true
    },
    {
      id: 'photo-ref-4',
      title: 'Coffret Cadeau Prestige NickShop avec Ruban Satin',
      url: '/src/assets/images/gift_box_packaging_1792422377444.jpg',
      category: 'Packaging & Coffret',
      aspectRatio: '1:1',
      styleNotes: 'Écrin noir mat aux liserés dorés géométriques, nœud en ruban de satin or avec pendentif gravé NickShop, intérieur en velours noir accueillant un flacon d’exception.',
      tags: ['coffret cadeau', 'packaging', 'unboxing', 'fêtes', 'ruban or', 'statut'],
      created: today,
      demo: true
    },
    {
      id: 'photo-ref-5',
      title: 'Élégance Douala — Shooting Lifestyle & Teint Lumineux',
      url: '/src/assets/images/lifestyle_beauty_portrait_1792422378154.jpg',
      category: 'Shooting Lifestyle',
      aspectRatio: '1:1',
      styleNotes: 'Femme camerounaise moderne et élégante en robe émeraude vaporisant délicatement un sillage parfumé au crépuscule sur un balcon de Douala, peau satinée et lumière dorée.',
      tags: ['lifestyle', 'douala', 'femme chic', 'lumière dorée', 'beauté africaine'],
      created: today,
      demo: true
    }
  ];
}

/**
 * Génère un prompt multimodal haute fidélité qui s'inspire directement
 * d'une photo de référence de la banque d'images pour créer une illustration
 * cohérente avec le texte de la publication.
 */
export function generateVisualPromptFromReference({
  referencePhoto,
  postText,
  product,
  platform = 'Facebook',
  format = '1:1',
  style = 'Premium minimaliste'
}) {
  const prodName = product?.name || referencePhoto?.productName || 'Parfum d’exception NickShop';
  const priceStr = product?.price ? `${money(product.price)}` : '';
  const refNotes = referencePhoto?.styleNotes || 'Flacon luxueux en verre ambré avec bouchon doré travaillé';
  const cleanPost = (postText || '').replace(/\s+/g, ' ').trim().slice(0, 300);

  const platformIntent =
    platform === 'WhatsApp'
      ? 'Format vertical statut WhatsApp très attractif, mettant en valeur la disponibilité immédiate et invitant à la commande conversationnelle.'
      : platform === 'TikTok'
      ? 'Esthétique dynamique et cinématique adaptée à un format court TikTok, avec une mise en scène engageante et texturée.'
      : 'Photographie publicitaire soignée pour fil d’actualité Facebook / Instagram, génératrice de désir et de clics.';

  return [
    `Photographie publicitaire commerciale ultra-haute définition pour la marque de beauté de luxe NickShop (Cameroun, Douala/Yaoundé).`,
    `INSPIRATION VISUELLE STRICTE : Prenez comme référence absolue l'image fournie (${referencePhoto?.title || 'photo de référence'}). Conservez scrupuleusement les codes visuels du produit : ${refNotes}.`,
    `COHÉRENCE AVEC LE TEXTE DU POST : L'illustration doit illustrer le message suivant : « ${cleanPost || prodName} ». ${prodName} ${priceStr ? `(${priceStr})` : ''}.`,
    `STYLE ET AMBIANCE : Style ${style}. Éclairage cinématographique chaleureux avec reflets dorés et ombres soyeuses. Décor haut de gamme (marbre noir poli, touches végétales exotiques, lumière dorée de Douala au coucher du soleil).`,
    `CADRAGE & FORMAT : Ratio ${format}. Cadrage centré héroïque avec espace respirant pour l’intégration visuelle du texte. ${platformIntent}`,
    `EXIGENCES DE MARQUE : Préservation intégrale de la forme du flacon, des étiquettes et des détails dorés. Rendu photoréaliste 8k, bokeh délicat d'objectif 85mm f/1.4, zéro artefact, zéro déformation.`
  ].join('\n\n');
}

export const PHOTO_BANK_TARGET = 40;

export const DAILY_THEMES = [
  {
    id: 'arrivage',
    label: 'Arrivage du Jour · Douala',
    badge: '✨ ARRIVAGE DOUALA',
    headlineTemplate: name => `Arrivage Exclusif · ${name}`,
    subtextTemplate: name => `Flacons de ${name} reçus ce matin en boutique. Stock limité, premiers arrivés premiers servis !`,
    hookCopy: name => `Arrivage du matin chez NickShop Douala ! Notre stock de « ${name} » vient d'être réceptionné.`,
    preset: 'luxury_podium'
  },
  {
    id: 'statut_flash',
    label: 'Statut WhatsApp Flash',
    badge: '⚡ DISPONIBLE EN BOUTIQUE',
    headlineTemplate: name => `Disponible Aujourd’hui · ${name}`,
    subtextTemplate: name => `Votre flacon de ${name} est prêt pour expédition immédiate à Douala et Yaoundé. Réservez en 1 clic.`,
    hookCopy: name => `Disponible immédiatement chez NickShop. Livraison express en 24h à Douala et Yaoundé pour « ${name} ».`,
    preset: 'whatsapp_flash'
  },
  {
    id: 'sillage_signature',
    label: 'Coup de Cœur & Sillage',
    badge: '👑 SÉLECTION PRESTIGE',
    headlineTemplate: name => `Sillage Signature · ${name}`,
    subtextTemplate: name => `La fragrance ${name} est envoûtante et conçue pour marquer les esprits toute la journée.`,
    hookCopy: name => `Le parfum signature qui ne passe jamais inaperçu. Tenue garantie toute la journée.`,
    preset: 'luxury_podium'
  },
  {
    id: 'coffret_cadeau',
    label: 'Coffret Cadeau & Packaging',
    badge: '🎁 ÉCRIN DE LUXE',
    headlineTemplate: name => `L’Écrin d’Exception · ${name}`,
    subtextTemplate: name => `Présentation haute couture pour ${name} avec ruban satin doré NickShop. Le cadeau inoubliable.`,
    hookCopy: name => `Faites sensation avec notre coffret prestige NickShop. Unboxing raffiné et élégance assurée.`,
    preset: 'douala_sunset'
  },
  {
    id: 'conseil_expert',
    label: 'Conseil & Secret de Tenue',
    badge: '💡 CONSEIL BEAUTÉ NICKSHOP',
    headlineTemplate: name => `Secret de Longue Tenue · ${name}`,
    subtextTemplate: name => `Vaporisez ${name} sur les points de pulsation après hydratation pour un sillage décuplé.`,
    hookCopy: name => `L'astuce de nos conseillers beauté à Douala pour profiter d'un sillage intense du matin au soir.`,
    preset: 'minimal_studio'
  }
];

/**
 * Génère une proposition quotidienne de contenu et d'affiche
 * basée sur les photos de la banque d'images de l'utilisateur.
 * Fait tourner les photos automatiquement selon la date ou un index manuel.
 */
export function getDailyPhotoProposal(store, dateStr = '', manualOffset = 0) {
  const bank = store?.photoBank && store.photoBank.length > 0 ? store.photoBank : defaultPhotoBank();
  const photoCount = bank.length;

  // Calcul d'un index déterministe basé sur la date du jour pour un roulement quotidien
  let dateSeed = 0;
  if (dateStr) {
    for (let i = 0; i < dateStr.length; i++) {
      dateSeed = (dateSeed * 31 + dateStr.charCodeAt(i)) >>> 0;
    }
  } else {
    dateSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  }

  const selectedIndex = (dateSeed + manualOffset) % photoCount;
  const photo = bank[selectedIndex >= 0 ? selectedIndex : 0];

  // Trouver le produit associé s'il existe
  const product =
    store?.products?.find(p => p.id === photo.productId || p.photoBankId === photo.id) ||
    store?.products?.find(p => p.name.toLowerCase() === photo.title.toLowerCase()) ||
    store?.products?.[0];

  const prodName = product?.name || photo.productName || photo.title || 'Parfum d’Exception';
  const price = product?.price || 18000;
  const priceStr = money(price);

  // Thème du jour (rotatif)
  const themeIndex = (dateSeed + manualOffset) % DAILY_THEMES.length;
  const theme = DAILY_THEMES[themeIndex];

  const headline = theme.headlineTemplate(prodName);
  const subtext = theme.subtextTemplate(prodName);
  const badge = theme.badge;
  const hook = theme.hookCopy(prodName);

  const phone = store?.settings?.whatsapp || '690000000';
  const waLink = `https://wa.me/237${phone.replace(/[^0-9]/g, '')}`;

  // Rédaction des 3 versions adaptées
  const copies = {
    WhatsApp: `${badge}
${headline}

${hook}
✨ ${photo.styleNotes ? photo.styleNotes.slice(0, 100) + '…' : 'Élégance garantie & sillage remarquable.'}

🏷️ Prix : ${priceStr}
📦 Disponible en stock · Livraison express à Douala et Yaoundé.

👉 Réservez directement en répondant à ce statut ou sur WhatsApp : ${waLink}`,

    Facebook: `${headline} — NickShop Douala & Yaoundé

${hook}

Pourquoi vous allez l'adorer :
• Présentation d'exception fidèle à nos standards premium.
• Tenue longue durée testée pour le climat camerounais.
• Prix officiel NickShop : ${priceStr}.

🚚 Livraison rapide à domicile partout à Douala et expédition sécurisée à Yaoundé.

💬 Écrivez-nous sur WhatsApp pour commander : ${waLink}
#NickShop #Douala #Yaounde #ParfumsCameroun #BeauteCameroun`,

    TikTok: `Hook (0-3s) : « Vous cherchez le flacon qui attire tous les compliments à Douala ? »
Scène : Gros plan élégant sur ${prodName}, vaporisation au ralenti avec lumière dorée.
Texte écran : ${prodName} · ${priceStr} chez NickShop Douala.
Voix off : « Disponible dès aujourd'hui chez NickShop avec livraison express. Écrivez-nous sur WhatsApp pour réserver le vôtre ! »
CTA : Lien en bio WhatsApp.`
  };

  const progressPercent = Math.min(100, Math.round((photoCount / PHOTO_BANK_TARGET) * 100));
  const remainingToTarget = Math.max(0, PHOTO_BANK_TARGET - photoCount);

  let milestoneStatus = '';
  if (photoCount >= PHOTO_BANK_TARGET) {
    milestoneStatus = `🎯 Objectif 40 photos atteint (${photoCount} photos enregistrées) ! L'IA dispose d'un stock complet pour un roulement quotidien exclusif sans répétition.`;
  } else if (photoCount >= 20) {
    milestoneStatus = `En bonne voie : ${photoCount} / 40 photos enregistrées (${progressPercent}%). Plus que ${remainingToTarget} photos pour un roulement automatique d'un mois complet sans doublon.`;
  } else {
    milestoneStatus = `Votre photothèque compte ${photoCount} / 40 photos (${progressPercent}%). Ajoutez régulièrement vos flacons ou photos de produits pour enrichir les propositions automatiques quotidiennes.`;
  }

  return {
    photo,
    product,
    theme: theme.label,
    themeId: theme.id,
    badge,
    headline,
    subtext,
    cta: `Commander sur WhatsApp · ${phone}`,
    price,
    copies,
    photoIndex: selectedIndex,
    totalPhotos: photoCount,
    targetPhotos: PHOTO_BANK_TARGET,
    progressPercent,
    remainingToTarget,
    isFullRotationReady: photoCount >= PHOTO_BANK_TARGET,
    milestoneStatus,
    preset: theme.preset
  };
}


