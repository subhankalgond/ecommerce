import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
import { CustomerProvider } from "@/components/customer-auth-provider";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CartDrawer from "@/components/cart-drawer";
import BottomNav from "@/components/bottom-nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nova Threads — Editorial Fashion & Everyday Wardrobe Essentials",
    template: "%s | Nova Threads",
  },
  description:
    "Everyday, considered. Thoughtful essentials for men, women and kids. Made for the way you live.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-[#faf8f5] text-[#171614] font-sans selection:bg-[#ede6da]">
        <CustomerProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main className="min-h-[70vh]">{children}</main>
              <Footer />
              <CartDrawer />
              <BottomNav />
            </WishlistProvider>
          </CartProvider>
        </CustomerProvider>
      </body>
    </html>
  );
}
