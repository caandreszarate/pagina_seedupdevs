import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SeedUp Devs — Build. Connect. Scale.",
  description: "Comunidad de desarrolladores donde construimos proyectos reales, compartimos conocimiento y escalamos juntos.",
  keywords: ["desarrolladores", "comunidad", "programación", "tecnología", "open source"],
  openGraph: {
    title: "SeedUp Devs",
    description: "Build. Connect. Scale.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-[#05070D]`}>
        {children}
      </body>
    </html>
  );
}
