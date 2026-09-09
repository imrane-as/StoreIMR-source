export type Product = {
  id: number;
  name: string;
  brand: string;
  category: "Sneakers" | "Vêtements" | "Accessoires";
  size: string;
  condition: string;
  price: number;
  color: string;
  position: string;
  description: string;
  details: string[];
  vintedUrl: string;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Air Max — édition spéciale",
    brand: "Nike",
    category: "Sneakers",
    size: "43",
    condition: "Très bon état",
    price: 89,
    color: "Bleu glacier",
    position: "15% 55%",
    description: "Une paire Nike Air Max confortable et polyvalente, soigneusement contrôlée avant sa mise en vente.",
    details: ["Pointure 43", "Semelle Air visible", "Paire vérifiée", "Expédition rapide avec suivi"],
    vintedUrl: "https://www.vinted.fr"
  },
  {
    id: 2,
    name: "Zig Kinetica II",
    brand: "Reebok",
    category: "Sneakers",
    size: "43",
    condition: "Comme neuf",
    price: 72,
    color: "Blanc & noir",
    position: "85% 55%",
    description: "La Reebok Zig Kinetica II associe un look dynamique à un amorti confortable pour le quotidien.",
    details: ["Pointure 43", "Coloris blanc et noir", "État proche du neuf", "Envoi protégé"],
    vintedUrl: "https://www.vinted.fr"
  },
  {
    id: 3,
    name: "Sweat essentiel",
    brand: "StoreIMR Select",
    category: "Vêtements",
    size: "L",
    condition: "Neuf sans étiquette",
    price: 38,
    color: "Gris chiné",
    position: "45% 30%",
    description: "Un sweat facile à porter, sélectionné pour sa coupe propre et son confort.",
    details: ["Taille L", "Coupe confortable", "Neuf sans étiquette", "Article contrôlé"],
    vintedUrl: "https://www.vinted.fr"
  },
  {
    id: 4,
    name: "Veste urbaine",
    brand: "StoreIMR Select",
    category: "Vêtements",
    size: "M",
    condition: "Très bon état",
    price: 54,
    color: "Noir",
    position: "58% 76%",
    description: "Une veste noire urbaine et sobre, idéale pour compléter une tenue streetwear.",
    details: ["Taille M", "Coloris noir", "Très bon état", "Disponible en un seul exemplaire"],
    vintedUrl: "https://www.vinted.fr"
  }
];
