import { verifyAdmin } from "../../../lib/supabase-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) return Response.json({ error: "Accès refusé" }, { status: 401 });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ error: "La clé OPENAI_API_KEY manque dans Vercel" }, { status: 503 });
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return Response.json({ error: "Sélectionne d’abord une photo" }, { status: 400 });
    if (image.size > 8_000_000) return Response.json({ error: "La photo doit faire moins de 8 Mo" }, { status: 400 });
    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const dataUrl = `data:${image.type || "image/jpeg"};base64,${base64}`;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [{ role: "user", content: [
          { type: "input_text", text: "Analyse cette photo d'article de mode pour préparer une annonce StoreIMR en français. N'invente pas une référence exacte si elle n'est pas clairement identifiable. Donne un titre vendeur mais factuel, la marque visible ou 'À confirmer', la catégorie, la couleur principale, une estimation prudente de l'état visuel, une description concise et quatre détails utiles. Ne donne pas de prix." },
          { type: "input_image", image_url: dataUrl, detail: "high" }
        ]}],
        text: { format: { type: "json_schema", name: "product_listing", strict: true, schema: {
          type: "object", additionalProperties: false,
          properties: {
            name: { type: "string" }, brand: { type: "string" },
            category: { type: "string", enum: ["Sneakers","Vêtements","Accessoires"] },
            color: { type: "string" }, condition: { type: "string" },
            description: { type: "string" },
            details: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 }
          },
          required: ["name","brand","category","color","condition","description","details"]
        }}}
      })
    });
    const result = await response.json() as any;
    if (!response.ok) return Response.json({ error: result?.error?.message || "Analyse IA impossible" }, { status: response.status });
    const outputText = result.output_text || result.output?.flatMap((item:any)=>item.content||[]).find((item:any)=>item.type==="output_text")?.text;
    if (!outputText) throw new Error("Réponse IA vide");
    return Response.json({ suggestion: JSON.parse(outputText) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Analyse IA impossible" }, { status: 500 });
  }
}
