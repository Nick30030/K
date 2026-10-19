import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Pencil,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle
} from 'lucide-react';
import { type Shared, Modal, Field, Empty } from './ui';
import {
  getDoualaDate,
  money,
  orderStatuses,
  orderChannels,
  computeCommercialMetrics,
  uid
} from './domain.mjs';
import type { Order, OrderStatus, OrderChannel, DailyLog } from './types';

export default function Sales({ store, update, notify }: Shared) {
  const todayStr = getDoualaDate();

  // Filtres et recherche
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [channelFilter, setChannelFilter] = useState('Tous');

  // Modales
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [dailyLogModal, setDailyLogModal] = useState(false);

  // État du log quotidien (dépenses pub et conversations WhatsApp)
  const existingLog = (store.dailyLogs || []).find(l => l.date === todayStr);
  const [dailyForm, setDailyForm] = useState<DailyLog>({
    date: todayStr,
    spend: existingLog?.spend ?? 0,
    conversations: existingLog?.conversations ?? 0,
    notes: existingLog?.notes ?? ''
  });

  // Indicateurs globaux
  const metrics = useMemo(() => {
    return computeCommercialMetrics(store.orders, store.dailyLogs, store.products);
  }, [store.orders, store.dailyLogs, store.products]);

  // Filtrage des commandes
  const filteredOrders = useMemo(() => {
    return (store.orders || [])
      .filter(o => {
        const matchesSearch =
          o.productName.toLowerCase().includes(search.toLowerCase()) ||
          (o.notes && o.notes.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === 'Tous' || o.status === statusFilter;
        const matchesChannel = channelFilter === 'Tous' || o.channel === channelFilter;
        return matchesSearch && matchesStatus && matchesChannel;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [store.orders, search, statusFilter, channelFilter]);

  function newOrder(): Order {
    const firstProduct = store.products.find(p => p.active && p.stock > 0) || store.products[0];
    return {
      id: uid(),
      date: todayStr,
      productId: firstProduct?.id || '',
      productName: firstProduct?.name || 'Parfum NickShop',
      quantity: 1,
      unitPrice: firstProduct?.price || 12000,
      discount: 0,
      deliveryCost: 0,
      collectedAmount: firstProduct?.price || 12000,
      status: 'Livrée',
      channel: 'WhatsApp',
      notes: '',
      demo: false
    };
  }

  function handleProductChange(prodId: string, currentOrder: Order): Order {
    const p = store.products.find(prod => prod.id === prodId);
    if (!p) return currentOrder;
    const qty = currentOrder.quantity || 1;
    const disc = currentOrder.discount || 0;
    const expected = Math.max(0, p.price * qty - disc);
    return {
      ...currentOrder,
      productId: p.id,
      productName: p.name,
      unitPrice: p.price,
      collectedAmount: currentOrder.status === 'Livrée' ? expected : 0
    };
  }

  function handleQuantityChange(qty: number, currentOrder: Order): Order {
    const price = currentOrder.unitPrice || 0;
    const disc = currentOrder.discount || 0;
    const expected = Math.max(0, price * qty - disc);
    return {
      ...currentOrder,
      quantity: qty,
      collectedAmount: currentOrder.status === 'Livrée' ? expected : currentOrder.collectedAmount
    };
  }

  function handleStatusChange(newStatus: OrderStatus, currentOrder: Order): Order {
    const price = currentOrder.unitPrice || 0;
    const qty = currentOrder.quantity || 1;
    const disc = currentOrder.discount || 0;
    const expected = Math.max(0, price * qty - disc);

    // Règle métier : si Livrée, préremplir le montant encaissé si à 0
    // Si Annulée ou Retournée, montant encaissé à 0
    let collected = currentOrder.collectedAmount;
    if (newStatus === 'Livrée' && collected === 0) {
      collected = expected;
    } else if (newStatus === 'Annulée' || newStatus === 'Retournée') {
      collected = 0;
    }

    return {
      ...currentOrder,
      status: newStatus,
      collectedAmount: collected
    };
  }

  function saveOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!editingOrder) return;

    update(s => {
      const orders = s.orders || [];
      const exists = orders.some(o => o.id === editingOrder.id);
      const updatedOrders = exists
        ? orders.map(o => (o.id === editingOrder.id ? editingOrder : o))
        : [editingOrder, ...orders];
      return { ...s, orders: updatedOrders };
    });

    notify(
      store.orders?.some(o => o.id === editingOrder.id)
        ? 'Commande mise à jour.'
        : 'Nouvelle commande enregistrée avec succès.'
    );
    setEditingOrder(null);
  }

  function saveDailyLog(e: React.FormEvent) {
    e.preventDefault();
    update(s => {
      const logs = s.dailyLogs || [];
      const exists = logs.some(l => l.date === dailyForm.date);
      const updatedLogs = exists
        ? logs.map(l => (l.date === dailyForm.date ? dailyForm : l))
        : [...logs, dailyForm];
      return { ...s, dailyLogs: updatedLogs };
    });

    notify('Dépenses publicitaires et conversations enregistrées pour cette journée.');
    setDailyLogModal(false);
  }

  return (
    <div className="sales-view">
      {/* EN-TÊTE DE LA PAGE */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">PILOTAGE DES VENTES RÉELLES</div>
          <h1>Mes ventes & résultats commerciaux<span className="gold">.</span></h1>
          <p>
            10 minutes par jour pour suivre vos commandes, vos marges et vos dépenses
            sans tableur complexe.
          </p>
        </div>

        <div className="button-group">
          <button className="button secondary" onClick={() => setDailyLogModal(true)}>
            <Megaphone size={16} /> Dépenses pub & conversations
          </button>
          <button className="button" onClick={() => setEditingOrder(newOrder())}>
            <Plus size={16} /> Enregistrer une commande
          </button>
        </div>
      </div>

      {/* CARTES RÉSUMÉES COMMERCIALES */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>CA encaissé réel</span>
            <DollarSign size={17} />
          </div>
          <strong className="text-emerald-700">{money(metrics.encashedRevenue)}</strong>
          <small>{metrics.deliveredCount} commande(s) livrée(s) et payée(s)</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Pipeline confirmées</span>
            <Clock size={17} />
          </div>
          <strong>{money(metrics.pipelineValue)}</strong>
          <small>{metrics.pipelineCount} en attente ou préparation</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Dépenses Meta Ads</span>
            <Megaphone size={17} />
          </div>
          <strong>{money(metrics.adSpend)}</strong>
          <small>{metrics.conversations} conversation(s) reçue(s)</small>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Marge contributive</span>
            <TrendingUp size={17} />
          </div>
          <strong className={metrics.margin >= 0 ? 'text-emerald-700' : 'text-red-700'}>
            {money(metrics.margin)}
          </strong>
          <small>CA − coûts d'achat − livraison − pub</small>
        </div>
      </div>

      {/* RAPPEL RÈGLE MÉTIER / CLARTÉ FINANCIÈRE */}
      <div className="info-banner mb-6">
        <HelpCircle size={18} />
        <div>
          <strong>Règle de gestion NickShop :</strong> Une commande confirmée n'est pas
          comptabilisée comme vente encaissée tant qu'elle n'est pas livrée et payée. Les
          commandes annulées ou retournées sont isolées afin de ne pas fausser votre chiffre
          d'affaires réel.
        </div>
      </div>

      {/* BARRE D'OUTILS ET FILTRES */}
      <div className="toolbar">
        <div className="tabs">
          {['Tous', 'Livrée', 'Commande confirmée', 'En préparation', 'Annulée'].map(s => (
            <button
              key={s}
              className={statusFilter === s ? 'active' : ''}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            className="channel-select"
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
          >
            <option value="Tous">Tous les canaux</option>
            {orderChannels.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="search-field">
            <Search size={16} />
            <input
              placeholder="Rechercher une commande, note..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLEAU DES COMMANDES */}
      <div className="panel overflow-hidden p-0">
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Qté</th>
                <th>Prix unitaire</th>
                <th>Canal</th>
                <th>Statut</th>
                <th>Montant encaissé</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const isDelivered = order.status === 'Livrée';
                const isCancelled = order.status === 'Annulée' || order.status === 'Retournée';

                return (
                  <tr key={order.id} className={isCancelled ? 'row-cancelled' : ''}>
                    <td>
                      <span className="font-medium text-slate-800">{order.date}</span>
                    </td>
                    <td>
                      <div className="order-product-cell">
                        <strong>{order.productName}</strong>
                        {order.notes && <small className="text-slate-500">{order.notes}</small>}
                      </div>
                    </td>
                    <td>{order.quantity}</td>
                    <td>{money(order.unitPrice)}</td>
                    <td>
                      <span className="channel-tag">{order.channel}</span>
                    </td>
                    <td>
                      <span
                        className={`order-status-badge status-${order.status
                          .toLowerCase()
                          .replace(/\s+/g, '-')}`}
                      >
                        {isDelivered && <CheckCircle2 size={12} />}
                        {isCancelled && <XCircle size={12} />}
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <strong
                        className={
                          isDelivered
                            ? 'text-emerald-700 font-semibold'
                            : isCancelled
                            ? 'text-slate-400 line-through'
                            : 'text-amber-700'
                        }
                      >
                        {money(order.collectedAmount)}
                      </strong>
                      {order.discount > 0 && (
                        <small className="block text-slate-400">
                          (Remise : -{money(order.discount)})
                        </small>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="icon-button"
                          aria-label="Modifier la commande"
                          onClick={() => setEditingOrder({ ...order })}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button danger-text"
                          aria-label="Supprimer la commande"
                          onClick={() => setDeletingOrder(order)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!filteredOrders.length && (
          <Empty
            title="Aucune commande dans cette sélection"
            description="Enregistrez votre première commande en quelques clics."
          >
            <button className="button" onClick={() => setEditingOrder(newOrder())}>
              <Plus size={16} /> Enregistrer une commande
            </button>
          </Empty>
        )}
      </div>

      {/* MODAL : SAISIE / MODIFICATION D'UNE COMMANDE */}
      {editingOrder && (
        <Modal
          title={
            store.orders?.some(o => o.id === editingOrder.id)
              ? 'Modifier la commande'
              : 'Enregistrer une nouvelle commande'
          }
          onClose={() => setEditingOrder(null)}
        >
          <form onSubmit={saveOrder}>
            <p className="form-intro">
              Saisissez les informations réelles de la commande. Les commandes non
              encaissées ou annulées sont clairement isolées.
            </p>

            <div className="form-grid">
              <Field label="Date de la commande (Douala)">
                <input
                  type="date"
                  required
                  value={editingOrder.date}
                  onChange={e =>
                    setEditingOrder({ ...editingOrder, date: e.target.value })
                  }
                />
              </Field>

              <Field label="Produit vendu">
                <select
                  value={editingOrder.productId}
                  onChange={e =>
                    setEditingOrder(handleProductChange(e.target.value, editingOrder))
                  }
                >
                  {store.products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({money(p.price)}) {!p.active ? '· Inactif' : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Quantité">
                <input
                  type="number"
                  min="1"
                  required
                  value={editingOrder.quantity}
                  onChange={e =>
                    setEditingOrder(
                      handleQuantityChange(Number(e.target.value), editingOrder)
                    )
                  }
                />
              </Field>

              <Field label="Prix unitaire appliqué (FCFA)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={editingOrder.unitPrice}
                  onChange={e => {
                    const price = Number(e.target.value);
                    const qty = editingOrder.quantity || 1;
                    const disc = editingOrder.discount || 0;
                    setEditingOrder({
                      ...editingOrder,
                      unitPrice: price,
                      collectedAmount:
                        editingOrder.status === 'Livrée'
                          ? Math.max(0, price * qty - disc)
                          : editingOrder.collectedAmount
                    });
                  }}
                />
              </Field>

              <Field label="Remise accordée (FCFA)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editingOrder.discount}
                  onChange={e => {
                    const disc = Number(e.target.value);
                    const price = editingOrder.unitPrice || 0;
                    const qty = editingOrder.quantity || 1;
                    setEditingOrder({
                      ...editingOrder,
                      discount: disc,
                      collectedAmount:
                        editingOrder.status === 'Livrée'
                          ? Math.max(0, price * qty - disc)
                          : editingOrder.collectedAmount
                    });
                  }}
                />
              </Field>

              <Field label="Frais de livraison à la charge de NickShop (FCFA)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editingOrder.deliveryCost}
                  onChange={e =>
                    setEditingOrder({
                      ...editingOrder,
                      deliveryCost: Number(e.target.value)
                    })
                  }
                  placeholder="0 si payé par le client"
                />
              </Field>

              <Field label="Canal d'origine">
                <select
                  value={editingOrder.channel}
                  onChange={e =>
                    setEditingOrder({
                      ...editingOrder,
                      channel: e.target.value as OrderChannel
                    })
                  }
                >
                  {orderChannels.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Statut de la commande">
                <select
                  value={editingOrder.status}
                  onChange={e =>
                    setEditingOrder(
                      handleStatusChange(e.target.value as OrderStatus, editingOrder)
                    )
                  }
                >
                  {orderStatuses.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field
              label="Montant effectivement encaissé (FCFA)"
              hint="Ne renseigner que les montants réellement reçus (MoMo, OM ou espèces à la livraison)."
            >
              <input
                type="number"
                min="0"
                step="1"
                required
                value={editingOrder.collectedAmount}
                onChange={e =>
                  setEditingOrder({
                    ...editingOrder,
                    collectedAmount: Number(e.target.value)
                  })
                }
              />
            </Field>

            <Field label="Notes facultatives (quartier, client, lien campagne)">
              <textarea
                rows={2}
                maxLength={500}
                placeholder="Ex. : Livré à Bonamoussadi, cliente contactée suite au statut du matin..."
                value={editingOrder.notes}
                onChange={e =>
                  setEditingOrder({ ...editingOrder, notes: e.target.value })
                }
              />
            </Field>

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setEditingOrder(null)}
              >
                Annuler
              </button>
              <button type="submit" className="button">
                Enregistrer la commande
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL : DÉPENSES PUB ET CONVERSATIONS DU JOUR */}
      {dailyLogModal && (
        <Modal
          title="Dépenses publicitaires & Conversations"
          onClose={() => setDailyLogModal(false)}
        >
          <form onSubmit={saveDailyLog}>
            <p className="form-intro">
              Indiquez les montants dépensés sur Meta Ads et le nombre de conversations
              WhatsApp reçues pour calculer votre coût par conversation et votre ROAS.
            </p>

            <div className="form-grid">
              <Field label="Date concernée">
                <input
                  type="date"
                  required
                  value={dailyForm.date}
                  onChange={e =>
                    setDailyForm({ ...dailyForm, date: e.target.value })
                  }
                />
              </Field>

              <Field label="Dépenses Meta Ads du jour (FCFA)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={dailyForm.spend}
                  onChange={e =>
                    setDailyForm({
                      ...dailyForm,
                      spend: Number(e.target.value)
                    })
                  }
                />
              </Field>
            </div>

            <Field
              label="Nombre de conversations WhatsApp attribuables aux contenus"
              hint="Nombre de prospects ayant écrit sur WhatsApp suite à un contenu ou une publicité."
            >
              <input
                type="number"
                min="0"
                step="1"
                required
                value={dailyForm.conversations}
                onChange={e =>
                  setDailyForm({
                    ...dailyForm,
                    conversations: Number(e.target.value)
                  })
                }
              />
            </Field>

            <Field label="Notes de campagne (facultatif)">
              <input
                placeholder="Ex. : Campagne relancée sur Rose de Minuit avec budget de 5 000 FCFA"
                value={dailyForm.notes || ''}
                onChange={e =>
                  setDailyForm({ ...dailyForm, notes: e.target.value })
                }
              />
            </Field>

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setDailyLogModal(false)}
              >
                Annuler
              </button>
              <button type="submit" className="button">
                Enregistrer pour cette date
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL : CONFIRMATION SUPPRESSION */}
      {deletingOrder && (
        <Modal title="Supprimer cette commande ?" onClose={() => setDeletingOrder(null)}>
          <p>
            Voulez-vous supprimer la commande de « {deletingOrder.productName} » du{' '}
            {deletingOrder.date} ? Cette action est irréversible.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDeletingOrder(null)}
            >
              Annuler
            </button>
            <button
              className="button danger"
              onClick={() => {
                update(s => ({
                  ...s,
                  orders: (s.orders || []).filter(o => o.id !== deletingOrder.id)
                }));
                setDeletingOrder(null);
                notify('Commande supprimée.');
              }}
            >
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
