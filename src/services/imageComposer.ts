import type { PhotoBankItem, Product, Platform } from '../types';
import { money } from '../domain.mjs';

export type CompositionPreset =
  | 'luxury_podium'
  | 'whatsapp_flash'
  | 'douala_sunset'
  | 'minimal_studio'
  | 'black_gold_editorial';

export type CompositionOptions = {
  referenceImageUrl: string;
  imageType?: 'raw_product' | 'full_photo';
  postText?: string;
  product?: Partial<Product>;
  preset?: CompositionPreset;
  platform?: Platform;
  format?: '1:1' | '4:5' | '9:16';
  customHeadline?: string;
  customPrice?: number;
  customSubtext?: string;
  customCta?: string;
  badgeText?: string;
  showPrice?: boolean;
  showCta?: boolean;
  showBrand?: boolean;
  showBadge?: boolean;
  whatsappPhone?: string;
};

/**
 * Redimensionne et compresse une image locale avant stockage
 * pour garantir une vitesse optimale et ne pas saturer le stockage.
 */
export async function compressUploadedImage(file: File, maxDim = 1400, quality = 0.9): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier image.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Format d’image non supporté ou fichier corrompu.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Impossible d’initialiser le canvas.'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Appel API serveur pour générer une illustration IA
 * inspirée d'une image de référence de la photothèque.
 */
