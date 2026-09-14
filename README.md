# Nova Threads 🧵

A modern ecommerce storefront for clothing — men, women and kids — built with
**Next.js** and **Tailwind CSS**. Prices are in **INR (₹)**.

Payments support **two providers** — configure either or both:

- **Stripe Checkout** (test mode) — international cards, Apple Pay
- **Razorpay** (test mode) — UPI, Indian cards, netbanking, wallets

> Demo store with placeholder products. Swap the name, products and images for
> your own brand when ready.

## Features

- 🛍️ Product catalog with categories (Men / Women / Kids), sale filter and sorting
- 🔎 **Fuzzy clothing search** — misspellings work ("tshrt", "jens", "underwar"), synonyms map correctly (tee → t-shirts, jumper → sweaters, sari/saree, kurta, lehenga…), and non-clothing queries get a helpful "this store only sells clothing" message
- 🛫 **Admin dashboard** at `/admin` — password-protected list of all orders with revenue stats, filtering, search and status updates (placed → confirmed → shipped → delivered / cancelled)
- 📦 **Order tracking** at `/track` — customers enter their order ID to see live status, items and totals
- 📲 **Order notifications** — every verified order sends a WhatsApp message (CallMeBot) and an email (Resend) to the store admin
- 🧭 **Support page** at `/support` — shipping & returns, size guide, contact and FAQs (wired into the footer)
- 📄 Product detail pages with size selection and add-to-cart validation
- 🛒 Cart with localStorage persistence, slide-in drawer and free-shipping progress bar
- 💳 Stripe Checkout (test mode) — server-side session creation, cart re-priced on the server
- 🇮🇳 Razorpay checkout (test mode) — UPI/cards/netbanking with server-side HMAC signature + payment-status verification
- 🔀 Payment provider picker on the checkout page that auto-detects what's configured
- ✅ Order confirmation page that verifies payments server-side, records the order (`.data/orders.json`) and shows a shareable order ID (like `NT-4KD9P2`)
- 📱 Fully responsive, mobile-friendly navigation

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 — browsing and the cart work immediately, no keys needed.

## Enabling payments

Both providers work in test mode with a free account and no business
verification. Configure either or both — the checkout page auto-detects what's
available and shows a picker when both are set up.

### Stripe (test mode)

1. Create a free account at [dashboard.stripe.com](https://dashboard.stripe.com).
2. Toggle **Test mode** on, then go to **Developers → API keys** and copy the
   **Secret key** (`sk_test_...`).
3. Add it to the `.env` file in the project root (already created — just
   replace the placeholder):

   ```
   STRIPE_SECRET_KEY=sk_test_your_actual_key
   ```

**Test cards** (any future expiry, any CVC):

| Card number | Behaviour |
| --- | --- |
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 9995` | Declined (insufficient funds) |

> **Note for India:** Stripe has paused new *live* merchant onboarding for
> India-based businesses, but test mode works fully — which is exactly why
> Razorpay is included as the India-ready option.

### Razorpay (test mode)

1. Create a free account at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Go to **Settings → API Keys → Generate Test Key**.
3. Add **both** values to the `.env` file in the project root (already
   created — just replace the placeholders):

   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
   ```

4. Restart the dev server after editing `.env`.

**Testing:** in the Razorpay modal, use test mode's standard success card
(`4111 1111 1111 1111`, any future expiry, any CVV) or the test UPI ID
(`success@razorpay`). Failed-payment flows (e.g. `failure@razorpay` UPI) are
also simulated in test mode.

The checkout page automatically shows Razorpay when its keys are present —
when only Razorpay is configured it becomes the default method.

## Admin, order tracking & notifications

### Admin dashboard (`/admin`)

Set a password in `.env` (restart the server afterwards):

```
ADMIN_PASSWORD=your_secret_password
```

If you don't set one, the dev fallback password is `novathreads-admin`.
Sign in at **http://localhost:3000/admin** to see every order (most recent
first), revenue stats, filter by status, search by order ID or email, and
update an order's status — which the customer sees instantly on `/track`.

### Order tracking (`/track`)

After paying, the customer gets an order ID like `NT-4KD9P2` on the
confirmation page. Entering it at `/track` (or the header's **Track order**
link) shows live status on a progress timeline plus items and totals. Lookup
also works with the raw payment ID, and the masked email is shown so
customers can confirm it's their order.

### WhatsApp + email order notifications

When an order is verified, the admin gets a **WhatsApp message** and an
**email** with the full order. Both are optional — set what you want in
`.env`:

```
ADMIN_WHATSAPP_NUMBER=919000000000   # your number, country code, digits only
CALLMEBOT_APIKEY=A1B2C3...           # free, from api.callmebot.com
RESEND_API_KEY=re_...                # free tier, from resend.com/api-keys
ADMIN_EMAIL=you@example.com
```

**CallMeBot setup (2 minutes, free):** add `+34 644 51 95 23` (CallMeBot AI)
to your phone contacts, send it `"I allow callmebot to send me messages"` on
WhatsApp, and it replies with your API key. Every new order then lands in
your own WhatsApp.

