import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { WishlistProvider } from "@/components/wishlist-provider";
import { CustomerProvider } from "@/components/customer-auth-provider";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CartDrawer from "@/components/cart-drawer";
import BottomNav from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: {
    default: "Nova Threads — Editorial Fashion & Everyday Wardrobe Essentials",
    template: "%s | Nova Threads",
  },
  description:
    "Everyday, considered. Thoughtful essentials for men, women and kids. Made with enduring natural fabrics.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
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
