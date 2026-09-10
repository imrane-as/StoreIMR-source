const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`Variable manquante: ${name}`);
  return value;
}

export async function verifyAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const response = await fetch(`${required(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL")}/auth/v1/user`, {
    headers: { apikey: required(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"), authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return false;
  const user = await response.json() as { email?: string };
  return !!user.email && user.email.trim().toLowerCase() === required(process.env.ADMIN_EMAIL, "ADMIN_EMAIL").trim().toLowerCase();
}

export async function supabaseRest(path: string, init: RequestInit = {}) {
  const key = required(serviceKey, "SUPABASE_SERVICE_ROLE_KEY");
  return fetch(`${required(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL")}${path}`, {
    ...init,
    headers: { apikey: key, authorization: `Bearer ${key}`, ...(init.headers || {}) },
    cache: "no-store",
  });
}

export async function uploadProductImages(files: File[]) {
  const urls: string[] = [];
  for (const file of files) {
    if (!file.size) continue;
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    const objectPath = `${crypto.randomUUID()}-${safe}`;
    const response = await supabaseRest(`/storage/v1/object/product-images/${objectPath}`, {
      method: "POST",
      headers: { "content-type": file.type || "application/octet-stream", "x-upsert": "false" },
      body: file,
    });
    if (!response.ok) { const detail = await response.text(); throw new Error(`Échec photo (${response.status}) : ${detail}`); }
    urls.push(`${supabaseUrl}/storage/v1/object/public/product-images/${objectPath}`);
  }
  return urls;
}

function normalizeImageUrls(value: unknown) {
  if (!Array.isArray(value)) return [];
  const selected = new Map<string, { url: string; score: number }>();
  for (const entry of value) {
    if (typeof entry !== "string" || !entry) continue;
    try {
      const parsed = new URL(entry, "https://storeimr.local");
      const isVinted = /(^|\.)vinted\.net$/i.test(parsed.hostname);
      if (!isVinted) {
        selected.set(entry, { url: entry, score: 3 });
        continue;
      }
      if (!/\/f\d+\//i.test(parsed.pathname)) continue;
      const photoKey = parsed.pathname.split("/").pop() || parsed.pathname;
      const signed = !!parsed.searchParams.get("s");
      const url = signed ? entry : `/api/vinted/image?url=${encodeURIComponent(entry)}`;
      const score = signed ? 2 : 1;
      if (!selected.has(photoKey) || (selected.get(photoKey)?.score || 0) < score) selected.set(photoKey, { url, score });
    } catch {}
  }
  return [...selected.values()].map(image => image.url);
}

export function mapProduct(row: Record<string, unknown>) {
  return {
    id: Number(row.id), name: String(row.name), brand: String(row.brand),
    category: String(row.category), size: String(row.size), condition: String(row.condition),
    price: Number(row.price), color: String(row.color), position: "center",
    description: String(row.description || ""), details: Array.isArray(row.details) ? row.details : [],
    vintedUrl: String(row.vinted_url || "https://www.vinted.fr"),
    imageUrls: normalizeImageUrls(row.image_urls),
  };
}
