import { notFound } from "next/navigation";
import { mapProduct, supabaseRest } from "../../../lib/supabase-rest";
import { products, type Product } from "../../products";
import ProductView from "./product-view";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product: Product | undefined = products.find(item => item.id === Number(id));
  try {
    const response = await supabaseRest(`/rest/v1/products?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const rows = await response.json() as Record<string, unknown>[];
    if (rows[0]) product = mapProduct(rows[0]) as Product;
  } catch {}
  if (!product) notFound();
  return <ProductView product={product}/>;
}
