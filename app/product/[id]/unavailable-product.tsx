"use client";

import Link from "next/link";
import { ArrowLeft, House, PackageX } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UnavailableProduct() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    const countdown = window.setInterval(() => {
      setSeconds(current => Math.max(0, current - 1));
    }, 1000);
    const redirect = window.setTimeout(() => router.replace("/"), 3000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(redirect);
    };
  }, [router]);

  return (
    <main className="unavailable-page">
      <header className="unavailable-header">
        <Link href="/" aria-label="Retourner à l’accueil">
          <img src="/storeimr-logo.svg" alt="StoreIMR"/>
        </Link>
        <Link href="/" className="unavailable-back"><ArrowLeft/> Boutique</Link>
      </header>

      <section className="unavailable-card">
        <div className="unavailable-glow"/>
        <PackageX className="unavailable-icon"/>
        <span>ARTICLE RETIRÉ</span>
        <h1>Article non disponible.</h1>
        <p>Ce produit a été supprimé, vendu ou n’est plus présent dans la collection StoreIMR.</p>
        <Link href="/" className="unavailable-home"><House/> Retour à l’accueil</Link>
        <small>Retour automatique dans {seconds} seconde{seconds > 1 ? "s" : ""}…</small>
      </section>
    </main>
  );
}
