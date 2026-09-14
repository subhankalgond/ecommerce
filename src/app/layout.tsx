import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
import { CustomerProvider } from "@/components/customer-auth-provider";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CartDrawer from "@/components/cart-drawer";
import BottomNav from "@/components/bottom-nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Nova Threads — Clothing for Men, Women & Kids",
    template: "%s | Nova Threads",
  },
  description:
    "Everyday essentials for the whole family. Shirts, dresses, knitwear and more — crafted to last, priced to love. Checkout powered by Stripe.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
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
