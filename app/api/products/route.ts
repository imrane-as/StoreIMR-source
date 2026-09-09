import { mapProduct, supabaseRest, uploadProductImages, verifyAdmin } from "../../../lib/supabase-rest";

export async function GET() {
  try {
    const response = await supabaseRest("/rest/v1/products?select=*&active=eq.true&order=created_at.desc");
    if (!response.ok) throw new Error();
    const rows = await response.json() as Record<string, unknown>[];
    return Response.json({ products: rows.map(mapProduct) });
  } catch {
    return Response.json({ products: [], error: "Catalogue indisponible" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) return Response.json({ error: "Accès refusé" }, { status: 401 });
    const form = await request.formData();
    const files = form.getAll("images").filter((value): value is File => value instanceof File);
    const imageUrls = await uploadProductImages(files);
    const payload = {
      name: String(form.get("name") || ""), brand: String(form.get("brand") || ""),
      category: String(form.get("category") || "Sneakers"), size: String(form.get("size") || ""),
      condition: String(form.get("condition") || ""), price: Number(form.get("price") || 0),
      color: String(form.get("color") || ""), description: String(form.get("description") || ""),
      details: String(form.get("details") || "").split("\n").map(v => v.trim()).filter(Boolean),
      vinted_url: String(form.get("vintedUrl") || ""), image_urls: imageUrls, active: true,
    };
    if (!payload.name || !payload.price || !payload.vinted_url) return Response.json({ error: "Nom, prix et lien Vinted obligatoires" }, { status: 400 });
    const response = await supabaseRest("/rest/v1/products", { method: "POST", headers: { "content-type": "application/json", prefer: "return=representation" }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(await response.text());
    const [row] = await response.json() as Record<string, unknown>[];
    return Response.json({ product: mapProduct(row) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Enregistrement impossible" }, { status: 500 });
  }
}
