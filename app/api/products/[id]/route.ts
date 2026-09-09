import { mapProduct, supabaseRest, uploadProductImages, verifyAdmin } from "../../../../lib/supabase-rest";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await supabaseRest(`/rest/v1/products?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const rows = await response.json() as Record<string, unknown>[];
    if (!rows[0]) return Response.json({ error: "Article introuvable" }, { status: 404 });
    return Response.json({ product: mapProduct(rows[0]) });
  } catch { return Response.json({ error: "Article indisponible" }, { status: 503 }); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await verifyAdmin(request))) return Response.json({ error: "Accès refusé" }, { status: 401 });
    const { id } = await params; const form = await request.formData();
    const existing = JSON.parse(String(form.get("existingImages") || "[]")) as string[];
    const files = form.getAll("images").filter((value): value is File => value instanceof File);
    const newImages = await uploadProductImages(files);
    const payload = {
      name: String(form.get("name") || ""), brand: String(form.get("brand") || ""),
      category: String(form.get("category") || "Sneakers"), size: String(form.get("size") || ""),
      condition: String(form.get("condition") || ""), price: Number(form.get("price") || 0),
      color: String(form.get("color") || ""), description: String(form.get("description") || ""),
      details: String(form.get("details") || "").split("\n").map(v => v.trim()).filter(Boolean),
      vinted_url: String(form.get("vintedUrl") || ""), image_urls: [...existing, ...newImages],
    };
    const response = await supabaseRest(`/rest/v1/products?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json", prefer: "return=representation" }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(await response.text());
    const [row] = await response.json() as Record<string, unknown>[];
    return Response.json({ product: mapProduct(row) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Modification impossible" }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin(request))) return Response.json({ error: "Accès refusé" }, { status: 401 });
  const { id } = await params;
  const response = await supabaseRest(`/rest/v1/products?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  return response.ok ? Response.json({ success: true }) : Response.json({ error: "Suppression impossible" }, { status: 500 });
}
