import type { Metadata } from "next";
import { SUPPORT_SECTIONS, SUPPORT_CONTACT } from "@/content/support";

export const metadata: Metadata = {
  title: "Support — Nova Threads",
  description:
    "Shipping & returns, size guide, contact and FAQs for Nova Threads.",
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Support</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Everything about shipping, sizing, and getting help with your order.
      </p>

      {/* Section nav */}
      <nav className="mt-8 flex flex-wrap gap-2">
        {SUPPORT_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            {s.title}
          </a>
        ))}
        <a
          href="/track"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Track an order →
        </a>
      </nav>

      {/* Sections */}
      <div className="mt-12 space-y-12">
        {SUPPORT_SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-xl font-bold">{s.title}</h2>
            <div className="mt-4 space-y-3">
              {s.body.map((entry, i) => {
                if (entry.startsWith("Q:")) {
                  const [q, ...rest] = entry.split("\n");
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-neutral-200 p-4"
                    >
                      <p className="font-medium">{q.slice(2).trim()}</p>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                        {rest.join("\n").replace(/^A:\s*/, "")}
                      </p>
                    </div>
                  );
                }
                return (
                  <p
                    key={i}
                    className="text-sm leading-relaxed text-neutral-600 whitespace-pre-line"
                  >
                    {entry}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-2xl bg-neutral-50 p-6 text-sm text-neutral-600">
        <p className="font-semibold text-neutral-900">Need a hand?</p>
        <p className="mt-2">
          Email us at{" "}
          <a
            className="underline underline-offset-4"
            href={`mailto:${SUPPORT_CONTACT.email}`}
          >
            {SUPPORT_CONTACT.email}
          </a>{" "}
          or WhatsApp {SUPPORT_CONTACT.whatsapp} ({SUPPORT_CONTACT.hours}).
        </p>
      </div>
    </div>
  );
}
