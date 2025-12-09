import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const pokemonFont = localFont({
  src: "../fonts/pokemon-dp-pro.otf",
  variable: "--font-pokemon",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pokemon Showdown Team Manager",
  description: "Organize and manage your Pokemon Showdown teams with Notion",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${pokemonFont.variable}`}>{children}</body>
    </html>
  );
}

