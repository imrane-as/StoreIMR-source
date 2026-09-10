import { supabaseRest, verifyAdmin } from "../../../../lib/supabase-rest";

const PROFILE_ID = "315379493";
const VINTED_ORIGIN = "https://www.vinted.lu";

type VintedItem = Record<string, any>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function amount(value: any) {
  const raw = value?.amount ?? value?.numeric_amount ?? value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function publicImage(photo: any) {
  return text(photo?.url) || text(photo?.full_size_url) || text(photo?.image_url) || text(photo?.high_resolution?.url);
}

function categoryOf(item: VintedItem) {
  const value = `${text(item.catalog?.title)} ${text(item.title)}`.toLowerCase();
  if (/chauss|sneaker|basket|nike|adidas|reebok|jordan|puma|asics|new balance/.test(value)) return "Sneakers";
  if (/sac|montre|casquette|ceinture|lunette|accessoire/.test(value)) return "Accessoires";
  return "Vêtements";
}

async function vintedFetch(path: string) {
  const response = await fetch(`${VINTED_ORIGIN}${path}`, {
    headers: {
      accept: "application/json",
      "accept-language": "fr-FR,fr;q=0.9",
      "user-agent": "Mozilla/5.0 (compatible; StoreIMR catalog sync)",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Vinted a refusé la lecture publique (${response.status})`);
  return response.json();
}

async function detailFor(item: VintedItem) {
  try {
    const data = await vintedFetch(`/api/v2/items/${item.id}`);
    return data.item || item;
  } catch {
    return item;
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) return Response.json({ error: "Session expirée ou adresse ADMIN_EMAIL incorrecte. Reconnecte-toi puis vérifie la variable Vercel." }, { status: 401 });

    const listData = await vintedFetch(`/api/v2/users/${PROFILE_ID}/items?page=1&per_page=96&order=newest_first`);
    const listed: VintedItem[] = Array.isArray(listData.items) ? listData.items : [];
    if (!listed.length) return Response.json({ error: "Aucune annonce publique trouvée sur ce dressing." }, { status: 404 });

    const existingResponse = await supabaseRest("/rest/v1/products?select=vinted_url");
    const existingRows = existingResponse.ok ? await existingResponse.json() as { vinted_url?: string }[] : [];
    const existing = new Set(existingRows.map(row => row.vinted_url).filter(Boolean));
    const imported: Record<string, unknown>[] = [];

    for (const listedItem of listed.slice(0, 60)) {
      const item = await detailFor(listedItem);
      const vintedUrl = text(item.url) || `${VINTED_ORIGIN}/items/${item.id}`;
      if (existing.has(vintedUrl)) continue;

      const images = Array.isArray(item.photos) ? item.photos.map(publicImage).filter(Boolean) : [];
      const fallbackImage = publicImage(item.photo);
      if (!images.length && fallbackImage) images.push(fallbackImage);
      const favorites = Number(item.favourite_count ?? item.favorites_count ?? item.favourites_count ?? 0);
      const detailLines = [
        text(item.brand_title || item.brand?.title) && `Marque : ${text(item.brand_title || item.brand?.title)}`,
        text(item.size_title || item.size?.title) && `Taille : ${text(item.size_title || item.size?.title)}`,
        Number.isFinite(favorites) && favorites > 0 ? `${favorites} favori${favorites > 1 ? "s" : ""} sur Vinted` : "",
        "Importé depuis le dressing Vinted StoreIMR",
      ].filter(Boolean);

      imported.push({
        name: text(item.title, "Article Vinted"),
        brand: text(item.brand_title || item.brand?.title, "Non précisée"),
        category: categoryOf(item),
        size: text(item.size_title || item.size?.title, "Non précisée"),
        condition: text(item.status || item.status_title, "Voir l’annonce"),
        price: amount(item.price),
        color: text(item.color1 || item.color?.title, "Voir les photos"),
        description: text(item.description, text(item.title)),
        details: detailLines,
        vinted_url: vintedUrl,
        image_urls: images,
        active: !["sold", "deleted", "hidden"].includes(text(item.item_closing_action).toLowerCase()),
      });
      existing.add(vintedUrl);
    }

    if (imported.length) {
      const save = await supabaseRest("/rest/v1/products", {
        method: "POST",
        headers: { "content-type": "application/json", prefer: "return=minimal" },
        body: JSON.stringify(imported),
      });
      if (!save.ok) throw new Error(`Enregistrement impossible : ${await save.text()}`);
    }

    return Response.json({
      imported: imported.length,
      found: listed.length,
      skipped: listed.length - imported.length,
      profile: `${VINTED_ORIGIN}/member/${PROFILE_ID}`,
      note: "Les favoris sont ajoutés lorsque Vinted les expose publiquement.",
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Synchronisation Vinted impossible" }, { status: 502 });
  }
}
