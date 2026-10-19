import type { Store, Order, DailyLog, PhotoBankItem } from './types';
import { localDate, draftCopy, conceptsFor, uid, validateBackup, defaultPhotoBank } from './domain.mjs';

export const STORE_KEY = 'nickshop-studio-v2';
const LEGACY_KEY = 'nickshop-studio-v1';

export function initialStore(): Store {
  const todayStr = localDate();
  const products = [
    {
      id: 'demo-1',
      name: 'Éclat d’Ambre',
      category: 'Parfum',
      brand: 'NickShop Paris-Douala',
      price: 12000,
      cost: 6500,
      variableCosts: 500,
      description: 'Un parfum ambré doux et chaleureux, idéal pour la journée et les sorties.',
      features: 'Notes d’ambre vanillé, tenue 8h+, flacon spray 50 ml.',
      stock: 12,
      lowStockThreshold: 3,
      active: true,
      photo: '/src/assets/images/perfume_gold_amber_1792422375641.jpg',
      photoBankId: 'photo-ref-1',
      updatedAt: todayStr,
      demo: true
    },
    {
      id: 'demo-2',
      name: 'Rose de Minuit & Obsidian',
      category: 'Parfum',
      brand: 'NickShop',
      price: 15000,
      cost: 8000,
      variableCosts: 500,
      description: 'Une eau de parfum florale orientale intense avec un sillage enveloppant.',
      features: 'Notes de rose de Damas et bois précieux. Flacon 100 ml.',
      stock: 8,
      lowStockThreshold: 3,
      active: true,
      photo: '/src/assets/images/perfume_noir_homme_1792422378481.jpg',
      photoBankId: 'photo-ref-2',
      updatedAt: todayStr,
      demo: true
    },
    {
      id: 'demo-3',
      name: 'Sérum Éclat Vitamine C',
      category: 'Soin visage',
      brand: 'NickShop Care',
      price: 8500,
      cost: 4200,
      variableCosts: 300,
      description: 'Sérum booster d’éclat pour uniformiser le teint et hydrater la peau.',
      features: 'Vitamine C pure 10%, acide hyaluronique, texture non grasse.',
      stock: 2, // Stock faible volontaire pour illustrer l'alerte
      lowStockThreshold: 4,
      active: true,
      photo: '/src/assets/images/skincare_serum_dropper_1792422376480.jpg',
      photoBankId: 'photo-ref-3',
      updatedAt: todayStr,
      demo: true
    }
  ];

  const today = new Date();
  const posts = Array.from({ length: 4 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i * 2);
    const p = products[i % 3];
    const platform = (['WhatsApp', 'Facebook', 'TikTok', 'WhatsApp'] as const)[i % 4];
    return {
      id: uid(),
      date: localDate(date),
      time: i === 0 ? '10:00' : '19:00',
      platform,
      productId: p.id,
      title: [
        'Statut du matin : Coup de cœur Éclat d’Ambre',
        'Publication Facebook : Pourquoi choisir un parfum ambré',
        'TikTok démo : 3 pschitts pour tenir toute la journée à Douala',
        'Statut WhatsApp : Derniers flacons Sérum Éclat'
      ][i],
      text: draftCopy(p, '', 'Naturel', 'Écrivez-nous sur WhatsApp pour commander au 690 00 00 00.')[platform],
      type: ['Présentation produit', 'Conseil beauté & parfum', 'Démonstration', 'Offre limitée'][i] || 'Présentation produit',
      goal: 'Générer des conversations WhatsApp',
      visual: conceptsFor(p, { platform })[0],
      format: platform === 'Facebook' ? '4:5' : '9:16',
      cta: 'Écrivez-nous sur WhatsApp pour réserver votre flacon.',
      paid: i === 1,
      status: i === 0 ? 'Prêt' : 'Idée',
      demo: true
    };
  });

  // Commandes de démonstration réalistes illustrant les statuts (livrée = CA encaissé, confirmée = pipeline, annulée = exclue du CA)
  const orders: Order[] = [
    {
      id: 'demo-order-1',
      date: todayStr,
      productId: 'demo-1',
      productName: 'Éclat d’Ambre',
      quantity: 1,
      unitPrice: 12000,
      discount: 0,
      deliveryCost: 1000,
      collectedAmount: 12000,
      status: 'Livrée',
      channel: 'WhatsApp',
      notes: 'Livré à Bonapriso, cliente fidèle',
      demo: true
    },
    {
      id: 'demo-order-2',
      date: todayStr,
      productId: 'demo-2',
      productName: 'Rose de Minuit',
      quantity: 1,
      unitPrice: 15000,
      discount: 1000,
      deliveryCost: 1500,
      collectedAmount: 14000,
      status: 'Livrée',
      channel: 'Publicité Meta Ads',
      notes: 'Livraison express Akwa',
      demo: true
    },
    {
      id: 'demo-order-3',
      date: todayStr,
      productId: 'demo-3',
      productName: 'Sérum Éclat Vitamine C',
      quantity: 1,
      unitPrice: 8500,
      discount: 0,
      deliveryCost: 0,
      collectedAmount: 0,
      status: 'Commande confirmée',
      channel: 'Facebook',
      notes: 'Livraison prévue demain matin',
      demo: true
    },
    {
      id: 'demo-order-4',
      date: todayStr,
      productId: 'demo-1',
      productName: 'Éclat d’Ambre',
      quantity: 1,
      unitPrice: 12000,
      discount: 0,
      deliveryCost: 0,
      collectedAmount: 0,
      status: 'Annulée',
      channel: 'WhatsApp',
      notes: 'Client injoignable au moment de la livraison (non encaissée)',
      demo: true
    }
  ];

  const dailyLogs: DailyLog[] = [
    {
      date: todayStr,
      spend: 5000,
      conversations: 8,
      notes: 'Campagne Meta Ads active sur Rose de Minuit'
    }
  ];

  return {
    version: 2,
    products,
    posts,
    contents: [],
    ideas: [],
    orders,
    dailyLogs,
    tasks: [],
    photoBank: defaultPhotoBank() as unknown as PhotoBankItem[],
    settings: {
      budget: 50000,
      whatsapp: '237690000000',
      brandGoal: 'Développer les conversations qualifiées sur WhatsApp et fidéliser la clientèle de Douala et Yaoundé.',
      externalImageTool: 'https://aistudio.google.com'
    },
    results: {
      spend: 5000,
      conversations: 8,
      orders: 2,
      revenue: 26000,
      cost: 14500
    }
  };
}

export function loadStore(): Store {
  let value = localStorage.getItem(STORE_KEY);
  if (!value) {
    // Tentative de migration depuis la clé précédente
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      value = legacy;
    }
  }
  if (!value) return initialStore();

  try {
    const parsed = JSON.parse(value);
    const validated = validateBackup(parsed) as Store;
    // S'assurer que les tableaux version 2 existent
    validated.orders = validated.orders || [];
    validated.dailyLogs = validated.dailyLogs || [];
    validated.tasks = validated.tasks || [];
    validated.photoBank = (Array.isArray(validated.photoBank) && validated.photoBank.length > 0)
      ? validated.photoBank
      : (defaultPhotoBank() as unknown as PhotoBankItem[]);
    return validated;
  } catch (err) {
    console.warn('Erreur lecture store, fallback initialStore:', err);
    return initialStore();
  }
}
