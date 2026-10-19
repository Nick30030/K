export const platforms = ['Facebook', 'TikTok', 'WhatsApp'];
export const statuses = ['Idée', 'À rédiger', 'Visuel à créer', 'Prêt', 'Programmé', 'Publié'];
export const contentTypes = ['Présentation produit', 'Promotion commerciale', 'Témoignage client', 'Nouvel arrivage', 'Storytelling', 'Comparaison de produits', 'Publication éducative', 'Offre limitée', 'Publicité Meta Ads'];
export const uid = () => globalThis.crypto.randomUUID();
export const money = n => new Intl.NumberFormat('fr-CM').format(Number(n) || 0) + ' FCFA';
export function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function draftCopy(product, original, tone, cta, variant = 0) {
  const name = product?.name || 'notre sélection NickShop';
  const price = product ? `Prix : ${money(product.price)}.` : '';
  const detail = [original?.trim(), product?.description].filter(Boolean).join('\n');
  const hooks = tone === 'Persuasif' ? [`Votre prochain coup de cœur vous attend.`, `Envie de découvrir ${name} ?`, `Et si c’était votre prochain essentiel ?`] : tone === 'Premium' ? [`L’élégance, dans les petits détails.`, `Un moment pour vous.`, `Votre prochain essentiel.`] : [`Et si vous découvriez ${name} ?`, `Un nouveau coup de cœur ?`, `Faites une place à ${name}.`];
  const hook = hooks[variant % hooks.length];
  const action = cta || 'Écrivez-nous sur WhatsApp pour commander.';
  return {
    Facebook: `${hook}\n\n${name}\n${detail}\n${price}\n\n${action}\n\n#NickShop #BeautéCameroun`,
    TikTok: `HOOK · 0–3 s\n${hook}\n\nPLAN 1 · 3–10 s\nMontrez ${name} en gros plan, dans une lumière naturelle.\nTexte écran : « ${name} »\n\nPLAN 2 · 10–20 s\nPrésentez le produit et ses détails vérifiés.\nVoix off : « ${detail || name} »\n\nPLAN 3 · 20–25 s\nTexte écran : « ${price} »\n${action}\n\nLÉGENDE\n${name}. ${price} ${action} #NickShop`,
    WhatsApp: `${name} ✨\n${detail}\n${price}\n\n${action}`
  };
}
export function conceptsFor(product, options = {}, variant = 0) {
  const name = product?.name || 'Votre produit';
  const styles = [
    {title:'L’essentiel, sublimé',scene:'Un socle en pierre claire, une lumière latérale douce et des ombres naturelles. Le produit reste au centre.',palette:'Ivoire · sable · noir profond',typo:'Manrope pour les titres, sans-serif lisible pour les détails.',why:'Une composition épurée renforce la lisibilité du produit et la perception de qualité.'},
    {title:'Votre rituel, votre signature',scene:'Une scène de coiffeuse lumineuse, un tissu écru et un miroir flouté en arrière-plan. Le produit au premier plan.',palette:'Crème · brun chaud · or discret',typo:'Un titre éditorial sobre et une typographie sans-serif pour le prix.',why:'La mise en situation aide à se projeter dans un usage quotidien, sans promettre un résultat non vérifié.'},
    {title:'Le détail qui fait envie',scene:'Un cadrage rapproché du produit sur fond sombre, avec un halo de lumière dorée. Un espace négatif à droite accueille le texte.',palette:'Noir charbon · ambre · ivoire',typo:'Titre sans-serif semi-gras, prix et appel à l’action très lisibles.',why:'Le contraste attire l’attention dans le fil et donne une place claire au parcours vers WhatsApp.'}
  ];
  return styles.map((_,i) => {
    const s=styles[(i+variant)%3]; const format=options.format || (options.platform==='TikTok' ? '9:16 · 1080 × 1920' : '4:5 · 1080 × 1350');
    return {...s,id:uid(),text: name,format,prompt:`Photographie commerciale réaliste pour NickShop, parfumerie et beauté au Cameroun. Produit : ${name}. Informations vérifiées : ${product?.description || 'aucune caractéristique supplémentaire fournie'}. ${s.scene} Palette : ${s.palette}. Direction : ${options.style || 'premium accessible'}, ${options.type || 'présentation produit'}. Objectif : ${options.goal || 'générer des conversations WhatsApp'}. Plateforme : ${options.platform || 'Facebook'}. Format : ${format}. Prévoir de l’espace pour ajouter « ${name} »${product ? ` et « ${money(product.price)} »` : ''} en postproduction. ${options.post ? `Contexte éditorial : ${options.post}.` : ''} Si une photo de référence est fournie, préserver exactement la forme, l’étiquette, le logo et les couleurs du produit. Ne pas inventer de marque, de témoignage, de remise ou de promesse. Aucun texte incrusté généré. Composition élégante, sans surcharge.`};
  });
}
export function buildSchedule({start,days,perWeek,selectedPlatforms,products,goal,promotion='',budget=0,important='',mix=/** @type {string[]} */ ([])}) {
  if (!selectedPlatforms.length || !products.length) throw Error('Choisissez une plateforme et au moins un produit actif en stock.');
  const count=Math.max(1,Math.round(days*perWeek/7));
  const types=mix.length ? mix : ['Présentation produit','Publication éducative','Storytelling','Publicité Meta Ads'];
  return Array.from({length:count},(_,i) => {
    const date=new Date(start+'T12:00:00'); date.setDate(date.getDate()+Math.floor(i*days/count));
    const product=products[i%products.length], platform=selectedPlatforms[i%selectedPlatforms.length];
    let type=types[i%types.length]; if(type==='Publicité Meta Ads' && (platform!=='Facebook'|| !budget)) type='Présentation produit';
    const note=type==='Témoignage client' ? 'Ajouter uniquement un avis réel avec l’accord du client.' : type==='Promotion commerciale'||type==='Offre limitée' ? (promotion || 'Renseigner les conditions réelles de l’offre avant publication.') : '';
    return {id:uid(),date:localDate(date),time:platform==='WhatsApp'?'18:30':'19:00',platform,productId:product.id,title:`${type} · ${product.name}`,text:draftCopy(product,[note,important].filter(Boolean).join('\n'),'Naturel','Écrivez-nous sur WhatsApp pour commander.')[platform],type,goal,visual:conceptsFor(product,{platform})[0],format:platform==='Facebook'?'4:5': '9:16',cta:'Écrivez-nous sur WhatsApp pour commander.',paid:type==='Publicité Meta Ads',status:'Idée',demo:false};
  });
}
export function metrics(result) {
  const {spend=0,conversations=0,orders=0,revenue=0,cost=0}=result;
  return {cpc:conversations ? spend/conversations : null,cpa:orders ? spend/orders : null,roas:spend ? revenue/spend : null,margin:revenue-cost-spend};
}
export function csvExport(posts,products) {
  const rows=[['Date','Heure (Afrique/Douala)','Plateforme','Titre','Produit','Type','Objectif','Texte','Idée visuelle','Prompt','Format','Appel à l’action','Diffusion','Statut'],...posts.map(p=>[p.date,p.time,p.platform,p.title,products.find(x=>x.id===p.productId)?.name || '',p.type,p.goal,p.text,p.visual?.scene,p.visual?.prompt,p.format,p.cta,p.paid?'Publicité':'Organique',p.status])];
  return '\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""').replace(/^[=+@-]/,"'$&")+'"').join(';')).join('\r\n');
}
export function icsExport(posts) {
  const esc=s=>String(s||'').replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
  const fold=s=>{ const chunks=[];let line='';for(const char of s){if(new TextEncoder().encode(line+char).length>73){chunks.push(line);line=' '+char;}else line+=char;}return [...chunks,line].join('\r\n');};
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NickShop//Content Studio//FR',...posts.flatMap(p=>{
    const date = new Date(`${p.date}T${p.time || '19:00'}:00+01:00`);
    const utc=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
    return ['BEGIN:VEVENT',`UID:${esc(p.id)}@nickshop`, `DTSTAMP:${utc(new Date())}`,`DTSTART:${utc(date)}`,`DTEND:${utc(new Date(date.getTime()+30*60000))}`,fold(`SUMMARY:${esc(p.platform+' · '+p.title)}`),fold(`DESCRIPTION:${esc(p.text)}`),'END:VEVENT'];
  }),'END:VCALENDAR'].join('\r\n');
}
export function validateBackup(data) {
  if(!data||data.version!==1 || !['products','posts','contents','ideas'].every(k=>Array.isArray(data[k])) || !data.settings || typeof data.settings!=='object' || !data.results || typeof data.results!=='object') throw Error('Fichier de sauvegarde NickShop invalide.');
  const str=v=>typeof v==='string';
  if(data.products.some(p=>!p||!str(p.id)||!str(p.name)||!str(p.category)||!str(p.description)||!str(p.features)||!Number.isFinite(p.price)||p.price<0||!Number.isInteger(p.stock)||p.stock<0||typeof p.active!=='boolean'||!str(p.photo)|| (p.photo&&!/^data:image\/(png|jpeg|webp);base64,/.test(p.photo)))) throw Error('Les produits du fichier sont invalides.');
  if(data.posts.some(p=>!p||!str(p.id)||!str(p.title)||!str(p.text)||!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)||!platforms.includes(p.platform)||!statuses.includes(p.status))) throw Error('Les publications du fichier sont invalides.');
  if(data.contents.some(c=>!c||!str(c.id)||!str(c.text)||!platforms.includes(c.platform))||data.ideas.some(c=>!c||!str(c.id)||!str(c.title)||!str(c.prompt)||!str(c.scene))) throw Error('La bibliothèque du fichier est invalide.');
  if(!['budget','whatsapp','brandGoal'].every(k=>k==='budget'?Number.isFinite(data.settings[k])&&data.settings[k]>=0:str(data.settings[k]))||!['spend','conversations','orders','revenue','cost'].every(k=>Number.isFinite(data.results[k])&&data.results[k]>=0)) throw Error('Les paramètres du fichier sont invalides.');
  return data;
}
