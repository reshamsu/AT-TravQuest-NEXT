// TravQuest — premium branded listing PDF export.
// Design: deep navy header, teal & coral accents, modern serif display type, clean white body.
import type jsPDFType from "jspdf";

interface ListingData {
  title: string;
  subtitle?: string;
  tagline?: string;
  highlights?: string;
  description?: string;
  itinerary?: string;
  category: string[];
  country: string[];
  city: string[];
  location?: string;
  price?: string;
  original_price?: string;
  discount_label?: string;
  valid_until?: string;
  cost_inclusions?: string;
  cost_exclusions?: string;
  other_info?: string;
  additional_info?: string;
  terms_conditions?: string;
  status?: string;
  star_category?: string;
  apartment_type?: string;
  check_in?: string;
  check_out?: string;
  amenities?: string[];
  image_urls?: string[];
  listing_type?: string;
}

type Img = HTMLImageElement | null;

const CONTACT = {
  phone:   "+971 52 999 1223",
  email:   "info@travquesttravel.com",
  website: "www.travquesttravel.com",
  company: "TravQuest Travel & Tourism LLC",
  address: "Dubai, United Arab Emirates",
};

const P = {
  dark:      "#0d1b2a",   // deep navy — premium header/footer
  teal:      "#00B5A3",   // primary brand accent
  coral:     "#f2836f",   // secondary accent
  coralSoft: "#fad5cc",   // light coral for secondary text
  slate:     "#374151",   // body text
  muted:     "#6b7280",   // secondary / muted text
  soft:      "#f9fafb",   // clean cool background
  white:     "#ffffff",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripHtml(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ").replace(/<\/li>/gi, "\n")
    .replace(/<\/?(ul|ol|p|div|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ")
    .replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
}

function money(v?: string): string {
  if (!v) return "";
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n.toLocaleString("en-AE") : v;
}

function trunc(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trim() + "…" : t;
}

function safeArr(a?: string[]): string[] {
  return (a ?? []).map(s => String(s).trim()).filter(Boolean);
}

async function toDataUrl(src?: string): Promise<string | null> {
  if (!src) return null;
  try {
    // R2 sends no CORS headers, so a direct cross-origin fetch always fails —
    // route it through our own same-origin proxy instead.
    const proxied = `/api/image-proxy?url=${encodeURIComponent(src)}`;
    const r = await fetch(proxied);
    if (!r.ok) return null;
    const blob = await r.blob();
    return new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onloadend = () => res(String(fr.result));
      fr.onerror = () => rej(fr.error);
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}

async function loadImg(src?: string): Promise<Img> {
  const url = await toDataUrl(src);
  if (!url) return null;
  return new Promise<Img>(res => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = url;
  });
}

// ── Canvas primitives ─────────────────────────────────────────────────────────

function imgCover(ctx: CanvasRenderingContext2D, img: Img, x: number, y: number, w: number, h: number) {
  if (!img) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, P.dark); g.addColorStop(1, "#060f18");
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    return;
  }
  const s = Math.max(w / img.width, h / img.height);
  ctx.drawImage(img, (img.width - w/s)/2, (img.height - h/s)/2, w/s, h/s, x, y, w, h);
}

function imgContain(ctx: CanvasRenderingContext2D, img: Img, x: number, y: number, w: number, h: number) {
  if (!img) return;
  const s = Math.min(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function rrClip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const R = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+R, y);
  ctx.lineTo(x+w-R, y); ctx.arcTo(x+w, y,   x+w, y+R,   R);
  ctx.lineTo(x+w, y+h-R); ctx.arcTo(x+w, y+h, x+w-R, y+h, R);
  ctx.lineTo(x+R, y+h);   ctx.arcTo(x,   y+h, x,   y+h-R, R);
  ctx.lineTo(x,   y+R);   ctx.arcTo(x,   y,   x+R, y,     R);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxW: number, lh: number, maxLines = 99,
): number {
  if (!text.trim()) return y;
  const words = text.split(/\s+/).filter(Boolean);
  let line = "", n = 0;
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) {
      ctx.fillText(line, x, y); y += lh; n++;
      line = w; if (n >= maxLines - 1) break;
    } else line = next;
  }
  if (line && n < maxLines) { ctx.fillText(line, x, y); y += lh; }
  return y;
}

