export type Platform = 'Facebook' | 'TikTok' | 'WhatsApp';

export type Product = {
  id: string;
  name: string;
  category: string;
  brand?: string;
  price: number;
  cost?: number;
  variableCosts?: number;
  description: string;
  features: string;
  stock: number;
  lowStockThreshold?: number;
  active: boolean;
  photo: string;
  photoBankId?: string;
  updatedAt?: string;
  demo?: boolean;
};

export type Concept = {
  id: string;
  title: string;
  scene: string;
  palette: string;
  typo: string;
  why: string;
  text: string;
  format: string;
  prompt: string;
  productId?: string;
  referencePhotoId?: string;
  referencePhotoUrl?: string;
  generatedImageUrl?: string;
  demo?: boolean;
};

export type PostStatus = 'Idée' | 'À rédiger' | 'Visuel à créer' | 'Prêt' | 'Programmé' | 'Publié';

export type Post = {
  id: string;
  date: string;
  time: string;
  platform: Platform;
  productId: string;
  title: string;
  text: string;
  type: string;
  goal: string;
  visual?: Concept;
  format: string;
  cta: string;
  paid: boolean;
  status: string;
  publishedAt?: string;
  results?: {
    conversations?: number;
    orders?: number;
    revenue?: number;
  };
  demo?: boolean;
};

export type Content = {
  id: string;
  platform: Platform;
  text: string;
  productId: string;
  created: string;
  demo?: boolean;
};

export type OrderStatus =
  | 'Nouveau prospect'
  | 'Commande confirmée'
  | 'En préparation'
  | 'Livrée'
  | 'Annulée'
  | 'Retournée'
  | 'En attente de paiement';

export type OrderChannel = 'Facebook' | 'TikTok' | 'WhatsApp' | 'Publicité Meta Ads' | 'Autre';

export type Order = {
  id: string;
  date: string; // YYYY-MM-DD (Africa/Douala)
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  deliveryCost: number;
  collectedAmount: number;
  status: OrderStatus;
  channel: OrderChannel;
  postId?: string;
  notes?: string;
  demo?: boolean;
};

export type DailyLog = {
  date: string; // YYYY-MM-DD
  spend: number;
  conversations: number;
  notes?: string;
};

export type DailyTask = {
  id: string;
  date: string;
  title: string;
  platform?: Platform | 'Multi-canal';
  productId?: string;
  reason: string;
  estimatedMinutes: number;
  completed: boolean;
  actionType: 'post' | 'sales' | 'visual' | 'stock' | 'review' | 'whatsapp' | 'photobank';
  targetId?: string;
};

export type PhotoCategory =
  | 'Parfum'
  | 'Soin & Beauté'
  | 'Packaging & Coffret'
  | 'Shooting Lifestyle'
  | 'Statut & Promo';

export type PhotoBankItem = {
  id: string;
  title: string;
  url: string;
  category: PhotoCategory;
  tags: string[];
  productId?: string;
  productName?: string;
  styleNotes: string;
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9';
  created: string;
  isAiGenerated?: boolean;
  demo?: boolean;
};

export type Store = {
  version: 1 | 2;
  products: Product[];
  posts: Post[];
  contents: Content[];
  ideas: Concept[];
  orders: Order[];
  dailyLogs: DailyLog[];
  tasks: DailyTask[];
  photoBank: PhotoBankItem[];
  settings: {
    budget: number;
    whatsapp: string;
    brandGoal: string;
    externalImageTool?: string;
  };
  results: {
    spend: number;
    conversations: number;
    orders: number;
    revenue: number;
    cost: number;
  };
};
