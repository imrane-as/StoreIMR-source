"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Heart, Menu, Search, X } from "lucide-react";
import type { Product } from "./products";

const categories = ["Tout", "Sneakers", "Vêtements", "Accessoires"] as const;

export default function Storefront() {
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [category, setCategory] = useState<(typeof categories)[number]>("Tout");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/products")
      .then(response => response.json())
      .then(data => {
        if (active) setCatalog(Array.isArray(data.products) ? data.products : []);
      })
      .catch(() => {
        if (active) setCatalog([]);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => catalog.filter(product =>
    (category === "Tout" || product.category === category) &&
    `${product.name} ${product.brand} ${product.size}`.toLowerCase().includes(query.toLowerCase())
  ), [catalog, category, query]);

  return <main className="pb-store">
    <div className="pb-promo">Livraison rapide · Achat sécurisé via Vinted</div>

    <header className="pb-header">
      <button className="pb-menu" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu"><Menu/></button>
      <a className="pb-logo" href="#top"><img src="/storeimr-logo.svg" alt="StoreIMR"/></a>
      <nav className="pb-main-nav" aria-label="Navigation principale">
        <a href="#nouveautes">Nouveautés</a><a href="#collection">Sneakers</a><a href="#collection">Vêtements</a><a href="#collection">Accessoires</a>
      </nav>
      <div className="pb-header-tools">
        <button onClick={() => document.getElementById("catalog-search")?.focus()} aria-label="Rechercher"><Search/></button>
        <a href="#favoris"><Heart/><span>{favorites.length}</span></a>
      </div>
    </header>

    {menuOpen && <aside className="pb-drawer">
      <div><img src="/storeimr-logo.svg" alt="StoreIMR"/><button onClick={() => setMenuOpen(false)} aria-label="Fermer"><X/></button></div>
      <nav>{["Nouveautés","Sneakers","Vêtements","Accessoires"].map(item => <a key={item} href="#collection" onClick={() => setMenuOpen(false)}>{item}<ArrowRight/></a>)}</nav>
      <a className="pb-vinted-drawer" href="https://www.vinted.fr" target="_blank" rel="noreferrer">Acheter sur Vinted</a>
    </aside>}

    <section className="pb-campaign" id="top"><div className="future-orb future-orb-a"/><div className="future-orb future-orb-b"/><div className="future-grid"/>
      <div className="pb-campaign-copy">
        <span className="future-status"><i/> COLLECTION ACTIVE / DROP 01</span>
        <h1>Le nouveau<br/>streetwear.</h1>
        <p>Une sélection de sneakers et pièces fortes, pensée pour maintenant et pour demain.</p><div className="future-code"><span>CURATED / 01</span><span>METZ — LUXEMBOURG</span></div>
        <div><a href="#collection">Voir la collection</a><a href="https://www.vinted.fr" target="_blank" rel="noreferrer">Voir sur Vinted</a></div>
      </div>
    </section>

    <section className="pb-shop" id="collection">
      <div className="pb-shop-head" id="nouveautes">
        <div><span>STOREIMR COLLECTION</span><h2>Nouveautés</h2></div>
        <p>{catalogLoading ? "Chargement…" : `${visible.length} article${visible.length > 1 ? "s" : ""}`}</p>
      </div>

      <div className="pb-filters">
        <div>{categories.map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <label><Search/><input id="catalog-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher"/></label>
      </div>

      <div className="pb-grid" id="favoris">
        {catalogLoading && Array.from({ length: 4 }, (_, index) => (
          <div className="pb-card-skeleton" key={index} aria-hidden="true">
            <div/><span/><span/>
          </div>
        ))}
        {!catalogLoading && visible.map(product => {
          const image = product.imageUrls?.[0];
          return <article className="pb-card" key={product.id}>
            <div className="pb-card-media">
              <a href={`/product/${product.id}`}>
                {image ? <img src={image} alt={product.name}/> : <span className="pb-photo-missing">Photo indisponible</span>}
              </a>
              <span>{product.condition}</span>
              <button className={favorites.includes(product.id) ? "active" : ""} onClick={() => setFavorites(current => current.includes(product.id) ? current.filter(id => id !== product.id) : [...current, product.id])} aria-label="Ajouter aux favoris"><Heart/></button>
            </div>
            <a className="pb-card-info" href={`/product/${product.id}`}>
              <div><h3>{product.name}</h3><p>{product.brand} · Taille {product.size}</p></div><strong>{product.price} €</strong>
            </a>
            <a className="pb-buy" href={product.vintedUrl} target="_blank" rel="noreferrer">Acheter sur Vinted <ArrowRight/></a>
          </article>;
        })}
      </div>
      {!catalogLoading && !visible.length && <div className="pb-empty"><h3>Aucun article disponible</h3><p>La prochaine sélection arrive bientôt.</p></div>}
    </section>

    <section className="pb-banner">
      <div><span>SELECTED BY STOREIMR</span><h2>Des pièces fortes.<br/>Sans compromis.</h2><a href="#collection">Découvrir maintenant <ArrowRight/></a></div>
    </section>

    <section className="pb-values">
      <article><h3>Photos réelles</h3><p>Chaque produit est présenté en couleur et sous plusieurs angles.</p></article>
      <article><h3>Pièces vérifiées</h3><p>L’état, la taille et les détails sont contrôlés avant publication.</p></article>
      <article><h3>Achat sur Vinted</h3><p>Commande et paiement directement sur la plateforme Vinted.</p></article>
    </section>

    <footer className="pb-footer">
      <div><img src="/storeimr-logo.svg" alt="StoreIMR"/><p>Sneakers · Vêtements · Accessoires</p></div>
      <div><a href="#collection">Nouveautés</a><a href="https://www.vinted.fr" target="_blank" rel="noreferrer">Vinted</a><a href="mailto:contact@storeimr.fr">Contact</a></div>
      <small>© 2026 STOREIMR — METZ / LUXEMBOURG</small>
    </footer>
  </main>;
}
