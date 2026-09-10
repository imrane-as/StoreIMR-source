import { mapProduct, supabaseRest } from "../../../lib/supabase-rest";
import type { Product } from "../../products";
import ProductView from "./product-view";
import UnavailableProduct from "./unavailable-product";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product: Product | undefined;

  try {
    const response = await supabaseRest(`/rest/v1/products?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (response.ok) {
      const rows = await response.json() as Record<string, unknown>[];
      if (rows[0]) product = mapProduct(rows[0]) as Product;
    }
  } catch {}

  if (!product) return <UnavailableProduct/>;
  return <ProductView product={product}/>;
}