function tealRule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, thick = 1.5) {
  ctx.save();
  ctx.strokeStyle = P.teal; ctx.lineWidth = thick;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  ctx.restore();
}

function doubleRule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  tealRule(ctx, x, y,     w, 2);
  tealRule(ctx, x, y + 5, w, 0.75);
}

function qrStamp(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = P.white; ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = P.teal; ctx.lineWidth = 2; ctx.strokeRect(x+2, y+2, size-4, size-4);
  const c = size / 9;
  const finder = (fx: number, fy: number) => {
    ctx.fillStyle = P.dark;
    ctx.fillRect(x+fx*c, y+fy*c, c*3, c*3);
    ctx.fillStyle = P.white;
    ctx.fillRect(x+(fx+0.7)*c, y+(fy+0.7)*c, c*1.6, c*1.6);
    ctx.fillStyle = P.teal;
    ctx.fillRect(x+(fx+1.1)*c, y+(fy+1.1)*c, c*0.8, c*0.8);
  };
  finder(1,1); finder(5,1); finder(1,5);
  ctx.fillStyle = P.dark;
  [[5,5],[7,5],[4,6],[6,6],[8,6],[5,7],[7,7],[3,8],[6,8],[8,8]]
    .forEach(([px,py]) => ctx.fillRect(x+px*c, y+py*c, c*0.8, c*0.8));
}

function tick(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x, y+4); ctx.lineTo(x+5, y+9); ctx.lineTo(x+13, y-1);
  ctx.stroke();
  ctx.restore();
}

function cross(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = P.muted; ctx.lineWidth = 2.5; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x+10, y+10);
  ctx.moveTo(x+10, y); ctx.lineTo(x, y+10);
  ctx.stroke();
  ctx.restore();
}

// ── Listing type → display label ─────────────────────────────────────────────

function typeLabel(data: ListingData): string {
  const t = (data.listing_type || "").toLowerCase();
  if (t === "hotels")     return "Hotel";
  if (t === "apartments") return "Apartment";
  if (t === "tours")      return "Tour Package";
  if (t === "packages")   return "Travel Package";
  if (t === "promotions") return "Special Offer";
  if (t === "meetings")   return "Meetings & Events";
  if (t === "airports")   return "Airport Service";
  if (t === "visas")      return "Visa Service";
  if (t === "corporate")  return "Corporate Travel";
  if (t === "shop")       return "Travel Shop";
  return safeArr(data.category)[0] || "Travel Listing";
}

function aboutLabel(data: ListingData): string {
  const t = (data.listing_type || "").toLowerCase();
  if (t === "hotels")     return "ABOUT THIS HOTEL";
  if (t === "apartments") return "ABOUT THIS APARTMENT";
  if (t === "tours")      return "ABOUT THIS TOUR";
  if (t === "packages")   return "ABOUT THIS PACKAGE";
  if (t === "promotions") return "ABOUT THIS OFFER";
  if (t === "meetings")   return "VENUE & FACILITIES";
  if (t === "airports")   return "SERVICE DETAILS";
  if (t === "visas")      return "VISA INFORMATION";
  if (t === "corporate")  return "CORPORATE DETAILS";
  return "ABOUT THIS LISTING";
}

// ── Layout constants ──────────────────────────────────────────────────────────

const Z = {
  HDR_BTM:   580,
  HERO_X:    500,
  STRIP_TOP: 620,
  STRIP_BTM: 860,
  ABOUT_TOP: 900,
  DIV1:      1110,
  COL_TOP:   1150,
  COL_BTM:   1430,
  BAND_TOP:  1460,
  BAND_BTM:  1610,
  FTR_TOP:   1650,
  FTR_BTM:   1754,
};

