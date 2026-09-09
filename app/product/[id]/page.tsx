import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Truck } from "lucide-react";
import { products } from "../../products";

export function generateStaticParams() {
  return products.map((product) => ({ id: String(product.id) }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((item) => item.id === Number(id));
  if (!product) notFound();

  return (
    <main className="product-page">
      <header className="product-header">
        <Link href="/" className="logo-link" aria-label="Retour à StoreIMR">
          <img src="/storeimr-logo.svg" alt="StoreIMR" />
        </Link>
        <Link href="/#catalogue" className="back-link"><ArrowLeft /> Retour au catalogue</Link>
      </header>

      <section className="product-detail">
        <div className="product-detail-image" style={{ backgroundPosition: product.position }}>
          <span>{product.condition}</span>
        </div>
        <div className="product-detail-copy">
          <span className="product-category">{product.category} · {product.brand}</span>
          <h1>{product.name}</h1>
          <p className="product-price">{product.price} €</p>
          <p className="product-description">{product.description}</p>

          <div className="product-meta">
            <div><span>Taille</span><b>{product.size}</b></div>
            <div><span>Couleur</span><b>{product.color}</b></div>
            <div><span>État</span><b>{product.condition}</b></div>
          </div>

          <ul className="product-details">
            {product.details.map((detail) => <li key={detail}><Check /> {detail}</li>)}
          </ul>

          <a className="vinted-buy" href={product.vintedUrl} target="_blank" rel="noreferrer">
            Acheter cet article sur Vinted <ArrowRight />
          </a>
          <p className="vinted-note">Le paiement et la livraison sont sécurisés directement par Vinted.</p>
        </div>
      </section>

      <section className="product-trust">
        <div><ShieldCheck /><b>Article vérifié</b><span>État et détails contrôlés</span></div>
        <div><Truck /><b>Envoi rapide</b><span>Expédition suivie sous 24–48 h</span></div>
      </section>
    </main>
  );
}
