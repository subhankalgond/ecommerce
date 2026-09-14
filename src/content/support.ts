export interface SupportSection {
  id: string;
  title: string;
  /** each entry is a paragraph; lines starting with "Q:" render as Q&A */
  body: string[];
}

export const SUPPORT_CONTACT = {
  email: "support@novathreads.example",
  whatsapp: "+91 90000 00000",
  hours: "Mon–Sat, 10am–7pm IST",
};

export const SUPPORT_SECTIONS: SupportSection[] = [
  {
    id: "shipping",
    title: "Shipping & Returns",
    body: [
      "Free shipping on all orders above ₹999. Below that, a flat ₹99 fee applies at checkout. Orders are dispatched within 1–2 business days and typically arrive in 3–7 days depending on your PIN code.",
      "Returns are accepted within 14 days of delivery as long as items are unworn, unwashed and have their tags. Refunds are issued to the original payment method within 5–7 business days of the returned item reaching our warehouse.",
      "To start a return, contact us with your order ID (you'll find it on your confirmation page, or use Track Order).",
    ],
  },
  {
    id: "size-guide",
    title: "Size Guide",
    body: [
      "Adult tops & shirts (chest, inches): XS 34 · S 36 · M 38–40 · L 40–42 · XL 42–44 · XXL 44–46.",
      "Adult bottoms & jeans (waist, inches): XS 26–28 · S 28–30 · M 30–32 · L 32–34 · XL 34–36 · XXL 36–38.",
      "Kids sizes follow age: 2Y (2 years) · 4Y · 6Y · 8Y · 10Y. When between sizes, we recommend sizing up — kids grow fast.",
      "Footwear: kids sizes 8K–12K follow UK kids sizing. If in doubt, measure the foot and add 1 cm of growing room.",
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    body: [
      `Email: ${SUPPORT_CONTACT.email} — we reply within one business day.`,
      `WhatsApp: ${SUPPORT_CONTACT.whatsapp} — fastest for order and size questions.`,
      `Hours: ${SUPPORT_CONTACT.hours}.`,
      "Have your order ID ready (it looks like NT-XXXXXX) so we can help you faster.",
    ],
  },
  {
    id: "faq",
    title: "FAQs",
    body: [
      "Q: How do I track my order?\nA: Open Track Order in the menu and enter the order ID from your confirmation (or your payment id). You'll see live status: placed → confirmed → packed → shipped → out for delivery → delivered.",
      "Q: Which payment methods do you accept?\nA: UPI, cards, netbanking and wallets through Razorpay, international cards and Apple Pay through Stripe, and Cash on Delivery on serviceable pincodes.",
      "Q: Is my payment secure?\nA: Yes — payments run on the provider's own hosted page, and every order is verified server-side before it's confirmed. We never see or store your card details.",
      "Q: Can I change or cancel an order?\nA: Yes — open Track Order and use “Cancel order” while the status is placed, confirmed or packed. After shipping, contact us.",
      "Q: How do returns work?\nA: Once your order is delivered, use “Request return” on the tracking page within 30 days. We pick up the item in 2–3 days and refund after quality check.",
      "Q: Do you ship outside India?\nA: International shipping is coming soon — join the newsletter at the bottom of the page and you'll hear first.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    body: [
      "We collect only what we need to fulfil your order: your name, delivery address, phone number and email. Your email is used for the order receipt and delivery updates.",
      "Payments are processed entirely by Razorpay or Stripe — we never see or store your card, UPI or banking details.",
      "Order data (items, amounts, status history) is stored securely on our servers and is never sold or shared with third parties beyond the courier delivering your order.",
      "You can ask us to delete your account data any time via the contact section above.",
    ],
  },
  {
    id: "terms",
    title: "Terms of Service",
    body: [
      "This is a demo storefront — orders are recorded but not physically fulfilled, and no real payments are charged on COD orders.",
      "Product prices are shown in Indian Rupees and include taxes. Coupon discounts are validated server-side and cannot be combined.",
      "Placing an order on Cash on Delivery requires a serviceable pincode; orders above ₹50,000 must be prepaid.",
      "We may cancel and fully refund any order that fails payment verification, is flagged as fraudulent, or cannot be shipped to the given address.",
    ],
  },
  {
    id: "refund",
    title: "Refund & Cancellation",
    body: [
      "Cancel any time before your order ships from the Track Order page — refunds for prepaid orders are initiated within 24 hours and arrive in 3–5 business days.",
      "COD orders cancelled before shipping require no refund. If a COD order was already shipped, refuse delivery or contact us.",
      "Approved returns are refunded to the original payment method after the item passes our quality check at the warehouse (usually 1–2 days after pickup).",
      "You can follow your refund status live on the tracking page (“refund: pending → completed”).",
    ],
  },
];
