import Link from "next/link";
import NewsletterForm from "@/components/newsletter-form";

export default function Footer() {
  return (
    <footer className="border-t border-[#e5dfd5] bg-[#f5f1ea] pb-20 md:pb-0 text-[#171614]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Top brand & columns */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 pr-4">
            <span className="font-serif text-2xl font-normal tracking-[0.24em] uppercase text-[#171614]">
              Nova Threads
            </span>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-[#5e584f]">
              An editorial clothing label creating thoughtful essentials for men, women and kids. Designed with lasting natural fabrics, disciplined proportions, and timeless ease.
            </p>
            
            <div className="mt-6 flex items-center gap-3 text-xs tracking-wider uppercase text-[#7a7368]">
              <span>Follow Our Story</span>
              <span className="h-px w-6 bg-[#d1c8bb]" />
            </div>

            <div className="mt-3 flex items-center gap-2" aria-label="Social channels">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center border border-[#d6cfc3] bg-[#faf8f5] text-[#3a3733] transition hover:border-[#171614] hover:text-[#171614]"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.1a6.7 6.7 0 100 13.4 6.7 6.7 0 000-13.4zm0 11a4.3 4.3 0 110-8.6 4.3 4.3 0 010 8.6zm6.9-11.4a1.6 1.6 0 11-3.2 0 1.6 1.6 0 013.2 0z" />
                </svg>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="X (Twitter)"
                className="flex h-8 w-8 items-center justify-center border border-[#d6cfc3] bg-[#faf8f5] text-[#3a3733] transition hover:border-[#171614] hover:text-[#171614]"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1.2 2h6.4l4.4 5.9L18.9 2zm-1.1 18.1h1.7L7 3.8H5.2l12.6 16.3z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center border border-[#d6cfc3] bg-[#faf8f5] text-[#3a3733] transition hover:border-[#171614] hover:text-[#171614]"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Catalog Col */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b5a42]">
              Collections
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-[#544e45]">
              <li><Link href="/products?category=women" className="hover:text-[#171614] transition">Women&apos;s Edit</Link></li>
              <li><Link href="/products?category=men" className="hover:text-[#171614] transition">Men&apos;s Tailoring &amp; Casuals</Link></li>
              <li><Link href="/products?category=kids" className="hover:text-[#171614] transition">The Kids Collection</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-[#171614] transition">New Arrivals</Link></li>
              <li><Link href="/products?sale=1" className="text-[#8b5a42] hover:text-[#6f4430] transition">The Sale Edit</Link></li>
              <li><Link href="/wishlist" className="hover:text-[#171614] transition">Saved Items</Link></li>
            </ul>
          </div>

          {/* Client Care Col */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b5a42]">
              Client Services
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-[#544e45]">
              <li><Link href="/track" className="font-semibold text-[#171614] hover:underline">Track Your Order →</Link></li>
              <li><Link href="/support#shipping" className="hover:text-[#171614] transition">Shipping &amp; Delivery</Link></li>
              <li><Link href="/support#size-guide" className="hover:text-[#171614] transition">Size &amp; Fit Guide</Link></li>
              <li><Link href="/support#contact" className="hover:text-[#171614] transition">Contact &amp; Assistance</Link></li>
              <li><Link href="/support#faq" className="hover:text-[#171614] transition">Frequently Asked Questions</Link></li>
              <li><Link href="/support#refund" className="hover:text-[#171614] transition">Returns &amp; Exchanges</Link></li>
              <li><Link href="/support#privacy" className="hover:text-[#171614] transition">Privacy &amp; Terms</Link></li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b5a42]">
              The Journal
            </p>
            <p className="mt-4 text-xs leading-relaxed text-[#544e45]">
              Seasonal portfolios, fabric stories, and private promotions delivered with discretion.
            </p>
            <NewsletterForm />
            <p className="mt-2 text-[10px] text-[#8c857b]">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#ded7ca] pt-6 text-[11px] text-[#736c62] sm:flex-row">
          <p>© {new Date().getFullYear()} Nova Threads Studio. All rights reserved.</p>
          
          <div className="flex items-center gap-3">
            <span>Payment Security: UPI · RuPay · Visa · Mastercard · NetBanking · COD</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/track" className="hover:text-[#171614] transition">Track</Link>
            <span>·</span>
            <Link href="/support" className="hover:text-[#171614] transition">Support</Link>
            <span>·</span>
            <Link href="/admin" className="hover:text-[#171614] transition text-[#8c857b]">Admin Portal</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
