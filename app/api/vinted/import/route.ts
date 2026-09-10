import { supabaseRest, uploadProductImages, verifyAdmin } from "../../../../lib/supabase-rest";

const PROFILE_ID = "315379493";
const VINTED_ORIGIN = "https://www.vinted.lu";
const VINTED_HOST = /^(?:www\.)?vinted\.(?:fr|lu|be|de|nl|es|it|pt|com)$/i;
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
function cleanUrl(value: string) {
  return value.replace(/\\u002F/gi, "/").replace(/\\u0026/gi, "&").replace(/\\\//g, "/").replace(/&amp;/g, "&").replace(/&quot;.*$/i, "");
}
function publicImage(photo: any) {
  const value = text(photo) || text(photo?.full_size_url) || text(photo?.high_resolution?.url) || text(photo?.url) || text(photo?.image_url);
  return value ? cleanUrl(value) : "";
}
function unique(values: string[]) {
  return [...new Set(values.map(value => cleanUrl(value).trim()).filter(Boolean))];
}
function isVintedImage(url: string) {
  try { return /(^|\.)vinted\.net$/i.test(new URL(url).hostname); } catch { return false; }
}
function isUsableImage(url: string) {
  try {
    const parsed = new URL(url);
    return !isVintedImage(url) || (!!parsed.searchParams.get("s") && /\/f\d+\//i.test(parsed.pathname));
  } catch { return false; }
}
async function persistImages(urls: string[], itemId: number) {
  const files: File[] = [];
  for (const [index, url] of unique(urls).filter(isUsableImage).slice(0, 20).entries()) {
    try {
      const response = await fetch(url, { headers: { ...browserHeaders, accept: "image/avif,image/webp,image/*" }, cache: "no-store" });
      if (!response.ok) continue;
      const type = response.headers.get("content-type") || "image/webp";
      if (!type.startsWith("image/")) continue;
      const blob = await response.blob();
      if (!blob.size) continue;
      const extension = type.includes("png") ? "png" : type.includes("jpeg") ? "jpg" : "webp";
      files.push(new File([blob], `vinted-${itemId}-${index + 1}.${extension}`, { type }));
    } catch {}
  }
  if (!files.length) return [];
  try { return await uploadProductImages(files); } catch { return []; }
}
function attributeValue(item: VintedItem, names: RegExp) {
  const groups = [item.item_attributes, item.attributes, item.item_details].filter(Array.isArray);
  for (const group of groups) {
    for (const entry of group) {
      const label = text(entry?.name || entry?.title || entry?.code);
      if (!names.test(label)) continue;
      const value = entry?.value_title || entry?.value?.title || entry?.value || entry?.display_value;
      if (Array.isArray(value)) return value.map(part => text(part?.title || part)).filter(Boolean).join(", ");
      if (typeof value === "number") return String(value);
      if (text(value)) return text(value);
    }
  }
  return "";
}
function sizeOf(item: VintedItem) {
  return text(item.size_title || item.size?.title || item.size_name) || attributeValue(item, /taille|pointure|size/i);
}
function conditionOf(item: VintedItem) {
  return text(item.status_title || item.condition_title || item.status?.title || item.condition?.title || item.status) || attributeValue(item, /état|condition|status/i);
}
function brandOf(item: VintedItem) {
  return text(item.brand_title || item.brand?.title || item.brand?.name || item.brand_name) || attributeValue(item, /marque|brand/i);
}
function colorOf(item: VintedItem) {
  const colors = Array.isArray(item.colors) ? item.colors.map((color:any) => text(color?.title || color)).filter(Boolean).join(", ") : "";
  return text(item.color1 || item.color?.title || item.color_title) || colors || attributeValue(item, /couleur|color/i);
}
function materialOf(item: VintedItem) {
  const materials = Array.isArray(item.materials) ? item.materials.map((material:any) => text(material?.title || material)).filter(Boolean).join(", ") : "";
  return text(item.material_title || item.material?.title || item.material) || materials || attributeValue(item, /matière|material|composition/i);
}
function detailsFor(item: VintedItem, favorites: number) {
  const size = sizeOf(item);
  const category = categoryOf(item);
  return [
    brandOf(item) && `Marque : ${brandOf(item)}`,
    size && `${category === "Sneakers" ? "Pointure" : "Taille"} : ${size}`,
    conditionOf(item) && `État : ${conditionOf(item)}`,
    colorOf(item) && `Couleur : ${colorOf(item)}`,
    materialOf(item) && `Matière : ${materialOf(item)}`,
    text(item.catalog?.title) && `Catégorie Vinted : ${text(item.catalog?.title)}`,
    favorites > 0 ? `${favorites} favori${favorites > 1 ? "s" : ""} sur Vinted` : "",
  ].filter(Boolean) as string[];
}
function categoryOf(item: VintedItem) {
  const value = `${text(item.catalog?.title)} ${text(item.title)}`.toLowerCase();
  if (/chauss|sneaker|basket|nike|adidas|reebok|jordan|puma|asics|new balance/.test(value)) return "Sneakers";
  if (/sac|montre|casquette|ceinture|lunette|accessoire/.test(value)) return "Accessoires";
  return "Vêtements";
}
async function anonymousSession(origin: string) {
  try {
    const response = await fetch(origin, { headers: { ...browserHeaders, accept: "text/html,application/xhtml+xml" }, cache: "no-store", redirect: "follow" });
    const values = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() || [response.headers.get("set-cookie") || ""];
    const cookie = values.map(value => value.split(";")[0]).filter(Boolean).join("; ");
    const csrfValue = values.join(";").match(/(?:^|[;,]\s*)XSRF-TOKEN=([^;]+)/i)?.[1];
    return { cookie, csrf: csrfValue ? decodeURIComponent(csrfValue) : "" };
  } catch { return { cookie: "", csrf: "" }; }
}
async function api(path: string, origin = VINTED_ORIGIN) {
  const requestHeaders: Record<string,string> = { ...browserHeaders, accept: "application/json", referer: `${origin}/` };
  let response = await fetch(`${origin}${path}`, { headers: requestHeaders, cache: "no-store" });
  if (response.status === 401 || response.status === 403) {
    const session = await anonymousSession(origin);
    if (session.cookie) {
      response = await fetch(`${origin}${path}`, {
        headers: { ...requestHeaders, cookie: session.cookie, ...(session.csrf ? { "x-csrf-token": session.csrf } : {}) },
        cache: "no-store",
      });
    }
  }
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
function embeddedValue(source: string, keys: string[]) {
  const normalized = source.replace(/&quot;/g, '"').replace(/\\u002F/g, "/");
  for (const key of keys) {
    const match = normalized.match(new RegExp(`"${key}"\\\\s*:\\\\s*"((?:\\\\\\\\.|[^"])*)"`, "i"));
    if (!match) continue;
    try { return JSON.parse(`"${match[1]}"`); } catch { return match[1]; }
  }
  return "";
}
function findItemInJson(root: any, id: number) {
  let best: VintedItem | undefined;
  let bestScore = -1;
  const stack = [root];
  const visited = new Set<any>();
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);
    if (Array.isArray(value)) {
      stack.push(...value);
      continue;
    }
    const candidateId = Number(value.id ?? value.item_id);
    const score = (text(value.title || value.name) ? 2 : 0) + (Array.isArray(value.photos) ? 5 : 0) +
      (text(value.description) ? 2 : 0) + (value.price ? 1 : 0) + (sizeOf(value) ? 1 : 0);
    if (candidateId === id && score > bestScore) {
      best = value;
      bestScore = score;
    }
    stack.push(...Object.values(value));
  }
  return best;
}
function htmlImageUrls(source: string) {
  const normalized = source.replace(/\\u002F/gi, "/").replace(/\\u0026/gi, "&").replace(/\\\//g, "/").replace(/&amp;/g, "&");
  const urls = [...normalized.matchAll(/https?:\/\/(?:images\d*\.)?vinted\.net\/[^"'<>\\s]+/gi)].map(match => match[0]);
  return unique(urls.filter(url => /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(url)));
}
function fromStructuredData(source: string, fallback: VintedItem): VintedItem {
  const embeddedSize = embeddedValue(source, ["size_title", "size_name"]);
  const embeddedStatus = embeddedValue(source, ["status_title", "condition_title", "status"]);
  const embeddedBrand = embeddedValue(source, ["brand_title", "brand_name"]);
  const embeddedColor = embeddedValue(source, ["color1", "color_title"]);
  const embeddedMaterial = embeddedValue(source, ["material_title", "material"]);
  const scriptBodies = [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1].trim());
  const parsedScripts: any[] = [];
  for (const body of scriptBodies) {
    if (!body || (!body.startsWith("{") && !body.startsWith("["))) continue;
    try { parsedScripts.push(JSON.parse(body)); } catch {}
  }
  const embeddedItems = parsedScripts.map(value => findItemInJson(value, Number(fallback.id))).filter(Boolean) as VintedItem[];
  const best = embeddedItems.sort((a,b) => (Array.isArray(b.photos) ? b.photos.length : 0) - (Array.isArray(a.photos) ? a.photos.length : 0))[0] || {};
  const productImages: string[] = [];
  let productName = "";
  let productDescription = "";
  let productPrice: unknown;
  let productBrand = "";
  let productColor = "";
  for (const parsed of parsedScripts) {
    const candidates = Array.isArray(parsed) ? parsed : parsed?.["@graph"] || [parsed];
    const product = candidates.find((entry:any) => entry?.["@type"] === "Product");
    if (!product) continue;
    productImages.push(...(Array.isArray(product.image) ? product.image : [product.image]).map(publicImage).filter(Boolean));
    productName ||= text(product.name);
    productDescription ||= text(product.description);
    productPrice ||= product.offers?.price;
    productBrand ||= text(product.brand?.name || product.brand);
    productColor ||= text(product.color);
  }
  const ogTitle = source.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] || "";
  const ogImage = source.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1] || "";
  const ogDescription = source.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1] || "";
  const structuredPhotos = Array.isArray(best.photos) ? best.photos.map(publicImage) : [];
  const photos = unique(structuredPhotos.length ? structuredPhotos : [...productImages, publicImage(ogImage)]).filter(isUsableImage);
  return {
    ...fallback,
    ...best,
    title: text(best.title || best.name, productName || ogTitle || text(fallback.title)),
    description: text(best.description, productDescription || ogDescription),
    photos,
    price: best.price || productPrice || fallback.price,
    brand_title: brandOf(best) || embeddedBrand || productBrand,
    color1: colorOf(best) || embeddedColor || productColor,
    size_title: sizeOf(best) || embeddedSize,
    status_title: conditionOf(best) || embeddedStatus,
    material_title: materialOf(best) || embeddedMaterial,
  };
}
async function detailFor(item: VintedItem) {
  let origin = VINTED_ORIGIN;
  try {
    const itemUrl = new URL(text(item.url));
    if (VINTED_HOST.test(itemUrl.hostname)) origin = itemUrl.origin;
  } catch {}
  try {
    const data = await api(`/api/v2/items/${item.id}`, origin);
    return { ...item, ...(data.item || {}) };
  } catch {
    try { return fromStructuredData(await html(text(item.url, `${origin}/items/${item.id}`)), item); }
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
        if (!VINTED_HOST.test(url.hostname)) continue;
        const id = url.pathname.match(/^\/items\/(\d+)/)?.[1];
        if (id) directItems.push({ id: Number(id), url: `${url.origin}${url.pathname}` });
      } catch {}
    }
    if (rawUrls.length && !directItems.length) {
      return Response.json({ error: "Lien Vinted invalide. Utilise un lien d’annonce vinted.fr ou vinted.lu contenant /items/." }, { status: 422 });
    }
    const listed = directItems.length ? directItems : await publicDressingItems();
    if (!listed.length) return Response.json({ error: "Aucun lien d’annonce Vinted valide n’a été trouvé." }, { status: 422 });

    const existingResponse = await supabaseRest("/rest/v1/products?select=id,name,vinted_url,size,condition,brand,color,description,details,image_urls");
    const existingRows = existingResponse.ok ? await existingResponse.json() as { id:number; name?:string; vinted_url?:string; size?:string; condition?:string; brand?:string; color?:string; description?:string; details?:unknown; image_urls?:unknown }[] : [];
    const vintedKey = (url: string) => url.match(/\/items\/(\d+)/)?.[1] || url.split("?")[0];
    const existing = new Map(existingRows.filter(row => row.vinted_url).map(row => [vintedKey(row.vinted_url as string), row]));
    const imported: Record<string,unknown>[] = [];
    let completed = 0;

    for (const listedItem of listed.slice(0,60)) {
      const item = await detailFor(listedItem);
      const vintedUrl = text(item.url) || `${VINTED_ORIGIN}/items/${item.id}`;
      const existingProduct = existing.get(vintedKey(vintedUrl));
      const images = unique((Array.isArray(item.photos) ? item.photos : []).map(publicImage).filter(isUsableImage));
      const fallbackImage = publicImage(item.photo);
      if (!images.length && isUsableImage(fallbackImage)) images.push(fallbackImage);
      const currentImages = existingProduct && Array.isArray(existingProduct.image_urls) ? existingProduct.image_urls.map(value => text(value)).filter(Boolean) : [];
      const stableCurrentImages = currentImages.filter(url => !isVintedImage(url));
      const savedImages = stableCurrentImages.length >= images.length && stableCurrentImages.length ? [] : await persistImages(images, Number(item.id));
      const finalImages = savedImages.length ? savedImages : images;
      const favorites = Number(item.favourite_count ?? item.favorites_count ?? item.favourites_count ?? 0);
      const details = detailsFor(item, favorites);
      const price = amount(item.price);
      if (!text(item.title) || !price) continue;
      if (existingProduct) {
        const patch: Record<string,unknown> = {};
        const importedSize = sizeOf(item);
        const importedCondition = conditionOf(item);
        const importedBrand = brandOf(item);
        const importedColor = colorOf(item);
        if ((!existingProduct.size || existingProduct.size === "Non précisée") && importedSize) patch.size = importedSize;
        if ((!existingProduct.condition || existingProduct.condition === "Voir l’annonce") && importedCondition) patch.condition = importedCondition;
        if ((!existingProduct.brand || existingProduct.brand === "Non précisée") && importedBrand) patch.brand = importedBrand;
        if ((!existingProduct.color || existingProduct.color === "Voir les photos") && importedColor) patch.color = importedColor;
        const mergedImages = unique([...stableCurrentImages, ...finalImages]);
        if (mergedImages.join("\n") !== currentImages.join("\n")) patch.image_urls = mergedImages;
        const currentDetails = Array.isArray(existingProduct.details) ? existingProduct.details.map(value => text(value)).filter(Boolean) : [];
        const usefulDetails = currentDetails.filter(value => !/Importé depuis (?:le dressing )?Vinted/i.test(value));
        const mergedDetails = unique([...usefulDetails, ...details]);
        if (mergedDetails.join("\n") !== currentDetails.join("\n")) patch.details = mergedDetails;
        const importedDescription = text(item.description);
        if (importedDescription && (!existingProduct.description || existingProduct.description === existingProduct.name)) patch.description = importedDescription;
        if (Object.keys(patch).length) {
          const refresh = await supabaseRest(`/rest/v1/products?id=eq.${existingProduct.id}`, {
            method:"PATCH",headers:{"content-type":"application/json",prefer:"return=minimal"},body:JSON.stringify(patch),
          });
          if (refresh.ok) completed++;
        }
        continue;
      }
      imported.push({
        name:text(item.title),brand:brandOf(item) || "Non précisée",category:categoryOf(item),
        size:sizeOf(item) || "Non précisée",condition:conditionOf(item) || "Voir l’annonce",
        price,color:colorOf(item) || "Voir les photos",description:text(item.description,text(item.title)),
        details,vinted_url:vintedUrl,image_urls:finalImages,active:true,
      });
      existing.set(vintedKey(vintedUrl), { id:-1, vinted_url:vintedUrl });
    }
    if (imported.length) {
      const save = await supabaseRest("/rest/v1/products", { method:"POST",headers:{"content-type":"application/json",prefer:"return=minimal"},body:JSON.stringify(imported) });
      if (!save.ok) throw new Error(`Enregistrement impossible : ${await save.text()}`);
    }
    return Response.json({ imported:imported.length,completed,found:listed.length,skipped:listed.length-imported.length-completed,note:"Les champs manquants ont été complétés sans remplacer tes modifications." });
  } catch (error) {
    const status = error instanceof Error ? error.message : "";
    return Response.json({ error: status === "401" ? "Vinted bloque aussi temporairement la page publique. Réessaie plus tard ou importe les liens individuellement." : "Lecture du dressing Vinted impossible." }, { status:502 });
  }
}
