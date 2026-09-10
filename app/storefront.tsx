"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Heart, Menu, Search, X } from "lucide-react";
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

    <section className="pb-campaign" id="top">
      <div className="pb-campaign-copy">
        <span>NEW SEASON / STOREIMR</span>
        <h1>Le nouveau<br/>streetwear.</h1>
        <p>Des sneakers et pièces sélectionnées une par une.</p>
        <div><a href="#collection">Voir la collection</a><a href="https://www.vinted.fr" target="_blank" rel="noreferrer">Voir sur Vinted</a></div>
      </div>
    </section>

    <section className="pb-shop" id="collection">
      <div className="pb-shop-head" id="nouveautes">
        <div><span>STOREIMR COLLECTION</span><h2>Nouveautés</h2></div>
        <p>{visible.length} article{visible.length > 1 ? "s" : ""}</p>
      </div>

      <div className="pb-filters">
        <div>{categories.map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <label><Search/><input id="catalog-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher"/></label>
      </div>

      <div className="pb-grid">
        {visible.map(product => {
          const image = product.imageUrls?.[0] || "/storeimr-hero.png";
          return <article className="pb-card" key={product.id}>
            <div className="pb-card-media">
              <a href={`/product/${product.id}`}><img src={image} alt={product.name}/></a>
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
      {!visible.length && <div className="pb-empty"><h3>Aucun résultat</h3><p>Essaie une autre catégorie ou recherche.</p></div>}
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
