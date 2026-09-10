import { supabaseRest, verifyAdmin } from "../../../../lib/supabase-rest";

const PROFILE_ID = "315379493";
const VINTED_ORIGIN = "https://www.vinted.lu";
const browserHeaders = {
  "accept-language": "fr-FR,fr;q=0.9,en;q=0.7",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
};
type VintedItem = Record<string, any>;

function text(value: unknown, fallback = "") { return typeof value === "string" ? value : fallback; }
function amount(value: any) {
  const parsed = Number(value?.amount ?? value?.numeric_amount ?? value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function publicImage(photo: any) {
  return text(photo) || text(photo?.url) || text(photo?.full_size_url) || text(photo?.image_url) || text(photo?.high_resolution?.url);
}
function categoryOf(item: VintedItem) {
  const value = `${text(item.catalog?.title)} ${text(item.title)}`.toLowerCase();
  if (/chauss|sneaker|basket|nike|adidas|reebok|jordan|puma|asics|new balance/.test(value)) return "Sneakers";
  if (/sac|montre|casquette|ceinture|lunette|accessoire/.test(value)) return "Accessoires";
  return "Vêtements";
}
async function api(path: string) {
  const response = await fetch(`${VINTED_ORIGIN}${path}`, { headers: { ...browserHeaders, accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}
async function html(url: string) {
  const response = await fetch(url, { headers: { ...browserHeaders, accept: "text/html,application/xhtml+xml" }, cache: "no-store", redirect: "follow" });
  if (!response.ok) throw new Error(String(response.status));
  return response.text();
}
function itemLinks(source: string) {
  const normalized = source.replace(/\\u002F/g, "/").replace(/\\\//g, "/").replace(/&amp;/g, "&");
  const found = new Map<string,string>();
  for (const match of normalized.matchAll(/(?:https?:\/\/www\.vinted\.lu)?\/items\/(\d+)(?:-[^"'<>\\\s?]+)?/g)) {
    const id = match[1];
    found.set(id, match[0].startsWith("http") ? match[0] : `${VINTED_ORIGIN}${match[0]}`);
  }
  return [...found].map(([id,url]) => ({ id: Number(id), url }));
}
function fromStructuredData(source: string, fallback: VintedItem): VintedItem {
  const scripts = [...source.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1]);
      const candidates = Array.isArray(parsed) ? parsed : parsed?.["@graph"] || [parsed];
      const product = candidates.find((entry:any) => entry?.["@type"] === "Product");
      if (!product) continue;
      const images = (Array.isArray(product.image) ? product.image : [product.image]).filter(Boolean);
      return {
        ...fallback,
        title: text(product.name, text(fallback.title)),
        description: text(product.description),
        photos: images,
        price: product.offers?.price,
        brand_title: text(product.brand?.name || product.brand),
        color1: text(product.color),
        size_title: text(product.size),
        status: text(product.itemCondition).split("/").pop() || "Voir l’annonce",
      };
    } catch {}
  }
  const title = source.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1];
  const image = source.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1];
  const description = source.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1];
  return { ...fallback, title: title || fallback.title, description: description || "", photos: image ? [image] : [] };
}
async function detailFor(item: VintedItem) {
  try {
    const data = await api(`/api/v2/items/${item.id}`);
    return data.item || item;
  } catch {
    try { return fromStructuredData(await html(text(item.url, `${VINTED_ORIGIN}/items/${item.id}`)), item); }
    catch { return item; }
  }
}
async function publicDressingItems() {
  try {
    const data = await api(`/api/v2/users/${PROFILE_ID}/items?page=1&per_page=96&order=newest_first`);
    if (Array.isArray(data.items) && data.items.length) return data.items as VintedItem[];
  } catch {}
  const page = await html(`${VINTED_ORIGIN}/member/${PROFILE_ID}`);
  return itemLinks(page);
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) return Response.json({ error: "Session expirée ou adresse ADMIN_EMAIL incorrecte. Reconnecte-toi puis vérifie la variable Vercel." }, { status: 401 });
    let submitted: unknown = undefined;
    try { submitted = await request.json(); } catch {}
    const rawUrls = Array.isArray((submitted as { urls?: unknown })?.urls) ? (submitted as { urls: unknown[] }).urls : [];
    const directItems: VintedItem[] = [];
    for (const raw of rawUrls.slice(0, 60)) {
      try {
        const url = new URL(String(raw).trim());
        if (!/(^|\\.)vinted\\.lu$/i.test(url.hostname)) continue;
        const id = url.pathname.match(/^\\/items\\/(\\d+)/)?.[1];
        if (id) directItems.push({ id: Number(id), url: `${VINTED_ORIGIN}${url.pathname}` });
      } catch {}
    }
    const listed = directItems.length ? directItems : await publicDressingItems();
    if (!listed.length) return Response.json({ error: "Aucun lien d’annonce Vinted valide n’a été trouvé." }, { status: 422 });

    const existingResponse = await supabaseRest("/rest/v1/products?select=vinted_url");
    const existingRows = existingResponse.ok ? await existingResponse.json() as { vinted_url?: string }[] : [];
    const existing = new Set(existingRows.map(row => row.vinted_url).filter(Boolean));
    const imported: Record<string,unknown>[] = [];

    for (const listedItem of listed.slice(0,60)) {
      const item = await detailFor(listedItem);
      const vintedUrl = text(item.url) || `${VINTED_ORIGIN}/items/${item.id}`;
      if (existing.has(vintedUrl)) continue;
      const images = (Array.isArray(item.photos) ? item.photos : []).map(publicImage).filter(Boolean);
      const fallbackImage = publicImage(item.photo);
      if (!images.length && fallbackImage) images.push(fallbackImage);
      const favorites = Number(item.favourite_count ?? item.favorites_count ?? item.favourites_count ?? 0);
      const details = [
        text(item.size_title || item.size?.title) && `Taille : ${text(item.size_title || item.size?.title)}`,
        favorites > 0 ? `${favorites} favori${favorites > 1 ? "s" : ""} sur Vinted` : "",
        "Importé depuis le dressing Vinted StoreIMR",
      ].filter(Boolean);
      const price = amount(item.price);
      if (!text(item.title) || !price) continue;
      imported.push({
        name:text(item.title),brand:text(item.brand_title || item.brand?.title,"Non précisée"),category:categoryOf(item),
        size:text(item.size_title || item.size?.title,"Non précisée"),condition:text(item.status || item.status_title,"Voir l’annonce"),
        price,color:text(item.color1 || item.color?.title,"Voir les photos"),description:text(item.description,text(item.title)),
        details,vinted_url:vintedUrl,image_urls:images,active:true,
      });
      existing.add(vintedUrl);
    }
    if (imported.length) {
      const save = await supabaseRest("/rest/v1/products", { method:"POST",headers:{"content-type":"application/json",prefer:"return=minimal"},body:JSON.stringify(imported) });
      if (!save.ok) throw new Error(`Enregistrement impossible : ${await save.text()}`);
    }
    return Response.json({ imported:imported.length,found:listed.length,skipped:listed.length-imported.length,note:"Lecture réalisée depuis les pages publiques Vinted." });
  } catch (error) {
    const status = error instanceof Error ? error.message : "";
    return Response.json({ error: status === "401" ? "Vinted bloque aussi temporairement la page publique. Réessaie plus tard ou importe les liens individuellement." : "Lecture du dressing Vinted impossible." }, { status:502 });
  }
}
