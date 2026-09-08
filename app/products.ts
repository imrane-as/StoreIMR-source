export type Product = { id:number; name:string; brand:string; category:"Sneakers"|"Vêtements"|"Accessoires"; size:string; condition:string; price:number; color:string; position:string };
export const products: Product[] = [
 {id:1,name:"Air Max — édition spéciale",brand:"Nike",category:"Sneakers",size:"43",condition:"Très bon état",price:89,color:"Bleu glacier",position:"15% 55%"},
 {id:2,name:"Zig Kinetica II",brand:"Reebok",category:"Sneakers",size:"43",condition:"Comme neuf",price:72,color:"Blanc & noir",position:"85% 55%"},
 {id:3,name:"Sweat essentiel",brand:"StoreIMR Select",category:"Vêtements",size:"L",condition:"Neuf sans étiquette",price:38,color:"Gris chiné",position:"45% 30%"},
 {id:4,name:"Veste urbaine",brand:"StoreIMR Select",category:"Vêtements",size:"M",condition:"Très bon état",price:54,color:"Noir",position:"58% 76%"}
];
