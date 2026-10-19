import { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Download as DownloadIcon,
  Upload,
  ExternalLink,
  CheckCircle2,
  Unplug,
  Trash2,
  Sparkles
} from 'lucide-react';
import { type Shared, Field, Download, Modal } from './ui';
import { validateBackup } from './domain.mjs';
import type { Store } from './types';

export default function Settings({ store, update, notify }: Shared) {
  const [settings, setSettings] = useState(store.settings);
  const [status, setStatus] = useState({ textAI: false });
  const [apiKey, setApiKey] = useState('');
  const [keyBusy, setKeyBusy] = useState(false);
  const [reset, setReset] = useState(false);
  const [imported, setImported] = useState<Store | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">VOTRE MARQUE, VOS RÈGLES</div>
          <h1>Les paramètres du studio<span className="gold">.</span></h1>
          <p>Configurez vos coordonnées commerciales, vos budgets et vos outils externes.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* PARAMÈTRES NICKSHOP */}
        <form
          className="panel settings-panel"
          onSubmit={e => {
            e.preventDefault();
            update(s => ({ ...s, settings }));
            notify('Paramètres enregistrés.');
          }}
        >
          <h2>L’identité NickShop</h2>
          <p className="muted">Premium accessible · Beauté & parfums · Cameroun</p>

          <Field label="Objectif principal de la marque">
            <textarea
              rows={3}
              required
              maxLength={500}
              value={settings.brandGoal}
              onChange={e => setSettings({ ...settings, brandGoal: e.target.value })}
            />
          </Field>

          <Field
            label="Numéro WhatsApp Business"
            hint="Format international, sans + ni espaces. Exemple : 237 suivi de 9 chiffres."
          >
            <input
              type="tel"
              pattern="[1-9][0-9]{7,14}"
              placeholder="237…"
              value={settings.whatsapp}
              onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
            />
          </Field>

          {settings.whatsapp && /^[1-9][0-9]{7,14}$/.test(settings.whatsapp) && (
            <a
              className="text-button"
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              Tester le lien WhatsApp <ExternalLink size={14} />
            </a>
          )}

          <Field label="Budget publicitaire mensuel (FCFA)">
            <input
              type="number"
              min="0"
              step="1"
              required
              value={settings.budget}
              onChange={e => setSettings({ ...settings, budget: Number(e.target.value) })}
            />
          </Field>

          <Field
            label="Générateur d’images externe (Mode A gratuit)"
            hint="Lien vers l’outil où vous collez les prompts générés par le studio (Google AI Studio, etc.)."
          >
            <input
              type="url"
              value={settings.externalImageTool || 'https://aistudio.google.com'}
              onChange={e => setSettings({ ...settings, externalImageTool: e.target.value })}
              placeholder="https://aistudio.google.com"
            />
          </Field>

          <button className="button">Enregistrer les paramètres</button>
        </form>

        {/* CONNEXIONS & SERVICES */}
        <section className="panel settings-panel">
          <h2>Connexions & confidentialité</h2>

          <div className="integration-row">
            <span className="integration-symbol">✧</span>
            <div>
              <strong>Gemini · rédaction & concepts</strong>
              <small>
                {status.textAI
                  ? 'Clé configurée côté serveur'
                  : 'Non connecté · modèles locaux disponibles'}
              </small>
            </div>
            {status.textAI ? <CheckCircle2 size={19} /> : <Unplug size={19} />}
          </div>

          <div className="integration-row">
            <span className="integration-symbol">◈</span>
            <div>
              <strong>Génération d’images externe (Mode A gratuit)</strong>
              <small>Génération de prompts + lien direct vers Google AI Studio</small>
            </div>
            <CheckCircle2 size={19} />
          </div>

          <div className="integration-row">
            <span className="integration-symbol">↗</span>
            <div>
              <strong>Réseaux sociaux (Facebook, TikTok, WhatsApp)</strong>
              <small>Publication manuelle par vos soins · aucun accès tiers requis</small>
            </div>
            <ShieldCheck size={19} />
          </div>

          <div className="integration-row">
            <ShieldCheck size={23} />
            <div>
              <strong>Stockage des données</strong>
              <small>Local dans ce navigateur · compatible migration Supabase</small>
            </div>
          </div>

          {window.nickshopDesktop && (
            <form
              className="desktop-ai-form"
              onSubmit={async e => {
                e.preventDefault();
                setKeyBusy(true);
                try {
                  const result = await window.nickshopDesktop!.setGeminiKey(apiKey);
                  setStatus({ textAI: result.configured });
                  setApiKey('');
                  notify(
                    result.configured
                      ? 'Clé enregistrée avec le chiffrement Windows.'
                      : 'Clé Gemini retirée.'
                  );
                } catch (err) {
                  notify((err as Error).message);
                } finally {
                  setKeyBusy(false);
                }
              }}
            >
              <Field
                label="Clé API Gemini (Windows)"
                hint="Enregistrée chiffrée par le système sur cet ordinateur."
              >
                <input
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Collez votre clé Gemini"
                  maxLength={512}
                />
              </Field>
              <div className="button-group">
                <button
                  className="button small"
                  disabled={keyBusy || !apiKey.trim()}
                  type="submit"
                >
                  {keyBusy ? 'Enregistrement…' : 'Enregistrer la clé'}
                </button>
                {status.textAI && (
                  <button
                    className="button secondary small"
                    type="button"
                    disabled={keyBusy}
                    onClick={async () => {
                      if (!confirm('Retirer la clé Gemini de cet ordinateur ?')) return;
                      try {
                        await window.nickshopDesktop!.setGeminiKey('');
                        setStatus({ textAI: false });
                        notify('Clé Gemini retirée.');
                      } catch (e) {
                        notify((e as Error).message);
                      }
                    }}
                  >
                    Déconnecter Gemini
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="info-box">
            Pour activer l'IA Gemini côté serveur dans cet environnement web,
            renseignez <code>GEMINI_API_KEY</code> dans vos variables d’environnement.
            Le schéma SQL Supabase est prêt dans <code>/supabase/schema.sql</code> pour
            la synchronisation cloud future.
          </div>
        </section>

        {/* SAUVEGARDE & RESTAURATION */}
        <section className="panel settings-panel">
          <h2>Vos données vous appartiennent</h2>
          <p className="muted">
            Les données sont sauvegardées en local dans ce navigateur. Exportez
            régulièrement une sauvegarde pour ne rien perdre.
          </p>
          <div className="button-group">
            <button
              className="button secondary"
              onClick={() =>
                Download(
                  'nickshop-sauvegarde.json',
                  JSON.stringify(store, null, 2),
                  'application/json'
                )
              }
            >
              <DownloadIcon size={16} /> Sauvegarder (JSON)
            </button>
            <button
              className="button secondary"
              onClick={() => input.current?.click()}
            >
              <Upload size={16} /> Importer
            </button>
          </div>
          <input
            ref={input}
            hidden
            type="file"
            accept="application/json,.json"
            onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 15 * 1024 * 1024) {
                  throw Error('Fichier trop volumineux (15 Mo maximum).');
                }
                const parsed = JSON.parse(await file.text());
                setImported(validateBackup(parsed) as Store);
              } catch (err) {
                notify((err as Error).message);
              }
              e.target.value = '';
            }}
          />
          <p className="small-text muted">
            L’import remplace les données locales après confirmation.
          </p>
        </section>

        {/* NETTOYER LA DÉMONSTRATION */}
        <section className="panel settings-panel">
          <h2>Faire place à vos vraies données</h2>
          <p className="muted">
            Retirez les produits, publications et commandes de démonstration une fois
            vos vraies données saisies.
          </p>
          <button
            className="button secondary danger-text"
            onClick={() => setReset(true)}
          >
            <Trash2 size={16} /> Retirer les données de démonstration
          </button>
        </section>
      </div>

      {reset && (
        <Modal
          title="Retirer les données de démonstration ?"
          onClose={() => setReset(false)}
        >
          <p>
            Les produits, contenus, publications et commandes portant le marqueur
            « Démonstration » seront supprimés. Vos vraies créations et ventes saisies
            seront conservées intactes.
          </p>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setReset(false)}>
              Annuler
            </button>
            <button
              className="button danger"
              onClick={() => {
                update(s => ({
                  ...s,
                  products: s.products.filter(p => !p.demo),
                  posts: s.posts.filter(p => !p.demo),
                  contents: s.contents.filter(p => !p.demo),
                  ideas: s.ideas.filter(p => !p.demo),
                  orders: (s.orders || []).filter(o => !o.demo)
                }));
                setReset(false);
                notify('Données de démonstration retirées.');
              }}
            >
              Retirer la démonstration
            </button>
          </div>
        </Modal>
      )}

      {imported && (
        <Modal
          title="Remplacer les données locales ?"
          onClose={() => setImported(null)}
        >
          <p>
            Cette sauvegarde contient {imported.products.length} produit(s),{' '}
            {imported.posts.length} publication(s) et{' '}
            {(imported.orders || []).length} commande(s). Les données actuelles seront
            remplacées.
          </p>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setImported(null)}>
              Annuler
            </button>
            <button
              className="button"
              onClick={() => {
                update(() => imported);
                setSettings(imported.settings);
                setImported(null);
                notify('Sauvegarde importée avec succès.');
              }}
            >
              Importer cette sauvegarde
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
