import Link from "next/link";
import { headers } from "next/headers";
import { BarChart3, Boxes, ExternalLink, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";
export default async function AdminPage(){
 const h=await headers(); const email=h.get("oai-authenticated-user-email")??"Propriétaire StoreIMR";
 return <main className="admin-page"><header><Link href="/" className="brand"><span>STORE</span><b>IMR</b></Link><div><span>{email}</span><Link href="/">Voir la boutique <ExternalLink/></Link></div></header><section className="admin-intro"><div><small>TABLEAU DE BORD</small><h1>Bonjour Imrane.</h1><p>Voici un aperçu de l’activité de ta boutique.</p></div><button>Ajouter un article</button></section><section className="admin-stats"><article><ShoppingBag/><span>Demandes</span><b>0</b><small>À traiter</small></article><article><Boxes/><span>Articles actifs</span><b>4</b><small>Catalogue en ligne</small></article><article><BarChart3/><span>Valeur du stock</span><b>253 €</b><small>Prix affichés</small></article></section><section className="admin-panel"><div><h2>Gestion du catalogue</h2><p>La base est prête pour connecter tes vraies photos, tes prix et tes liens Vinted.</p></div><Link href="/">Ouvrir le catalogue <ExternalLink/></Link></section></main>
}
