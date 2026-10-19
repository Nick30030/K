import test from 'node:test';
import assert from 'node:assert/strict';
import {
  draftCopy,
  buildSchedule,
  metrics,
  computeCommercialMetrics,
  csvExport,
  icsExport,
  conceptsFor,
  localDate,
  getDoualaDate,
  formatDoualaDateFull,
  generateDailyTasks,
  generateLocalAIAnalysis,
  validateBackup
} from '../src/domain.mjs';

const product = {
  id: 'p1',
  name: 'Mon parfum',
  price: 12000,
  cost: 6000,
  description: 'Information vérifiée',
  features: '',
  category: 'Parfum',
  stock: 2,
  active: true,
  photo: ''
};

test('les trois textes conservent les faits sans inventer de livraison ou de remise', () => {
  const copies = draftCopy(product, 'Une idée', 'Naturel', 'Commandez sur WhatsApp');
  for (const platform of ['Facebook', 'TikTok', 'WhatsApp']) {
    assert.match(copies[platform], /Mon parfum/);
    assert.match(copies[platform], /12\s?000/);
    assert.match(copies[platform], /Commandez sur WhatsApp/);
    assert.doesNotMatch(copies[platform], /livraison|remise|gratuit/);
  }
  assert.match(copies.TikTok, /0–3 s/);
});

test('planning : nombre, intervalle et budget publicitaire', () => {
  const p = buildSchedule({
    start: '2026-10-01',
    days: 15,
    perWeek: 7,
    selectedPlatforms: ['Facebook', 'WhatsApp'],
    products: [product],
    goal: 'Commandes',
    budget: 0
  });
  assert.equal(p.length, 15);
  assert.equal(p[0].date, '2026-10-01');
  assert.equal(p.at(-1).date, '2026-10-15');
  assert.ok(p.every(x => !x.paid));
  assert.ok(p.every(x => x.visual.prompt && x.text && x.productId === 'p1'));
});

test('planning sans produits ou plateformes : erreur explicite', () => {
  assert.throws(() =>
    buildSchedule({
      start: '2026-10-01',
      days: 7,
      perWeek: 3,
      selectedPlatforms: [],
      products: [product]
    })
  );
  assert.throws(() =>
    buildSchedule({
      start: '2026-10-01',
      days: 7,
      perWeek: 3,
      selectedPlatforms: ['Facebook'],
      products: []
    })
  );
});

test('indicateurs : divisions par zéro et marge contributive', () => {
  assert.deepEqual(metrics({}), { cpc: null, cpa: null, roas: null, margin: 0 });
  assert.deepEqual(
    metrics({ spend: 10000, conversations: 50, orders: 5, revenue: 60000, cost: 30000 }),
    { cpc: 200, cpa: 2000, roas: 6, margin: 20000 }
  );
});

test('calcul commercial réel : exclusion stricte des commandes annulées du CA encaissé', () => {
  const orders = [
    {
      id: 'o1',
      date: '2026-10-19',
      productId: 'p1',
      productName: 'Mon parfum',
      quantity: 1,
      unitPrice: 12000,
      discount: 0,
      deliveryCost: 1000,
      collectedAmount: 12000,
      status: 'Livrée',
      channel: 'WhatsApp'
    },
    {
      id: 'o2',
      date: '2026-10-19',
      productId: 'p1',
      productName: 'Mon parfum',
      quantity: 1,
      unitPrice: 12000,
      discount: 0,
      deliveryCost: 0,
      collectedAmount: 0,
      status: 'Annulée',
      channel: 'Facebook'
    },
    {
      id: 'o3',
      date: '2026-10-19',
      productId: 'p1',
      productName: 'Mon parfum',
      quantity: 1,
      unitPrice: 12000,
      discount: 0,
      deliveryCost: 0,
      collectedAmount: 0,
      status: 'Commande confirmée',
      channel: 'Publicité Meta Ads'
    }
  ];

  const logs = [{ date: '2026-10-19', spend: 2000, conversations: 10 }];
  const res = computeCommercialMetrics(orders, logs, [product]);

  // Seule o1 est livrée -> CA encaissé = 12 000
  assert.equal(res.encashedRevenue, 12000);
  assert.equal(res.deliveredCount, 1);
  // o3 est dans le pipeline -> 12 000
  assert.equal(res.pipelineValue, 12000);
  assert.equal(res.pipelineCount, 1);
  // o2 est annulée -> exclue du CA
  assert.equal(res.cancelledCount, 1);
  // Marge = 12000 (CA) - 6000 (coût achat) - 1000 (livraison) - 2000 (spend) = 3000
  assert.equal(res.margin, 3000);
  // CPC = 2000 / 10 = 200
  assert.equal(res.cpc, 200);
});

test('fuseau horaire Douala : format de date cohérent', () => {
  const d = new Date(Date.UTC(2026, 9, 19, 10, 0, 0));
  const doualaStr = getDoualaDate(d);
  assert.equal(doualaStr, '2026-10-19');
  const full = formatDoualaDateFull(d);
  assert.match(full, /octobre/i);
});

