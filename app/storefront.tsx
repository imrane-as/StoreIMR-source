"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Camera, Heart, Menu, Search, ShieldCheck, Truck, X } from "lucide-react";
import { products as fallbackProducts, type Product } from "./products";

const categories = ["Tout", "Sneakers", "Vêtements", "Accessoires"] as const;

export default function Storefront() {
  const [catalog, setCatalog] = useState<Product[]>(fallbackProducts);
  const [category, setCategory] = useState<(typeof categories)[number]>("Tout");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(data => {
      if (data.products?.length) setCatalog(data.products);
    }).catch(() => {});
  }, []);

  const visible = useMemo(() => catalog.filter(product =>
    (category === "Tout" || product.category === category) &&
    `${product.name} ${product.brand} ${product.size}`.toLowerCase().includes(query.toLowerCase())
  ), [catalog, category, query]);

  return <main className="storefront">
    <div className="topline"><span>Expédition 24–48 h</span><i/> <span>France & Luxembourg</span><i/> <span>Achat sécurisé sur Vinted</span></div>

    <header className="store-nav">
      <a className="store-logo" href="#accueil"><img src="/storeimr-logo.svg" alt="StoreIMR"/></a>
      <nav className="nav-pill" aria-label="Navigation principale">
        <a href="#collection">Collection</a><a href="#concept">Le concept</a><a href="#services">Services</a>
      </nav>
      <div className="nav-actions">
        <button className="search-shortcut" onClick={() => document.getElementById("catalog-search")?.focus()}><Search/><span>Rechercher</span></button>
        <a className="vinted-nav" href="https://www.vinted.fr" target="_blank" rel="noreferrer">Vinted <ArrowRight/></a>
        <button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu"><Menu/></button>
      </div>
    </header>

    {menuOpen && <div className="mobile-panel"><button onClick={() => setMenuOpen(false)}><X/></button><img src="/storeimr-logo.svg" alt="StoreIMR"/><nav><a onClick={() => setMenuOpen(false)} href="#collection">Collection</a><a onClick={() => setMenuOpen(false)} href="#concept">Le concept</a><a onClick={() => setMenuOpen(false)} href="#services">Services</a></nav><a href="https://www.vinted.fr" target="_blank" rel="noreferrer">Voir la boutique Vinted <ArrowRight/></a></div>}

    <section className="fashion-hero" id="accueil">
      <div className="hero-editorial">
        <div className="season-label"><span>STOREIMR / 2026</span><span>METZ — LUXEMBOURG</span></div>
        <div><p className="hero-overline">SÉLECTION STREETWEAR & SNEAKERS</p><h1>Des pièces qui<br/><em>font la différence.</em></h1><p className="hero-lead">Une sélection exigeante de sneakers et vêtements, choisis pour leur style, leur état et leur authenticité.</p><div className="hero-buttons"><a href="#collection">Explorer le drop <ArrowRight/></a><a href="https://www.vinted.fr" target="_blank" rel="noreferrer">Notre dressing Vinted</a></div></div>
        <div className="edition-index"><b>01</b><span>Pièces uniques<br/>disponibles maintenant</span></div>
      </div>
      <div className="hero-photo"><div className="photo-label"><span>NOUVEAU DROP</span><b>Selected by StoreIMR</b></div><span className="vertical-copy">MORE ITEMS · BETTER PEOPLE</span></div>
    </section>

    <div className="moving-line"><div><span>PIÈCES VÉRIFIÉES</span><b>✦</b><span>PRIX JUSTES</span><b>✦</b><span>ENVOI RAPIDE</span><b>✦</b><span>STYLE SANS COMPROMIS</span><b>✦</b><span>PIÈCES VÉRIFIÉES</span><b>✦</b><span>PRIX JUSTES</span></div></div>

    <section className="collection-section" id="collection">
      <div className="collection-heading"><div><span className="section-number">02 / COLLECTION</span><h2>Le dernier drop.</h2></div><p>Chaque pièce est disponible en quantité limitée. Quand elle part, elle ne revient pas.</p></div>
      <div className="collection-controls">
        <div className="filter-pills">{categories.map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <label className="modern-search"><Search/><input id="catalog-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Marque, modèle, taille…"/></label>
      </div>

      <div className="editorial-grid">
        {visible.map((product, index) => {
          const image = product.imageUrls?.[0] || "/storeimr-hero.png";
          return <article className="editorial-card" key={product.id}>
            <a className="editorial-image" href={`/product/${product.id}`} style={{backgroundImage:`url(${image})`}}>
              <span className="card-index">{String(index + 1).padStart(2, "0")}</span><span className="state-pill">{product.condition}</span>
            </a>
            <button className={favorites.includes(product.id) ? "floating-heart active" : "floating-heart"} onClick={() => setFavorites(current => current.includes(product.id) ? current.filter(id => id !== product.id) : [...current, product.id])}><Heart/></button>
            <div className="editorial-info"><div><span>{product.brand} / {product.category}</span><h3><a href={`/product/${product.id}`}>{product.name}</a></h3><p>Taille {product.size} · {product.color}</p></div><strong>{product.price} €</strong></div>
            <div className="editorial-actions"><a href={`/product/${product.id}`}>Découvrir</a><a href={product.vintedUrl} target="_blank" rel="noreferrer">Acheter sur Vinted <ArrowRight/></a></div>
          </article>;
        })}
      </div>
      {!visible.length && <div className="empty-collection"><Search/><h3>Aucun article trouvé</h3><p>Essaie une autre recherche ou une autre catégorie.</p></div>}
    </section>

    <section className="brand-story" id="concept">
      <div className="story-visual"><span>STOREIMR</span></div>
      <div className="story-copy"><span className="section-number">03 / NOTRE VISION</span><h2>Moins de hasard.<br/><em>Plus de style.</em></h2><p>StoreIMR simplifie la seconde main avec une sélection claire, des photos fidèles et un échange direct. Tu sais exactement ce que tu achètes.</p><a href="#collection">Voir les pièces disponibles <ArrowRight/></a></div>
    </section>

    <section className="service-section" id="services">
      <div className="service-heading"><span className="section-number">04 / NOS ENGAGEMENTS</span><h2>Une expérience simple,<br/>du premier regard à la livraison.</h2></div>
      <div className="service-cards"><article><span>01</span><ShieldCheck/><h3>Sélection vérifiée</h3><p>État, taille et détails contrôlés avant chaque publication.</p></article><article><span>02</span><Camera/><h3>Photos fidèles</h3><p>Plusieurs vues en couleurs pour voir la pièce sans mauvaise surprise.</p></article><article><span>03</span><Truck/><h3>Envoi soigné</h3><p>Emballage propre et expédition suivie sous 24 à 48 heures.</p></article></div>
    </section>

    <footer className="store-footer"><div><a className="footer-mark" href="#accueil"><img src="/storeimr-logo.svg" alt="StoreIMR"/></a><h2>Ton prochain favori<br/>est peut-être ici.</h2></div><div className="footer-links"><div><span>NAVIGATION</span><a href="#collection">Collection</a><a href="#concept">Le concept</a><a href="#services">Services</a></div><div><span>NOUS SUIVRE</span><a href="https://www.vinted.fr" target="_blank" rel="noreferrer">Vinted</a><a href="#">Instagram</a><a href="mailto:contact@storeimr.fr">Contact</a></div></div><div className="footer-bottom"><span>© 2026 STOREIMR</span><span>METZ · FRANCE</span><span>MORE ITEMS · BETTER PEOPLE</span></div></footer>
  </main>;
}