const MARGIN = 68;
const IW = 1240 - MARGIN * 2;

// ── Main canvas renderer ──────────────────────────────────────────────────────

function drawFlyer(
  data: ListingData,
  imgs: { logo: Img; hero: Img; img2: Img; img3: Img; img4: Img },
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1240; canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const W = canvas.width;

  const title     = trunc(data.title || "Exclusive Travel Offer", 42);
  const subtitle  = trunc(stripHtml(data.subtitle || data.tagline || ""), 72);
  const desc      = stripHtml(data.description || data.highlights || data.additional_info || "");
  const about     = trunc(desc, 340);
  const cityList  = safeArr(data.city);
  const countryList = safeArr(data.country);
  const locationStr = data.location
    ? trunc(data.location, 50)
    : [...cityList, ...countryList].join("  ·  ");
  const price     = money(data.price) || "On Request";
  const origPrice = money(data.original_price);
  const discount  = data.discount_label || "";
  const validTil  = data.valid_until || "";
  const cats      = safeArr(data.category).slice(0, 4);
  const type      = typeLabel(data);
  const aboutHead = aboutLabel(data);

  const rawInc = stripHtml(data.cost_inclusions);
  let incLines: string[];
  if (rawInc) {
    incLines = rawInc.split("\n").map(l => l.replace(/^[•\-]\s*/, "").trim()).filter(Boolean).slice(0, 7);
  } else if (data.amenities?.length) {
    incLines = data.amenities.slice(0, 7).map(a => String(a).trim()).filter(Boolean);
  } else {
    incLines = [];
  }
  const incLabel = data.amenities?.length && !data.cost_inclusions ? "AMENITIES" : "INCLUDED";

  const exLines = stripHtml(data.cost_exclusions)
    .split("\n").map(l => l.replace(/^[•\-]\s*/, "").trim()).filter(Boolean).slice(0, 6);

  const fallbackInc = ["Hotel Accommodation","Daily Breakfast","Airport Transfers",
                       "Tour Guide","Entry Tickets","Travel Insurance","Visa Assistance"];

  // BASE
  ctx.fillStyle = P.soft;
  ctx.fillRect(0, 0, W, canvas.height);

  // ── HEADER ────────────────────────────────────────────────────────────────
  const HH = Z.HDR_BTM;
  const HX = Z.HERO_X;

  ctx.fillStyle = P.dark;
  ctx.fillRect(0, 0, W, HH);

  // Hero photo — right side
  ctx.save();
  ctx.beginPath(); ctx.rect(HX, 0, W - HX, HH); ctx.clip();
  imgCover(ctx, imgs.hero, HX, 0, W - HX, HH);
  const fadeL = ctx.createLinearGradient(HX, 0, HX + 280, 0);
  fadeL.addColorStop(0, "rgba(13,27,42,1)"); fadeL.addColorStop(1, "rgba(13,27,42,0)");
  ctx.fillStyle = fadeL; ctx.fillRect(HX, 0, 280, HH);
  const fadeB = ctx.createLinearGradient(0, HH - 140, 0, HH);
  fadeB.addColorStop(0, "rgba(13,27,42,0)"); fadeB.addColorStop(1, "rgba(13,27,42,0.72)");
  ctx.fillStyle = fadeB; ctx.fillRect(HX, 0, W - HX, HH);
  ctx.restore();

  // Teal top stripe
  ctx.fillStyle = P.teal; ctx.fillRect(0, 0, W, 6);
  // Vertical teal seam
  ctx.fillStyle = P.teal; ctx.fillRect(HX, 0, 3, HH);

  // Logo
  if (imgs.logo) {
    imgContain(ctx, imgs.logo, MARGIN, 24, 230, 76);
  } else {
    ctx.font = "800 34px Georgia, serif";
    ctx.fillStyle = P.coral;
    ctx.fillText("Trav", MARGIN, 82);
    ctx.fillStyle = P.coralSoft;
    ctx.fillText("Quest", MARGIN + ctx.measureText("Trav").width, 82);
  }

  doubleRule(ctx, MARGIN, 112, 360);

  // Eyebrow
  ctx.fillStyle = P.teal;
  ctx.font = "700 11px Arial, sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText(type.toUpperCase(), MARGIN, 158);
  ctx.letterSpacing = "0px";

  // Title
  ctx.fillStyle = P.white; ctx.font = "800 62px Georgia, serif";
  const tw = title.split(" "); const mid = Math.ceil(tw.length / 2);
  ctx.fillText(tw.slice(0, mid).join(" "), MARGIN, 232);
  const l2 = tw.slice(mid).join(" ");
  if (l2) ctx.fillText(l2, MARGIN, 302);

  // Subtitle
  if (subtitle) {
    ctx.fillStyle = P.coralSoft; ctx.font = "italic 300 20px Georgia, serif";
    wrapText(ctx, subtitle, MARGIN, 340, 390, 30, 2);
  }

  // Location
  if (locationStr) {
    ctx.fillStyle = P.teal; ctx.font = "600 15px Arial, sans-serif";
    ctx.fillText("⦿  " + locationStr, MARGIN, 392);
  }

  // Category badges
  let bx = MARGIN;
  cats.forEach(cat => {
    ctx.font = "600 12px Arial, sans-serif";
    const bw = ctx.measureText(cat).width + 26;
    ctx.strokeStyle = "rgba(0,181,163,0.55)"; ctx.lineWidth = 1;
    ctx.save(); rrClip(ctx, bx, 410, bw, 28, 14); ctx.stroke(); ctx.restore();
    ctx.fillStyle = P.coral; ctx.fillText(cat, bx + 13, 429);
    bx += bw + 12;
  });

  // Price panel
  const PX = MARGIN, PY = 456, PW2 = 340, PH = 98;
  ctx.fillStyle = "rgba(0,0,0,0.38)"; ctx.fillRect(PX, PY, PW2, PH);
  ctx.strokeStyle = P.teal; ctx.lineWidth = 1.5; ctx.strokeRect(PX, PY, PW2, PH);
  ctx.fillStyle = P.coral; ctx.fillRect(PX, PY, PW2, 3);

  ctx.fillStyle = P.coralSoft;
  ctx.font = "700 11px Arial, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("STARTING FROM", PX + 18, PY + 26);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = P.white; ctx.font = "900 48px Arial, sans-serif";
  ctx.fillText(`AED ${price}`, PX + 18, PY + 83);

  if (origPrice || discount || validTil || data.star_category) {
    let ry = PY + 26;
    const rx = PX + PW2 + 20;
    if (origPrice) {
      ctx.fillStyle = "rgba(255,255,255,0.40)"; ctx.font = "400 14px Arial, sans-serif";
      ctx.fillText(`was AED ${origPrice}`, rx, ry);
      const stw = ctx.measureText(`was AED ${origPrice}`).width;
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(rx, ry-6); ctx.lineTo(rx+stw, ry-6); ctx.stroke();
      ry += 26;
    }
    if (data.star_category) {
      ctx.fillStyle = P.coral; ctx.font = "700 14px Arial, sans-serif";
      ctx.fillText(`★  ${data.star_category}`, rx, ry); ry += 26;
    }
    if (discount) {
      ctx.fillStyle = P.teal; ctx.font = "700 18px Arial, sans-serif";
      ctx.fillText(discount, rx, ry); ry += 26;
    }
    if (validTil) {
      ctx.fillStyle = "rgba(255,255,255,0.36)"; ctx.font = "400 13px Arial, sans-serif";
      ctx.fillText(`Valid until ${validTil}`, rx, ry); ry += 22;
    }
    if (data.check_in || data.check_out) {
      ctx.fillStyle = "rgba(255,255,255,0.50)"; ctx.font = "400 12px Arial, sans-serif";
      if (data.check_in)  { ctx.fillText(`Check-in: ${data.check_in}`,   rx, ry); ry += 18; }
      if (data.check_out) { ctx.fillText(`Check-out: ${data.check_out}`, rx, ry); }
    }
  }

  // ── PHOTO STRIP ───────────────────────────────────────────────────────────
  const ST = Z.STRIP_TOP, SH = Z.STRIP_BTM - Z.STRIP_TOP;
  const GAP = 18, SW = (IW - GAP * 2) / 3;

  ctx.fillStyle = P.soft;
  ctx.fillRect(0, Z.HDR_BTM, W, Z.STRIP_BTM - Z.HDR_BTM);

  [imgs.img2, imgs.img3, imgs.img4].forEach((img, i) => {
    const ix = MARGIN + i * (SW + GAP);
    ctx.save(); rrClip(ctx, ix, ST, SW, SH, 6); ctx.clip();
    imgCover(ctx, img, ix, ST, SW, SH);
    const sv = ctx.createLinearGradient(ix, ST + SH * 0.6, ix, ST + SH);
    sv.addColorStop(0, "rgba(0,0,0,0)"); sv.addColorStop(1, "rgba(0,0,0,0.44)");
    ctx.fillStyle = sv; ctx.fillRect(ix, ST, SW, SH);
    ctx.restore();
    ctx.fillStyle = P.teal; ctx.fillRect(ix, ST, SW, 3);
  });

  // ── ABOUT ─────────────────────────────────────────────────────────────────
  const AT = Z.ABOUT_TOP;
  ctx.fillStyle = P.teal;
  ctx.font = "700 11px Arial, sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText(aboutHead, MARGIN, AT + 20);
  ctx.letterSpacing = "0px";
  doubleRule(ctx, MARGIN, AT + 28, IW);
  ctx.fillStyle = P.slate; ctx.font = "400 20px Georgia, serif";
  wrapText(ctx, about || "Discover an exceptional curated travel experience designed by TravQuest.", MARGIN, AT + 70, IW, 32, 5);

  // ── INCLUSIONS / EXCLUSIONS ───────────────────────────────────────────────
  doubleRule(ctx, MARGIN, Z.DIV1, IW);
  const CT = Z.COL_TOP, CW = (IW - 40) / 2, C2X = MARGIN + CW + 40;

  ctx.fillStyle = P.teal;
  ctx.font = "700 11px Arial, sans-serif";
  ctx.letterSpacing = "5px";
  ctx.fillText(incLabel, MARGIN, CT + 20);
  ctx.letterSpacing = "0px";
  tealRule(ctx, MARGIN, CT + 28, CW, 1);

  const shownInc = incLines.length ? incLines : fallbackInc;
  ctx.font = "400 19px Arial, sans-serif";
  let iy = CT + 60;
  shownInc.slice(0, 7).forEach(item => {
    tick(ctx, MARGIN, iy - 12, P.teal);
    ctx.fillStyle = P.slate;
    iy = wrapText(ctx, trunc(item, 44), MARGIN + 28, iy, CW - 28, 26, 2);
    iy += 8;
  });

  ctx.fillStyle = "rgba(0,181,163,0.25)";
  ctx.fillRect(MARGIN + CW + 19, CT, 1, Z.COL_BTM - CT - 20);

  if (exLines.length > 0) {
    ctx.fillStyle = P.teal;
    ctx.font = "700 11px Arial, sans-serif";
    ctx.letterSpacing = "5px";
    ctx.fillText("NOT INCLUDED", C2X, CT + 20);
    ctx.letterSpacing = "0px";
    tealRule(ctx, C2X, CT + 28, CW, 1);
    ctx.font = "400 19px Arial, sans-serif";
    let ey = CT + 60;
    exLines.forEach(item => {
      cross(ctx, C2X, ey - 12);
      ctx.fillStyle = P.muted;
      ey = wrapText(ctx, trunc(item, 44), C2X + 28, ey, CW - 28, 26, 2);
      ey += 8;
    });
  } else {
    ctx.fillStyle = P.teal;
    ctx.font = "700 11px Arial, sans-serif";
    ctx.letterSpacing = "5px";
    ctx.fillText("CONTACT US", C2X, CT + 20);
    ctx.letterSpacing = "0px";
    tealRule(ctx, C2X, CT + 28, CW, 1);
    ctx.fillStyle = P.muted; ctx.font = "italic 400 17px Georgia, serif";
    ctx.fillText("Contact our team for full package details", C2X, CT + 68);
    ctx.fillText("and custom itinerary options.", C2X, CT + 100);
  }

  doubleRule(ctx, MARGIN, Z.COL_BTM, IW);

  // ── INFO BAND ─────────────────────────────────────────────────────────────
  const BT = Z.BAND_TOP, BH = Z.BAND_BTM - Z.BAND_TOP;
  ctx.fillStyle = P.dark; ctx.fillRect(0, BT, W, BH);
  ctx.fillStyle = P.teal; ctx.fillRect(0, BT, W, 3);
  ctx.fillStyle = P.teal; ctx.fillRect(0, BT + BH - 3, W, 3);

  const destLabel = data.location
    ? trunc(data.location, 26)
    : safeArr([...cityList, ...countryList]).slice(0, 2).join(", ") || "Multiple Destinations";

  const stats = [
    { label: "DESTINATION", value: destLabel },
    { label: "TYPE",         value: type     },
    { label: "BOOK NOW",     value: CONTACT.phone },
  ];
  const statW = IW / 3;

  stats.forEach(({ label, value }, i) => {
    const sx = MARGIN + i * statW + statW / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = P.coralSoft;
    ctx.font = "700 11px Arial, sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText(label, sx, BT + 50);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = i === 2 ? P.teal : P.white;
    ctx.font = "800 24px Arial, sans-serif";
    ctx.fillText(trunc(value, 26), sx, BT + 92);
    ctx.textAlign = "left";
    if (i < 2) {
      ctx.fillStyle = "rgba(0,181,163,0.25)";
      ctx.fillRect(MARGIN + (i+1) * statW, BT + 28, 1, BH - 56);
    }
  });
  ctx.textAlign = "left";

  // Terms
  const termsRaw = stripHtml(data.terms_conditions || data.other_info || "");
  if (termsRaw) {
    ctx.fillStyle = P.muted; ctx.font = "700 13px Arial, sans-serif";
    ctx.fillText("Terms & Conditions", MARGIN, Z.BAND_BTM + 30);
    ctx.font = "400 14px Arial, sans-serif";
    wrapText(ctx, trunc(termsRaw, 220), MARGIN, Z.BAND_BTM + 52, IW, 22, 3);
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const FT = Z.FTR_TOP, FH = Z.FTR_BTM - Z.FTR_TOP;
  ctx.fillStyle = P.dark; ctx.fillRect(0, FT, W, FH);
  ctx.fillStyle = P.teal; ctx.fillRect(0, FT, W, 3);

  if (imgs.logo) {
    imgContain(ctx, imgs.logo, MARGIN, FT + 10, 200, 66);
  } else {
    ctx.font = "700 22px Georgia, serif";
    ctx.fillStyle = P.coral;
    ctx.fillText("Trav", MARGIN, FT + 52);
    ctx.fillStyle = P.coralSoft;
    ctx.fillText("Quest", MARGIN + ctx.measureText("Trav").width, FT + 52);
  }
  ctx.fillStyle = "rgba(0,181,163,0.60)"; ctx.font = "400 12px Arial, sans-serif";
  ctx.fillText(CONTACT.address, MARGIN, FT + 82);

  const cfx = 480;
  ctx.font = "400 15px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(`✉  ${CONTACT.email}`, cfx, FT + 36);
  ctx.fillText(`☎  ${CONTACT.phone}`, cfx, FT + 60);
  ctx.fillStyle = P.teal;
  ctx.fillText(`🌐  ${CONTACT.website}`, cfx, FT + 84);

  qrStamp(ctx, W - MARGIN - 76, FT + 14, 76);

  // Bottom dual-colour brand stripe
  const H = canvas.height;
  ctx.fillStyle = P.teal;   ctx.fillRect(0,                    H - 8, Math.round(W * 0.62), 8);
  ctx.fillStyle = P.coral;  ctx.fillRect(Math.round(W * 0.62), H - 8, W - Math.round(W * 0.62), 8);

  return canvas;
}

// ─── Detailed text pages ──────────────────────────────────────────────────────

function addDetails(doc: jsPDFType, data: ListingData) {
  const rows: [string, string][] = [
    ["Highlights",             stripHtml(data.highlights)],
    ["Itinerary",              stripHtml(data.itinerary)],
    ["Cost Inclusions",        stripHtml(data.cost_inclusions)],
    ["Cost Exclusions",        stripHtml(data.cost_exclusions)],
    ["Additional Information", stripHtml(data.additional_info || data.other_info)],
    ["Terms & Conditions",     stripHtml(data.terms_conditions)],
  ].filter(([, t]) => t) as [string, string][];

  if (data.check_in)      rows.unshift(["Check-in Time",  data.check_in]);
  if (data.check_out)     rows.unshift(["Check-out Time", data.check_out]);
  if (data.star_category) rows.unshift(["Star Category",  data.star_category]);

  if (!rows.length) return;

  const PW = 210, M = 16;
  let y = 28;

  const pageHead = () => {
    doc.setFillColor(13, 27, 42); doc.rect(0, 0, PW, 16, "F");
    doc.setFillColor(0, 181, 163); doc.rect(0, 15, PW, 1, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.setTextColor(242, 131, 111);
    doc.text("TravQuest", M, 11);
    doc.setTextColor(220, 220, 220);
    doc.text(trunc(data.title || "", 52), PW - M, 11, { align: "right" });
  };

  doc.addPage();
  pageHead();

  rows.forEach(([label, text]) => {
    if (y > 250) { doc.addPage(); pageHead(); y = 28; }

    doc.setFillColor(0, 181, 163); doc.rect(M, y - 3, 2, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39);
    doc.text(label, M + 7, y + 3);
    y += 13;

    doc.setDrawColor(0, 181, 163); doc.setLineWidth(0.4);
    doc.line(M, y, PW - M, y);
    y += 6;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    (doc.splitTextToSize(text, PW - M * 2) as string[]).forEach(line => {
      if (y > 276) { doc.addPage(); pageHead(); y = 28; }
      doc.text(line, M, y); y += 5.5;
    });
    y += 9;
  });

  doc.setFillColor(13, 27, 42); doc.rect(0, 282, PW, 15, "F");
  doc.setFillColor(0, 181, 163); doc.rect(0, 281, PW, 1, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
  doc.setTextColor(0, 181, 163);  doc.text(CONTACT.website, M, 291);
  doc.setTextColor(180, 180, 180); doc.text(CONTACT.phone,   PW/2, 291, { align: "center" });
  doc.setTextColor(180, 180, 180); doc.text(CONTACT.email,   PW-M, 291, { align: "right" });
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function exportListingPDF(data: ListingData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const urls = data.image_urls ?? [];

  const [logo, hero, img2, img3, img4] = await Promise.all([
    loadImg("/tq-logo.png"),
    loadImg(urls[0] || "/sale.jpg"),
    loadImg(urls[1] || urls[0] || "/airplane1.jpg"),
    loadImg(urls[2] || urls[0] || "/beach.jpg"),
    loadImg(urls[3] || urls[1] || "/hallstatt.jpeg"),
  ]);

  const flyer = drawFlyer(data, { logo, hero, img2, img3, img4 });
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.addImage(flyer.toDataURL("image/jpeg", 0.97), "JPEG", 0, 0, 210, 297, undefined, "FAST");
  addDetails(doc, data);

  const slug = (data.title || "listing")
    .replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
  doc.save(`TravQuest_${slug || "listing"}.pdf`);
}

// backward-compat alias
export const exportPromotionPDF = exportListingPDF;
