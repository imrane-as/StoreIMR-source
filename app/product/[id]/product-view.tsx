"use client";
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Heart, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "../../products";

export default function ProductView({ product }: { product: Product }) {
  const images = product.imageUrls?.length ? product.imageUrls : ["/storeimr-hero.png"];
  const [index, setIndex] = useState(0);
  const [accent, setAccent] = useState("rgb(107, 124, 255)");
  const [favorite, setFavorite] = useState(false);

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
        let r=0,g=0,b=0,count=0;
        for(let i=0;i<pixels.length;i+=16){
          const pr=pixels[i],pg=pixels[i+1],pb=pixels[i+2],light=(pr+pg+pb)/3;
          if(light<28||light>242) continue;
          r+=pr;g+=pg;b+=pb;count++;
        }
        if(count) setAccent(`rgb(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)})`);
      } catch {}
    };
  }, [images, index]);

  const previous=()=>setIndex(current=>(current-1+images.length)%images.length);
  const next=()=>setIndex(current=>(current+1)%images.length);
  const theme={"--product-accent":accent,"--product-soft":`color-mix(in srgb, ${accent} 16%, #f6f7f9)`} as CSSProperties;

  return <main className="neo-product" style={theme}>
    <div className="neo-product-promo">Pièce sélectionnée · Achat sécurisé sur Vinted</div>
    <header className="neo-product-header">
      <Link href="/" className="neo-product-logo"><img src="/storeimr-logo.svg" alt="StoreIMR"/></Link>
      <nav><Link href="/">Accueil</Link><Link href="/#collection">Collection</Link></nav>
      <Link href="/#collection" className="neo-back"><ArrowLeft/> Retour</Link>
    </header>

    <div className="neo-breadcrumb"><Link href="/">StoreIMR</Link><span>/</span><Link href="/#collection">{product.category}</Link><span>/</span><b>{product.name}</b></div>

    <section className="neo-product-layout">
      <div className="neo-media">
        <div className="neo-stage">
          <img src={images[index]} alt={`${product.name} — photo ${index+1}`}/>
          <span className="neo-condition"><i/>{product.condition}</span>
          <span className="neo-photo-index">{String(index+1).padStart(2,"0")} / {String(images.length).padStart(2,"0")}</span>
          {images.length>1&&<><button className="neo-arrow prev" onClick={previous} aria-label="Photo précédente"><ChevronLeft/></button><button className="neo-arrow next" onClick={next} aria-label="Photo suivante"><ChevronRight/></button></>}
        </div>
        {images.length>1&&<div className="neo-thumbs" aria-label="Photos du produit">{images.map((url,i)=><button key={url} className={i===index?"active":""} onClick={()=>setIndex(i)} aria-label={`Afficher la photo ${i+1}`}><img src={url} alt=""/></button>)}</div>}
      </div>

      <aside className="neo-product-panel">
        <div className="neo-product-label"><span>{product.brand}</span><button className={favorite?"active":""} onClick={()=>setFavorite(!favorite)} aria-label="Ajouter aux favoris"><Heart/></button></div>
        <p className="neo-category">{product.category} / DROP 01</p>
        <h1>{product.name}</h1>
        <div className="neo-price"><strong>{product.price} €</strong><span>Prix affiché sur Vinted</span></div>
        <p className="neo-description">{product.description}</p>

        <div className="neo-specs">
          <div><span>Taille</span><b>{product.size}</b></div>
          <div><span>Couleur</span><b>{product.color}</b></div>
          <div><span>État</span><b>{product.condition}</b></div>
        </div>

        <a className="neo-vinted" href={product.vintedUrl} target="_blank" rel="noreferrer"><span>Acheter sur Vinted<small>Paiement et livraison sécurisés</small></span><ArrowRight/></a>

        <div className="neo-reassurance"><div><ShieldCheck/><span><b>Article vérifié</b><small>Photos et état contrôlés</small></span></div><div><Truck/><span><b>Expédition rapide</b><small>Envoi suivi sous 24–48 h</small></span></div></div>

        {!!product.details.length&&<details className="neo-details" open><summary>Détails du produit <span>+</span></summary><ul>{product.details.map(detail=><li key={detail}><Check/>{detail}</li>)}</ul></details>}
      </aside>
    </section>

    <section className="neo-product-footer"><span>STOREIMR / SELECTED GOODS</span><h2>Une pièce.<br/>Une seule chance.</h2><Link href="/#collection">Continuer la sélection <ArrowRight/></Link></section>
  </main>;
}
