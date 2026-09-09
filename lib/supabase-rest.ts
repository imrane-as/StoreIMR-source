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
  return !!user.email && user.email.toLowerCase() === required(process.env.ADMIN_EMAIL, "ADMIN_EMAIL").toLowerCase();
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
    if (!response.ok) throw new Error("Échec du téléchargement d’une photo");
    urls.push(`${supabaseUrl}/storage/v1/object/public/product-images/${objectPath}`);
  }
  return urls;
}

export function mapProduct(row: Record<string, unknown>) {
  return {
    id: Number(row.id), name: String(row.name), brand: String(row.brand),
    category: String(row.category), size: String(row.size), condition: String(row.condition),
    price: Number(row.price), color: String(row.color), position: "center",
    description: String(row.description || ""), details: Array.isArray(row.details) ? row.details : [],
    vintedUrl: String(row.vinted_url || "https://www.vinted.fr"),
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls : [],
  };
}
