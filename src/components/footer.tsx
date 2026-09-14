import Link from "next/link";
import NewsletterForm from "@/components/newsletter-form";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 pb-16 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold">Nova Threads</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-600">
              Everyday essentials for men, women and kids — designed to last,
              priced to love.
            </p>
            <div className="mt-4 flex items-center gap-3" aria-label="Social links">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm transition hover:text-neutral-900"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.1a6.7 6.7 0 100 13.4 6.7 6.7 0 000-13.4zm0 11a4.3 4.3 0 110-8.6 4.3 4.3 0 010 8.6zm6.9-11.4a1.6 1.6 0 11-3.2 0 1.6 1.6 0 013.2 0z" />
                </svg>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="X (Twitter)"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm transition hover:text-neutral-900"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1.2 2h6.4l4.4 5.9L18.9 2zm-1.1 18.1h1.7L7 3.8H5.2l12.6 16.3z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm transition hover:text-neutral-900"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm transition hover:text-neutral-900"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M23.5 7.2a3 3 0 00-2.1-2.1C19.5 4.5 12 4.5 12 4.5s-7.5 0-9.4.6A3 3 0 00.5 7.2 31 31 0 000 12a31 31 0 00.5 4.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-4.8zM9.5 15.5v-7l6.3 3.5-6.3 3.5z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-900">
              Shop
            </p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li><Link href="/products?category=men" className="hover:text-neutral-900">Men</Link></li>
              <li><Link href="/products?category=women" className="hover:text-neutral-900">Women</Link></li>
              <li><Link href="/products?category=kids" className="hover:text-neutral-900">Kids</Link></li>
              <li><Link href="/products?sale=1" className="hover:text-neutral-900">Sale</Link></li>
              <li><Link href="/wishlist" className="hover:text-neutral-900">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-900">
              Support
            </p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li><Link href="/support#shipping" className="hover:text-neutral-900">Shipping &amp; Returns</Link></li>
              <li><Link href="/support#size-guide" className="hover:text-neutral-900">Size Guide</Link></li>
              <li><Link href="/support#contact" className="hover:text-neutral-900">Contact Us</Link></li>
              <li><Link href="/support#faq" className="hover:text-neutral-900">FAQs</Link></li>
              <li><Link href="/track" className="font-medium text-neutral-900 hover:underline">Track Order →</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-900">
              Policies
            </p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li><Link href="/support#privacy" className="hover:text-neutral-900">Privacy Policy</Link></li>
              <li><Link href="/support#terms" className="hover:text-neutral-900">Terms of Service</Link></li>
              <li><Link href="/support#refund" className="hover:text-neutral-900">Refund &amp; Cancellation</Link></li>
            </ul>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-neutral-900">
              Stay in the loop
            </p>
            <p className="mt-3 text-sm text-neutral-600">
              New drops, early sales, no spam.
            </p>
            <NewsletterForm />
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Nova Threads. Demo store — no real orders are fulfilled.</p>
          <p className="flex items-center gap-2">
            <span>We accept UPI · Cards · NetBanking · COD</span>
          </p>
          <p>
            <Link href="/track" className="hover:text-neutral-900">Track order</Link>
            <span className="mx-2">·</span>
            <Link href="/support" className="hover:text-neutral-900">Support</Link>
            <span className="mx-2">·</span>
            <Link href="/admin" className="hover:text-neutral-900">Store admin</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
