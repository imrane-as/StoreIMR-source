"use client";
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "../../products";

export default function ProductView({ product }: { product: Product }) {
  const images = product.imageUrls?.length ? product.imageUrls : ["/storeimr-hero.png"];
  const [index, setIndex] = useState(0);
  const [accent, setAccent] = useState("rgb(165, 165, 160)");

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = images[index];
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 40; canvas.height = 40;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;
        context.drawImage(image, 0, 0, 40, 40);
        const pixels = context.getImageData(0, 0, 40, 40).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < pixels.length; i += 16) {
          const pr = pixels[i], pg = pixels[i + 1], pb = pixels[i + 2];
          const light = (pr + pg + pb) / 3;
          if (light < 28 || light > 242) continue;
          r += pr; g += pg; b += pb; count++;
        }
        if (count) setAccent(`rgb(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)})`);
      } catch {}
    };
  }, [images, index]);

  const previous = () => setIndex(current => (current - 1 + images.length) % images.length);
  const next = () => setIndex(current => (current + 1) % images.length);
  const theme = { "--product-accent": accent, "--product-soft": `color-mix(in srgb, ${accent} 18%, #f5f5f2)` } as CSSProperties;

  return <main className="product-page themed-product" style={theme}>
    <header className="product-header"><Link href="/" className="logo-link"><img src="/storeimr-logo.svg" alt="StoreIMR"/></Link><Link href="/#catalogue" className="back-link"><ArrowLeft/> Retour au catalogue</Link></header>
    <section className="product-detail">
      <div className="product-media">
        <div className="product-media-stage">
          <img src={images[index]} alt={`${product.name} — photo ${index + 1}`} />
          <span className="condition-badge">{product.condition}</span>
          {images.length > 1 && <>
            <button className="gallery-arrow previous" onClick={previous} aria-label="Photo précédente"><ChevronLeft/></button>
            <button className="gallery-arrow next" onClick={next} aria-label="Photo suivante"><ChevronRight/></button>
            <span className="photo-count">{index + 1} / {images.length}</span>
          </>}
        </div>
        {images.length > 1 && <div className="product-gallery" role="list" aria-label="Photos du produit">{images.map((url,i)=><button key={url} className={i===index?"active":""} onClick={()=>setIndex(i)} aria-label={`Afficher la photo ${i+1}`}><img src={url} alt=""/></button>)}</div>}
      </div>
      <div className="product-detail-copy"><span className="product-category">{product.category} · {product.brand}</span><h1>{product.name}</h1><p className="product-price">{product.price} €</p><p className="product-description">{product.description}</p>
        <div className="product-meta"><div><span>Taille</span><b>{product.size}</b></div><div><span>Couleur</span><b>{product.color}</b></div><div><span>État</span><b>{product.condition}</b></div></div>
        <ul className="product-details">{product.details.map(detail=><li key={detail}><Check/> {detail}</li>)}</ul>
        <a className="vinted-buy" href={product.vintedUrl} target="_blank" rel="noreferrer">Acheter cet article sur Vinted <ArrowRight/></a><p className="vinted-note">Le paiement et la livraison sont sécurisés directement par Vinted.</p>
      </div>
    </section>
    <section className="product-trust"><div><ShieldCheck/><b>Article vérifié</b><span>État et détails contrôlés</span></div><div><Truck/><b>Envoi rapide</b><span>Expédition suivie sous 24–48 h</span></div></section>
  </main>;
}
