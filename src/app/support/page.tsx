import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_SECTIONS, SUPPORT_CONTACT } from "@/content/support";

export const metadata: Metadata = {
  title: "Client Care & Editorial Policies — Nova Threads",
  description:
    "Shipping & returns, size guide, contact assistance, and FAQs for Nova Threads clothing.",
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="border-b border-[#e5dfd5] pb-6">
        <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
          Assistance &amp; Guidelines
        </span>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-[#171614]">
          Client Care &amp; Store Policies
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#615a51] leading-relaxed">
          Comprehensive guidance on sizing proportions, domestic shipping timelines, care recommendations, and customer support.
        </p>
      </div>

      {/* Section Quick Navigation */}
      <nav aria-label="Support sections" className="mt-8 flex flex-wrap gap-2">
        {SUPPORT_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="border border-[#ded7ca] bg-white px-3.5 py-1.5 text-xs font-medium tracking-wider uppercase text-[#544e45] hover:border-[#171614] hover:text-[#171614] transition"
          >
            {s.title}
          </a>
        ))}
        <Link
          href="/track"
          className="border border-[#171614] bg-[#171614] px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
        >
          Track Shipment →
        </Link>
      </nav>

      {/* Content Sections */}
      <div className="mt-12 space-y-16">
        {SUPPORT_SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24 border-t border-[#ede6da] pt-8">
            <h2 className="font-serif text-2xl text-[#171614]">{s.title}</h2>
            <div className="mt-5 space-y-4">
              {s.body.map((entry, i) => {
                if (entry.startsWith("Q:")) {
                  const [q, ...rest] = entry.split("\n");
                  return (
                    <div
                      key={i}
                      className="border border-[#e5dfd5] bg-[#faf8f5] p-5 text-xs"
                    >
                      <p className="font-serif text-sm font-medium text-[#171614]">
                        {q.slice(2).trim()}
                      </p>
                      <p className="mt-2 leading-relaxed text-[#544e45]">
                        {rest.join("\n").replace(/^A:\s*/, "")}
                      </p>
                    </div>
                  );
                }
                return (
                  <p
                    key={i}
                    className="text-xs sm:text-sm leading-relaxed text-[#544e45] whitespace-pre-line"
                  >
                    {entry}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Help Banner */}
      <div className="mt-16 border border-[#ded7ca] bg-[#f7f4ee] p-6 text-xs text-[#544e45]">
        <p className="font-serif text-base text-[#171614]">Direct Client Assistance</p>
        <p className="mt-2 leading-relaxed">
          For specialized sizing consultations or order changes, email our studio at{" "}
          <a
            className="text-[#171614] font-medium underline underline-offset-2 hover:text-[#8b5a42]"
            href={`mailto:${SUPPORT_CONTACT.email}`}
          >
            {SUPPORT_CONTACT.email}
          </a>{" "}
          or WhatsApp{" "}
          <strong className="text-[#171614]">{SUPPORT_CONTACT.whatsapp}</strong> ({SUPPORT_CONTACT.hours}).
        </p>
      </div>
    </div>
  );
}
