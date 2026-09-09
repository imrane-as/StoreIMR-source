import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoreIMR — Sneakers & vêtements sélectionnés",
  description: "Découvrez la sélection StoreIMR : sneakers et vêtements vérifiés, expédiés rapidement en France et au Luxembourg.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/storeimr-logo.svg",
    shortcut: "/storeimr-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
