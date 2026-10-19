import { useState, useEffect, useCallback } from 'react';
import {
  Sun,
  PenTool,
  Image,
  CalendarDays,
  Package,
  Library as LibraryIcon,
  Settings as SettingsIcon,
  Menu,
  X,
  ChevronDown,
  ArrowUpRight,
  Check,
  AlertTriangle,
  CloudUpload,
  HelpCircle,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Camera
} from 'lucide-react';
import Today from './Today';
import Sales from './Sales';
import Analytics from './Analytics';
import Dashboard from './Dashboard';
import Products from './Products';
import Studio, { VisualStudio, type Context } from './Studio';
import Calendar from './Calendar';
import Library from './Library';
import Settings from './Settings';
import PhotoBank from './PhotoBank';
import { loadStore, initialStore, STORE_KEY } from './store';
import type { Store } from './types';
import { Modal, Download } from './ui';

const navigation = [
  { id: 'today', label: 'Aujourd’hui', icon: Sun },
  { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
  { id: 'studio', label: 'Créer du contenu', icon: PenTool },
  { id: 'visual', label: 'Générateur visuel', icon: Image },
  { id: 'photobank', label: 'Banque de photos', icon: Camera },
  { id: 'products', label: 'Mes produits', icon: Package },
  { id: 'sales', label: 'Mes ventes', icon: DollarSign },
  { id: 'analytics', label: 'Analyse & IA', icon: TrendingUp },
  { id: 'library', label: 'Bibliothèque', icon: LibraryIcon },
  { id: 'settings', label: 'Paramètres', icon: SettingsIcon }
];

export default function App() {
  const [loaded] = useState(() => {
    try {
      return { store: loadStore(), error: '' };
    } catch {
      return {
        store: initialStore(),
        error:
          'La sauvegarde locale est illisible. Elle reste conservée. Exportez-la avant de la remplacer.'
      };
    }
  });

  const [store, setStore] = useState<Store>(loaded.store);
  const [loadError, setLoadError] = useState(loaded.error);
  const [page, setPage] = useState(() => {
    const p = new URLSearchParams(location.search).get('page');
    if (p === 'dashboard') return 'today';
    return p || 'today';
  });

  const [context, setContext] = useState<Context>({});
  const [contextKey, setContextKey] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState('');
  const [saveError, setSaveError] = useState('');
  const [help, setHelp] = useState(false);

  const notify = useCallback((text: string) => setToast(text), []);
  const update = useCallback((fn: (s: Store) => Store) => setStore(fn), []);

  const navigate = useCallback(
    (next: string, id?: string) => {
      let targetPage = next === 'dashboard' ? 'today' : next;
      let nextContext: Context = {};
      if (id) {
        if (store.posts.some(p => p.id === id)) nextContext = { postId: id };
        else if (store.contents.some(c => c.id === id)) nextContext = { contentId: id };
        else nextContext = { productId: id };
      }
      setContext(nextContext);
      setContextKey(k => k+1);
      setPage(targetPage);
      setMobile(false);
      const url = new URL(location.href);
      url.searchParams.set('page', targetPage);
      history.pushState({}, '', url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [store.posts, store.contents]
  );

  useEffect(() => {
    const back = () => {
      const p = new URLSearchParams(location.search).get('page') || 'today';
      setPage(p === 'dashboard' ? 'today' : p);
      setContext({});
      setContextKey(k => k + 1);
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, []);

  useEffect(() => {
    if (loadError) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
      setSaveError('');
    } catch {
      setSaveError(
        'Stockage saturé ou indisponible. Vos changements ne sont pas enregistrés : exportez une sauvegarde dans Paramètres.'
      );
    }
  }, [store, loadError]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const props = { store, update, notify, navigate };
  const active = navigation.find(x => x.id === page) || navigation[0];
  const ActiveIcon = active.icon;

  const hasDemo =
    store.products.some(p => p.demo) ||
    store.posts.some(p => p.demo) ||
    (store.orders || []).some(o => o.demo);

  return (
    <div className="app-shell">
      {mobile && <div className="nav-scrim" onClick={() => setMobile(false)} />}

      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <a
          className="brand"
          href="?page=today"
          onClick={e => {
            e.preventDefault();
            navigate('today');
          }}
        >
          <span className="brand-mark">
            N<span>✦</span>
          </span>
          <span>
            <strong>
              nickshop<span>.</span>
            </strong>
            <small>CONTENT STUDIO</small>
          </span>
        </a>

        <button className="workspace-switch" onClick={() => navigate('settings')}>
          <span className="workspace-avatar">N</span>
          <span>
            <strong>Espace NickShop</strong>
            <small>Votre atelier de pilotage</small>
          </span>
          <ChevronDown size={15} />
        </button>

        <div className="nav-caption">PILOTAGE QUOTIDIEN</div>
        <nav>
          {navigation.map((item, i) => (
            <button
              key={item.id}
              className={`${page === item.id ? 'active' : ''} ${
                item.id === 'settings' ? 'settings-nav' : ''
              }`}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.id === 'studio' && <span className="nav-ai">✧</span>}
              {item.id === 'today' && <span className="nav-today-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-tip">
          <span className="tip-icon">✧</span>
          <strong>Le rituel du matin</strong>
          <p>
            Ouvrez « Aujourd'hui » pour connaître votre publication du jour et vos 3
            actions prioritaires.
          </p>
          <button onClick={() => navigate('today')}>
            Voir mon briefing <ArrowUpRight size={15} />
          </button>
        </div>

        <button className="sidebar-user" onClick={() => navigate('settings')}>
          <span className="user-avatar">NS</span>
          <span>
            <strong>NickShop</strong>
            <small>Douala · Cameroun · FCFA</small>
          </span>
          <SettingsIcon size={16} />
        </button>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Ouvrir la navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb-root">NickShop Studio</span>
            <span className="breadcrumb-slash">/</span>
            <span>
              <ActiveIcon size={14} />
              {active.label}
            </span>
          </div>

          <div className="topbar-right">
            <span className="saved-state">
              <CloudUpload size={15} />
              {saveError || loadError ? 'Sauvegarde à vérifier' : 'Sauvegarde locale'}
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              aria-label="Aide et fonctionnement"
              onClick={() => setHelp(true)}
            >
              <HelpCircle size={19} />
            </button>
            <button
              className="user-avatar"
              aria-label="Paramètres du compte"
              onClick={() => navigate('settings')}
            >
              N
            </button>
          </div>
        </header>

        <main>
          {(saveError || loadError) && (
            <div className="error-banner">
              <AlertTriangle size={20} />
              <div>
                {saveError || loadError}
                {loadError && (
                  <div className="button-group">
                    <button
                      className="text-button"
                      onClick={() =>
                        Download(
                          'nickshop-sauvegarde-a-recuperer.txt',
                          localStorage.getItem(STORE_KEY) || '',
                          'text/plain'
                        )
                      }
                    >
                      Exporter les données originales
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        if (
                          confirm(
                            'Remplacer la sauvegarde illisible par les données actuellement affichées ?'
                          )
                        )
                          setLoadError('');
                      }}
                    >
                      Remplacer la sauvegarde
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasDemo && (
            <div className="demo-banner">
              <span>
                <Sparkles size={13} /> Espace d’exemple et démonstration · Les produits et
                commandes étiquetés « Démo » illustrent le fonctionnement.
              </span>
              <button onClick={() => navigate('settings')}>
                Personnaliser avec mes vraies données <ArrowUpRight size={13} />
              </button>
            </div>
          )}

          {page === 'today' || page === 'dashboard' ? (
            <Today {...props} />
          ) : page === 'calendar' ? (
            <Calendar key={contextKey} {...props} context={context} />
          ) : page === 'studio' ? (
            <Studio key={contextKey} {...props} context={context} />
          ) : page === 'visual' ? (
            <VisualStudio key={contextKey} {...props} context={context} />
          ) : page === 'photobank' ? (
            <PhotoBank {...props} />
          ) : page === 'products' ? (
            <Products {...props} />
          ) : page === 'sales' ? (
            <Sales {...props} />
          ) : page === 'analytics' ? (
            <Analytics {...props} />
          ) : page === 'library' ? (
            <Library {...props} />
          ) : page === 'settings' ? (
            <Settings {...props} />
          ) : (
            <Today {...props} />
          )}

          <footer className="page-footer">
            <span>NickShop Content Studio · Système de pilotage commercial et marketing.</span>
            <span>DOUALA & YAOUNDÉ · CAMEROUN · FCFA</span>
          </footer>
        </main>
      </div>

      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            aria-label="Fermer la notification"
            onClick={() => setToast('')}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {help && (
        <Modal title="Bienvenue dans NickShop Content Studio" onClose={() => setHelp(false)}>
          <div className="help-copy">
            <p>
              <b>1. Votre routine matinale : « Aujourd’hui »</b><br />
              Consultez la date locale de Douala, les 3 à 5 tâches prioritaires du jour et
              la publication prête à copier pour vos réseaux (Facebook, TikTok, WhatsApp).
            </p>
            <p>
              <b>2. Enregistrez vos ventes quotidiennes (10 min) : « Mes ventes »</b><br />
              Notez vos commandes reçues, leur statut (livrée, confirmée, annulée) et vos
              dépenses publicitaires. Les commandes annulées ne gonflent pas artificiellement
              votre chiffre d’affaires.
            </p>
            <p>
              <b>3. Suivez votre rentabilité : « Analyse & IA »</b><br />
              Accédez à vos marges contributives réelles, vos coûts par conversation et
              votre ROAS. L'assistant IA examine vos résultats selon un cadre rigoureux en 6
              volets.
            </p>
            <p>
              <b>4. Confidentialité et sauvegarde</b><br />
              Vos données restent enregistrées localement dans ce navigateur. Exportez
              régulièrement un fichier de sauvegarde dans « Paramètres ».
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