export async function requestAiImageFromReference(params: {
  referencePhoto: PhotoBankItem;
  postText: string;
  product?: Product;
  platform?: Platform;
  format?: string;
  style?: string;
}): Promise<{ mode: 'ai' | 'template'; imageUrl?: string; prompt: string; message?: string }> {
  try {
    const res = await fetch(new URL('api/generate-image', document.baseURI), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API generate-image indisponible, bascule locale:', err);
  }
  return {
    mode: 'template',
    prompt: '',
    message: 'Compositeur d’affiches graphiques haute définition actif.'
  };
}

/**
 * Moteur de composition d'affiches publicitaires NickShop Canvas 2D
 * Rend une affiche commerciale professionnelle 1080p prête à publier
 * adaptée aux images vierges (sur podium de luxe) ou photos de shooting complètes.
 */
export async function renderBrandedComposition(
  canvas: HTMLCanvasElement,
  options: CompositionOptions
): Promise<string> {
  const {
    referenceImageUrl,
    imageType = 'raw_product',
    postText = '',
    product,
    preset = 'luxury_podium',
    format = '1:1',
    customHeadline,
    customPrice,
    customSubtext,
    customCta,
    badgeText,
    showPrice = true,
    showCta = true,
    showBrand = true,
    showBadge = true,
    whatsappPhone = '690 00 00 00'
  } = options;

  let width = 1080;
  let height = 1080;
  if (format === '4:5') height = 1350;
  else if (format === '9:16') height = 1920;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossible d’initialiser le moteur Canvas 2D.');

  // 1. Fond de base selon l'ambiance choisie
  drawAtmosphericBackground(ctx, width, height, preset);

  // Charger l'image fournie (vierge ou complète)
  let loadedImg: HTMLImageElement | null = null;
  if (referenceImageUrl) {
    try {
      loadedImg = await loadImage(referenceImageUrl);
    } catch (e) {
      console.warn('Impossible de charger l’image source:', e);
    }
  }

  // 2. Rendu du sujet :
  // Si c'est une image vierge du produit (packshot / flacon isolé) -> Mode Podium Studio de Luxe
  // Si c'est une photo complète -> Mode Plein format avec filtres de contraste
  if (imageType === 'raw_product') {
    drawPodiumScene(ctx, width, height, preset, loadedImg, format);
  } else if (loadedImg) {
    drawFullBleedScene(ctx, width, height, preset, loadedImg);
  }

  // 3. Cadre & liseré doré subtil
  drawLuxuryBorder(ctx, width, height, preset);

  // 4. En-tête de marque
  if (showBrand) {
    drawBrandHeader(ctx, width, preset);
  }

  // 5. Badge d'urgence / Arrivage / Statut
  const activeBadge = badgeText || (preset === 'whatsapp_flash' ? '⚡ OFFRE SPÉCIALE · DOUALA' : '✨ ARRIVAGE EXCLUSIF · DOUALA');
  if (showBadge && activeBadge) {
    drawUrgencyBadge(ctx, width, activeBadge, preset);
  }

  // 6. Titre publicitaire percutant et sous-titre
  const titleText =
    customHeadline ||
    extractPunchyTitle(postText) ||
    product?.name ||
    'Élégance & Sillage Captivant';

  const subText =
    customSubtext ||
    extractSubtext(postText) ||
    product?.description?.slice(0, 90) ||
    'Disponible immédiatement en boutique avec livraison express.';

  drawTypographySection(ctx, width, height, titleText, subText, format, preset);

  // 7. Badge de prix en FCFA
  const priceToDisplay = customPrice ?? product?.price;
  if (showPrice && priceToDisplay && priceToDisplay > 0) {
    drawPriceBadge(ctx, width, format, priceToDisplay, preset);
  }

  // 8. Bouton WhatsApp
  if (showCta) {
    const ctaText = customCta || `Commander sur WhatsApp · ${whatsappPhone}`;
    drawWhatsAppCta(ctx, width, height, ctaText, preset, format);
  }

  return canvas.toDataURL('image/png', 0.95);
}

/**
 * Dessine un fond d'ambiance de studio de luxe
 */
function drawAtmosphericBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  preset: CompositionPreset
) {
  ctx.save();

  if (preset === 'douala_sunset') {
    // Ambiance coucher de soleil ambré
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1c1318');
    grad.addColorStop(0.35, '#2e1913');
    grad.addColorStop(0.7, '#1b120c');
    grad.addColorStop(1, '#0e0b08');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Halo chaud au centre
    const glow = ctx.createRadialGradient(width / 2, height * 0.45, 40, width / 2, height * 0.45, width * 0.7);
    glow.addColorStop(0, 'rgba(235, 140, 50, 0.22)');
    glow.addColorStop(0.5, 'rgba(180, 80, 30, 0.1)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else if (preset === 'whatsapp_flash') {
    // Fond vert sombre et noir intense pour WhatsApp
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0a1710');
    grad.addColorStop(0.4, '#0e2418');
    grad.addColorStop(0.85, '#07100b');
    grad.addColorStop(1, '#040806');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Halo vert émeraude
    const glow = ctx.createRadialGradient(width / 2, height * 0.42, 60, width / 2, height * 0.42, width * 0.65);
    glow.addColorStop(0, 'rgba(37, 211, 102, 0.16)');
    glow.addColorStop(0.5, 'rgba(18, 140, 68, 0.08)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else if (preset === 'black_gold_editorial') {
    // Noir absolu avec halo or très précis
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0d0d0d');
    grad.addColorStop(0.5, '#121212');
    grad.addColorStop(1, '#060606');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width / 2, height * 0.4, 30, width / 2, height * 0.4, width * 0.6);
    glow.addColorStop(0, 'rgba(212, 175, 55, 0.2)');
    glow.addColorStop(0.5, 'rgba(160, 125, 30, 0.08)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else {
    // luxury_podium & minimal_studio : Marbre obsidian & reflets or
    const grad = ctx.createRadialGradient(
      width / 2,
      height * 0.38,
      80,
      width / 2,
      height * 0.5,
      width * 0.8
    );
    grad.addColorStop(0, 'rgba(212, 175, 55, 0.18)');
    grad.addColorStop(0.35, '#1b1c17');
    grad.addColorStop(0.75, '#10120f');
    grad.addColorStop(1, '#090a08');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Particules dorées subtiles dans l'air (ambiance féerique parfum)
  drawGoldenParticles(ctx, width, height);

  ctx.restore();
}

/**
 * Dessine des particules dorées et étincelles discrètes
 */
function drawGoldenParticles(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  const particleCoords = [
    { x: 0.18, y: 0.22, r: 2.2, a: 0.4 },
    { x: 0.82, y: 0.26, r: 2.5, a: 0.45 },
    { x: 0.25, y: 0.38, r: 1.8, a: 0.3 },
    { x: 0.74, y: 0.44, r: 2.0, a: 0.35 },
    { x: 0.32, y: 0.52, r: 1.5, a: 0.25 },
    { x: 0.68, y: 0.56, r: 2.4, a: 0.4 },
    { x: 0.5, y: 0.2, r: 3.0, a: 0.5 },
    { x: 0.12, y: 0.65, r: 1.6, a: 0.2 },
    { x: 0.88, y: 0.68, r: 1.9, a: 0.25 }
  ];

  for (const p of particleCoords) {
    const px = width * p.x;
    const py = height * p.y;
    const rad = ctx.createRadialGradient(px, py, 0, px, py, p.r * 3.5);
    rad.addColorStop(0, `rgba(255, 230, 150, ${p.a})`);
    rad.addColorStop(0.5, `rgba(212, 175, 55, ${p.a * 0.5})`);
    rad.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(px, py, p.r * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Met en scène une « image vierge » de produit sur un podium 3D de studio
 */
function drawPodiumScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  preset: CompositionPreset,
  img: HTMLImageElement | null,
  format: '1:1' | '4:5' | '9:16'
) {
  ctx.save();

  // Positionnement vertical du podium selon le format
  const podiumCenterY = height * (format === '9:16' ? 0.62 : 0.64);
  const podiumRadiusX = width * 0.36;
  const podiumRadiusY = 46;
  const podiumThickness = 65;

  // 1. Ombre portée douce sur le sol sous le podium
  const floorShadow = ctx.createRadialGradient(
    width / 2,
    podiumCenterY + podiumThickness + 25,
    50,
    width / 2,
    podiumCenterY + podiumThickness + 25,
    podiumRadiusX * 1.3
  );
  floorShadow.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  floorShadow.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)');
  floorShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = floorShadow;
  ctx.beginPath();
  ctx.ellipse(
    width / 2,
    podiumCenterY + podiumThickness + 25,
    podiumRadiusX * 1.3,
    podiumRadiusY * 0.9,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // 2. Tranche / face cylindrique du socle
  const cylinderGrad = ctx.createLinearGradient(
    width / 2 - podiumRadiusX,
    podiumCenterY,
    width / 2 + podiumRadiusX,
    podiumCenterY
  );
  cylinderGrad.addColorStop(0, '#121411');
  cylinderGrad.addColorStop(0.2, '#2c2e26');
  cylinderGrad.addColorStop(0.5, '#404437');
  cylinderGrad.addColorStop(0.8, '#252720');
  cylinderGrad.addColorStop(1, '#0e100d');

  ctx.fillStyle = cylinderGrad;
  ctx.beginPath();
  ctx.ellipse(width / 2, podiumCenterY + podiumThickness, podiumRadiusX, podiumRadiusY, 0, 0, Math.PI);
  ctx.lineTo(width / 2 - podiumRadiusX, podiumCenterY);
  ctx.ellipse(width / 2, podiumCenterY, podiumRadiusX, podiumRadiusY, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();

  // 3. Face supérieure du podium (marbre sombre poli avec liseré or)
  const topGrad = ctx.createRadialGradient(
    width / 2,
    podiumCenterY - 10,
    20,
    width / 2,
    podiumCenterY,
    podiumRadiusX
  );
  topGrad.addColorStop(0, '#383c30');
  topGrad.addColorStop(0.6, '#21231c');
  topGrad.addColorStop(1, '#151712');

  ctx.fillStyle = topGrad;
  ctx.beginPath();
  ctx.ellipse(width / 2, podiumCenterY, podiumRadiusX, podiumRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Liseré or biseauté sur le pourtour supérieur
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.75)';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // 4. Dessin du flacon / produit sur le podium
  if (img) {
    const maxProdH = height * (format === '9:16' ? 0.38 : 0.44);
    const maxProdW = width * 0.52;
    const ratio = img.width / img.height;

    let prodW = maxProdW;
    let prodH = maxProdW / ratio;
    if (prodH > maxProdH) {
      prodH = maxProdH;
      prodW = maxProdH * ratio;
    }

    const prodX = (width - prodW) / 2;
    const prodBottomY = podiumCenterY + 12; // Repose sur la surface
    const prodY = prodBottomY - prodH;

    // Ombre de contact directe sous le flacon
    const contactShadow = ctx.createRadialGradient(
      width / 2,
      prodBottomY,
      8,
      width / 2,
      prodBottomY,
      prodW * 0.45
    );
    contactShadow.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    contactShadow.addColorStop(0.6, 'rgba(0, 0, 0, 0.5)');
    contactShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = contactShadow;
    ctx.beginPath();
    ctx.ellipse(width / 2, prodBottomY, prodW * 0.45, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Reflet miroir inversé estompé sur le marbre
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(width / 2, podiumCenterY, podiumRadiusX, podiumRadiusY, 0, 0, Math.PI * 2);
    ctx.clip(); // Limiter le reflet à la surface du socle
    ctx.globalAlpha = 0.22;
    ctx.translate(0, prodBottomY * 2);
    ctx.scale(1, -0.65);
    ctx.drawImage(img, prodX, prodY, prodW, prodH);
    ctx.restore();

    // Halo lumineux derrière le flacon pour le faire ressortir
    const backLight = ctx.createRadialGradient(
      width / 2,
      prodY + prodH * 0.5,
      prodW * 0.15,
      width / 2,
      prodY + prodH * 0.5,
      prodW * 0.85
    );
    backLight.addColorStop(0, 'rgba(255, 220, 120, 0.22)');
    backLight.addColorStop(0.5, 'rgba(212, 175, 55, 0.08)');
    backLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = backLight;
    ctx.fillRect(prodX - 100, prodY - 50, prodW + 200, prodH + 100);

    // Dessin principal du produit avec contour propre
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.drawImage(img, prodX, prodY, prodW, prodH);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

/**
 * Affiche une photo de shooting en pleine page avec incrustation haute fidélité
 */
function drawFullBleedScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  preset: CompositionPreset,
  img: HTMLImageElement
) {
  ctx.save();

  const imgRatio = img.width / img.height;
  const targetRatio = width / height;
  let renderW = width;
  let renderH = height;
  let offsetX = 0;
  let offsetY = 0;

  if (imgRatio > targetRatio) {
    renderH = height;
    renderW = height * imgRatio;
    offsetX = (width - renderW) / 2;
  } else {
    renderW = width;
    renderH = width / imgRatio;
    offsetY = (height - renderH) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

  // Filtre d'ambiance et dégradé d'assombrissement pour lisibilité parfaite
  const scrim = ctx.createLinearGradient(0, height * 0.45, 0, height);
  scrim.addColorStop(0, 'rgba(10, 12, 9, 0)');
  scrim.addColorStop(0.55, 'rgba(10, 12, 9, 0.78)');
  scrim.addColorStop(1, 'rgba(7, 8, 6, 0.98)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, height * 0.45, width, height * 0.55);

  // Vignette latérale
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.3,
    width / 2,
    height / 2,
    width * 0.75
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(5, 6, 5, 0.65)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * Cadre doré de luxe
 */
function drawLuxuryBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  preset: CompositionPreset
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(32, 32, width - 64, height - 64);

  // Coins décoratifs dorés
  const cornerSize = 16;
  ctx.strokeStyle = '#cca850';
  ctx.lineWidth = 2.5;

  // Haut-gauche
  ctx.beginPath();
  ctx.moveTo(26, 26 + cornerSize);
  ctx.lineTo(26, 26);
  ctx.lineTo(26 + cornerSize, 26);
  ctx.stroke();

  // Haut-droit
  ctx.beginPath();
  ctx.moveTo(width - 26 - cornerSize, 26);
  ctx.lineTo(width - 26, 26);
  ctx.lineTo(width - 26, 26 + cornerSize);
  ctx.stroke();

  // Bas-gauche
  ctx.beginPath();
  ctx.moveTo(26, height - 26 - cornerSize);
  ctx.lineTo(26, height - 26);
  ctx.lineTo(26 + cornerSize, height - 26);
  ctx.stroke();

  // Bas-droit
  ctx.beginPath();
  ctx.moveTo(width - 26 - cornerSize, height - 26);
  ctx.lineTo(width - 26, height - 26);
  ctx.lineTo(width - 26, height - 26 - cornerSize);
  ctx.stroke();

  ctx.restore();
}

/**
 * En-tête de marque NickShop
 */
function drawBrandHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  preset: CompositionPreset
) {
  ctx.save();
  ctx.fillStyle = '#edd48a';
  ctx.font = '700 24px "Manrope", sans-serif';
  ctx.letterSpacing = '5px';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.fillText('NICKSHOP · DOUALA & YAOUNDÉ', width / 2, 75);

  ctx.fillStyle = 'rgba(240, 235, 220, 0.65)';
  ctx.font = '500 15px "DM Sans", sans-serif';
  ctx.letterSpacing = '2.5px';
  ctx.fillText('PARFUMS D’EXCEPTION & BEAUTÉ PREMIUM', width / 2, 102);
  ctx.restore();
}

/**
 * Badge d'urgence / statut / arrivage
 */
function drawUrgencyBadge(
  ctx: CanvasRenderingContext2D,
  width: number,
  text: string,
  preset: CompositionPreset
) {
  ctx.save();
  ctx.font = '700 15px "Manrope", sans-serif';
  ctx.letterSpacing = '1.5px';
  const textWidth = ctx.measureText(text).width;
  const badgeW = textWidth + 36;
  const badgeH = 34;
  const badgeX = (width - badgeW) / 2;
  const badgeY = 125;

  // Fond dégradé
  const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
  if (preset === 'whatsapp_flash') {
    grad.addColorStop(0, '#1ebe5d');
    grad.addColorStop(1, '#0e7e3a');
  } else {
    grad.addColorStop(0, 'rgba(212, 175, 55, 0.25)');
    grad.addColorStop(1, 'rgba(160, 120, 30, 0.35)');
  }

  ctx.fillStyle = grad;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 17);
  ctx.fill();

  ctx.strokeStyle = preset === 'whatsapp_flash' ? '#25d366' : 'rgba(212, 175, 55, 0.7)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text, width / 2, badgeY + 22);
  ctx.restore();
}

/**
 * Section typographique principale (Titre d'affiche + argumentaire)
 */
function drawTypographySection(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string,
  subtext: string,
  format: '1:1' | '4:5' | '9:16',
  preset: CompositionPreset
) {
  ctx.save();
  const bottomOffset = format === '9:16' ? 440 : format === '4:5' ? 360 : 290;
  const titleY = height - bottomOffset;

  // Titre principal
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 46px "Manrope", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 18;
  wrapText(ctx, title, width / 2, titleY, width - 160, 52);

  // Sous-titre
  ctx.fillStyle = 'rgba(235, 230, 220, 0.9)';
  ctx.font = '400 23px "DM Sans", sans-serif';
  ctx.shadowBlur = 8;
  wrapText(ctx, subtext, width / 2, titleY + 70, width - 220, 32);

  ctx.restore();
}

/**
 * Capsule dorée de prix FCFA
 */
function drawPriceBadge(
  ctx: CanvasRenderingContext2D,
  width: number,
  format: '1:1' | '4:5' | '9:16',
  price: number,
  preset: CompositionPreset
) {
  const priceText = money(price);
  ctx.save();
  const badgeX = width - 65;
  const badgeY = format === '9:16' ? 140 : 105;
  ctx.font = '800 28px "Manrope", sans-serif';
  const textWidth = ctx.measureText(priceText).width;
  const padX = 26;
  const padY = 14;
  const boxW = textWidth + padX * 2;
  const boxH = 52;

  // Capsule métallique dorée
  const grad = ctx.createLinearGradient(badgeX - boxW, badgeY - 30, badgeX, badgeY + 20);
  grad.addColorStop(0, '#e8cf78');
  grad.addColorStop(0.5, '#f5e4a8');
  grad.addColorStop(1, '#b88f32');

  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 16;
  roundRect(ctx, badgeX - boxW, badgeY - 36, boxW, boxH, 26);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#14120a';
  ctx.textAlign = 'center';
  ctx.fillText(priceText, badgeX - boxW / 2, badgeY);
  ctx.restore();
}

/**
 * Bouton d'action WhatsApp
 */
function drawWhatsAppCta(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ctaText: string,
  preset: CompositionPreset,
  format: '1:1' | '4:5' | '9:16'
) {
  ctx.save();
  const ctaY = height - (format === '9:16' ? 140 : 100);
  ctx.font = '700 24px "Manrope", sans-serif';
  const ctaWidth = ctx.measureText(ctaText).width;
  const btnW = Math.min(width - 160, ctaWidth + 86);
  const btnH = 66;
  const btnX = (width - btnW) / 2;

  // Dégradé bouton
  const btnGrad = ctx.createLinearGradient(btnX, ctaY - 45, btnX + btnW, ctaY + 20);
  if (preset === 'whatsapp_flash') {
    btnGrad.addColorStop(0, '#25d366');
    btnGrad.addColorStop(1, '#128c46');
  } else {
    btnGrad.addColorStop(0, '#cca850');
    btnGrad.addColorStop(1, '#96731e');
  }

  ctx.fillStyle = btnGrad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 18;
  roundRect(ctx, btnX, ctaY - 44, btnW, btnH, 33);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = preset === 'whatsapp_flash' ? '#ffffff' : '#14120a';
  ctx.textAlign = 'center';
  ctx.fillText(ctaText, width / 2, ctaY);

  // Mention réassurance sous le bouton
  ctx.fillStyle = 'rgba(230, 225, 215, 0.75)';
  ctx.font = '500 14px "DM Sans", sans-serif';
  ctx.fillText('Livraison sécurisée partout à Douala & Yaoundé · Paiement à la réception', width / 2, ctaY + 42);

  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

function extractPunchyTitle(postText: string): string {
  if (!postText) return '';
  const firstLine = postText.split('\n')[0].replace(/[#*•-]/g, '').trim();
  if (firstLine.length > 5 && firstLine.length < 60) return firstLine;
  const sentence = postText.split(/[.!?]/)[0].trim();
  return sentence.length < 60 ? sentence : sentence.slice(0, 55) + '…';
}

function extractSubtext(postText: string): string {
  if (!postText) return '';
  const lines = postText.split('\n').filter(l => l.trim().length > 10);
  if (lines.length > 1) {
    const l = lines[1].replace(/[#*•-]/g, '').trim();
    return l.length > 90 ? l.slice(0, 85) + '…' : l;
  }
  return '';
}