**Resend setup:** create a free API key at resend.com. Until you verify your
own domain, emails send from their test sender — fine for development.

A failed notification never blocks a completed payment — it's logged on the
server instead. Orders are stored in `.data/orders.json` (git-ignored).

### Support page (`/support`)

Shipping & returns, size guide, contact details and FAQs live in
`src/content/support.ts` — edit that one file to change everything. The
footer's Support links now point to the matching sections, and `/track` is
linked from the header and footer.

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Home: hero, category tiles, featured products
│   ├── products/
│   │   ├── page.tsx              # Catalog route (Suspense shell)
│   │   ├── catalog.tsx           # Filters, sort, search results, grid
│   │   └── [slug]/
│   │       ├── page.tsx          # Product detail
│   │       └── add-to-cart.tsx   # Size picker + quantity + add button
│   ├── cart/page.tsx             # Full cart page
│   ├── checkout/
│   │   ├── page.tsx              # Order review, provider picker, pay button
│   │   └── success/page.tsx      # Verified confirmation + order recording
│   ├── track/page.tsx            # Customer order tracking (/track)
│   ├── admin/
│   │   ├── page.tsx              # Session gate
│   │   └── dashboard.tsx         # Orders dashboard (login, list, statuses)
│   ├── support/page.tsx          # Shipping / size guide / contact / FAQ
│   ├── api/checkout/route.ts     # Creates the Stripe Checkout Session
│   ├── api/track/route.ts        # Public order lookup
│   ├── api/admin/
│   │   ├── login/route.ts        # Sets the admin session cookie
│   │   ├── logout/route.ts
│   │   └── orders/route.ts       # List orders + update status
│   └── api/razorpay/
│       ├── order/route.ts        # Creates the Razorpay order
│       └── verify/route.ts       # HMAC + capture verification + order record
├── components/
│   ├── cart-provider.tsx         # Cart context + localStorage
│   ├── cart-drawer.tsx           # Slide-in cart
│   ├── use-razorpay.ts           # Razorpay checkout.js loader + modal hook
│   ├── header.tsx / footer.tsx
│   ├── product-card.tsx
│   └── search-bar.tsx
└── lib/
    ├── products.ts               # Product catalog, types, helpers, INR formatting
    ├── search.ts                 # Fuzzy clothing search (typos + synonyms)
    ├── orders.ts                 # File-based order store (.data/orders.json)
    ├── notify.ts                 # WhatsApp (CallMeBot) + email (Resend) alerts
    ├── admin-auth.ts             # Admin password gate + session cookie
    ├── pricing.ts                # Shared server-side cart validation + pricing
    └── store-config.ts           # Shipping rule shared by UI and payment APIs
```

## How the checkout flow works

1. The client sends only `productId`, `size` and `quantity` to the payment API.
2. The route **re-prices every line from the server-side catalog** (shared
   logic in `src/lib/pricing.ts`) — client prices are never trusted — and
   applies the same shipping rule as the storefront (`src/lib/store-config.ts`:
   free over ₹999, else ₹99).
3. **Stripe path:** a Checkout Session is created in INR and the browser
   redirects to Stripe's hosted page. **Razorpay path:** an order is created
   server-side, the Razorpay modal opens in-browser, and the returned signature
   is verified server-side (HMAC-SHA256) plus a live `payments.fetch` to
   confirm `status === "captured"`.
4. `/checkout/success` re-verifies the payment server-side (Stripe session
   lookup or Razorpay signature + capture status) before showing the order.
5. Once verified, the order is recorded (idempotently) in `.data/orders.json`
   with a friendly ID like `NT-4KD9P2`, the admin is notified on
   WhatsApp/email, and the ID is shown to the customer for tracking at
   `/track`.

## Customizing

- **Brand name** — search-and-replace `Nova Threads` in
  `src/app/layout.tsx`, `src/components/header.tsx` and
  `src/components/footer.tsx`.
- **Products** — edit `PRODUCTS` in `src/lib/products.ts` (prices are in
  paise: ₹1,499 = `149900`). Replace the Unsplash `image` URLs with your own.
- **Payments** — Stripe session in `src/app/api/checkout/route.ts`; Razorpay in
  `src/app/api/razorpay/{order,verify}/route.ts`; shared pricing in
  `src/lib/pricing.ts`.
- **Shipping rule** — `src/lib/store-config.ts` (`FREE_SHIPPING_THRESHOLD`,
  `SHIPPING_FEE`, `getShipping`); used by both the cart UI and both payment
  routes, so it can never drift.
- **Styling** — Tailwind CSS v4; tweak `src/app/globals.css`.

## Scripts

| Command         | Purpose                        |
| --------------- | ------------------------------ |
| `npm run dev`   | Start the dev server           |
| `npm run build` | Production build               |
| `npm start`     | Serve the production build     |
| `npm run typecheck` | TypeScript type checking   |