test('générateur de tâches quotidiennes et assistant IA en 6 volets', () => {
  const store = {
    products: [product],
    posts: [
      {
        id: 'post-1',
        date: '2026-10-19',
        time: '19:00',
        platform: 'Facebook',
        productId: 'p1',
        title: 'Post du soir',
        text: 'Texte',
        type: 'Présentation produit',
        goal: 'Vente',
        format: '4:5',
        cta: 'WhatsApp',
        paid: false,
        status: 'Prêt'
      }
    ],
    tasks: [],
    dailyLogs: []
  };

  const tasks = generateDailyTasks(store, '2026-10-19');
  assert.ok(tasks.length >= 2);
  assert.ok(tasks.some(t => t.actionType === 'post'));
  assert.ok(tasks.some(t => t.actionType === 'sales'));

  const metricsObj = computeCommercialMetrics([], [], [product]);
  const analysis = generateLocalAIAnalysis(metricsObj, [], store.posts, store.products);
  assert.ok(analysis.findings);
  assert.ok(analysis.hypotheses);
  assert.ok(analysis.confidence);
  assert.ok(analysis.missingInfo);
  assert.ok(analysis.recommendation);
  assert.ok(analysis.action);
});

test('CSV échappe les guillemets, préserve les accents et neutralise les formules', () => {
  const p = { date: '2026-10-19', title: '=HYPERLINK("x")', text: 'été; "test"\nsuite' };
  const csv = csvExport([p], []);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /'=HYPERLINK\(""x""\)/);
  assert.match(csv, /été; ""test""\nsuite/);
});

test('ICS : heure du Cameroun convertie en UTC, échappement et pliage UTF-8', () => {
  const ics = icsExport([
    {
      id: '1',
      date: '2026-10-19',
      time: '19:00',
      platform: 'Facebook',
      title: 'Parfum',
      text: 'Texte, test;\nsuite ' + 'é'.repeat(100)
    }
  ]);
  assert.match(ics, /DTSTART:20261019T180000Z/);
  assert.match(ics, /Texte\\, test\\;\\nsuite/);
  assert.ok(
    ics.split('\r\n').every(line => new TextEncoder().encode(line).length <= 75)
  );
});

test('concepts : 3 directions et photo de référence explicitement préservée', () => {
  const c = conceptsFor(product, { platform: 'TikTok' });
  assert.equal(c.length, 3);
  assert.equal(new Set(c.map(c => c.title)).size, 3);
  assert.ok(
    c.every(c => c.prompt.includes('préserver exactement') && c.format.includes('9:16'))
  );
});

test('date locale sans décalage UTC', () => {
  assert.equal(localDate(new Date(2026, 0, 2, 0, 1)), '2026-01-02');
});

test('backup : refuser une structure incomplète ou une image non autorisée', () => {
  assert.throws(() => validateBackup({ version: 1, products: [] }));
  const data = {
    version: 1,
    products: [product],
    posts: [],
    ideas: [],
    contents: [],
    settings: { budget: 0, whatsapp: '', brandGoal: '' },
    results: { spend: 0, conversations: 0, orders: 0, revenue: 0, cost: 0 }
  };
  const val = validateBackup(data);
  assert.equal(val.version, 2);
  assert.ok(Array.isArray(val.orders));
  assert.throws(() =>
    validateBackup({
      ...data,
      products: [{ ...product, photo: 'javascript:alert(1)' }]
    })
  );
});

test('photothèque et prompt multimodal inspiré de la photo de référence', async () => {
  const { defaultPhotoBank, generateVisualPromptFromReference } = await import('../src/domain.mjs');
  const bank = defaultPhotoBank();
  assert.ok(bank.length >= 5);
  assert.ok(bank.some(p => p.category === 'Parfum'));
  assert.ok(bank.some(p => p.category === 'Packaging & Coffret'));

  const prompt = generateVisualPromptFromReference({
    referencePhoto: bank[0],
    postText: 'Disponible dès ce matin à Bonapriso pour vos soirées festives.',
    product,
    platform: 'WhatsApp',
    format: '9:16',
    style: 'Or & Marbre Sombre'
  });

  assert.match(prompt, /NickShop/i);
  assert.match(prompt, /INSPIRATION VISUELLE STRICTE/);
  assert.match(prompt, /Bonapriso/);
  assert.match(prompt, /9:16/);
  assert.match(prompt, /WhatsApp/);
});

test('getDailyPhotoProposal : propose un contenu et une affiche basés sur la photothèque avec suivi de l’objectif 40 photos', async () => {
  const { getDailyPhotoProposal, defaultPhotoBank, PHOTO_BANK_TARGET } = await import('../src/domain.mjs');
  const bank = defaultPhotoBank();
  const fakeStore = {
    photoBank: bank,
    products: [product],
    settings: { whatsapp: '690112233' }
  };

  const proposal = getDailyPhotoProposal(fakeStore, '2026-10-19');
  assert.ok(proposal.photo);
  assert.ok(proposal.headline);
  assert.ok(proposal.badge);
  assert.ok(proposal.copies.WhatsApp.includes('WhatsApp'));
  assert.ok(proposal.copies.Facebook.includes('NickShop'));
  assert.ok(proposal.copies.TikTok.includes('Hook'));
  assert.equal(proposal.targetPhotos, 40);
  assert.equal(proposal.totalPhotos, bank.length);
  assert.equal(typeof proposal.progressPercent, 'number');
  assert.ok(proposal.milestoneStatus.length > 0);

  // Test offset / rotation
  const proposal2 = getDailyPhotoProposal(fakeStore, '2026-10-19', 1);
  assert.ok(proposal2.photo);
});

