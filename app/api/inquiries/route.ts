import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { inquiries } from "../../../db/schema";

export async function POST(request: Request) {
 try {
  const body = await request.json() as {items?:number[];total?:number};
  if (!body.items?.length || !Number.isFinite(body.total)) return Response.json({error:"Sélection invalide"},{status:400});
  const [inquiry] = await getDb().insert(inquiries).values({items:JSON.stringify(body.items),total:body.total!}).returning();
  return Response.json({inquiry},{status:201});
 } catch { return Response.json({error:"La demande n’a pas pu être enregistrée"},{status:503}); }
}
export async function GET() {
 try { return Response.json({inquiries:await getDb().select().from(inquiries).orderBy(desc(inquiries.id)).limit(100)}); }
 catch { return Response.json({inquiries:[]}); }
}
