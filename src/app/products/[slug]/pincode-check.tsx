"use client";

import { useState } from "react";

interface Result {
  city: string;
  state: string;
  days: number;
  eta: string;
  codAvailable: boolean;
}

export default function PincodeCheck() {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const check = () => {
    setError(null);
    setResult(null);
    setLoading(true);
    fetch("/api/pincode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pincode: pin }),
    })
      .then((r) => r.json())
      .then((d: Result & { error?: string }) => {
        if (d.error) setError(d.error);
        else setResult(d);
      })
      .catch(() => setError("Could not verify postal code. Please try again."))
      .finally(() => setLoading(false));
  };

  return (
    <div className="border border-[#e5dfd5] bg-[#faf8f5] p-4 text-xs">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-[#8b5a42]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 00-1.125-1.125h-9A1.125 1.125 0 002.25 3.75v10.5M16.5 7.5V14.25m-14.25 0h14.25" />
        </svg>
        <span className="font-semibold uppercase tracking-wider text-[#171614]">
          Check Delivery &amp; COD Availability
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && pin.length === 6 && check()}
          inputMode="numeric"
          placeholder="6-digit pincode"
          className="w-40 border border-[#ded7ca] bg-white px-3 py-1.5 text-xs text-[#171614] placeholder:text-[#9e978e] focus:border-[#171614] focus:outline-none"
          aria-label="Delivery pincode"
        />
        <button
          type="button"
          onClick={check}
          disabled={pin.length !== 6 || loading}
          className="border border-[#171614] bg-white px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-[#171614] hover:bg-[#171614] hover:text-white transition disabled:opacity-40"
        >
          {loading ? "Checking…" : "Estimate"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-[#8b5a42] font-medium">{error}</p>}

      {result && (
        <div className="mt-3 space-y-1.5 border-t border-[#ede6da] pt-2.5 text-xs text-[#544e45]">
          <p>
            Standard dispatch to <strong className="font-medium text-[#171614]">{result.city}, {result.state}</strong> by{" "}
            <strong className="font-medium text-[#171614]">{result.eta}</strong> ({result.days} business days).
          </p>
          <p className="text-[11px]">
            {result.codAvailable ? (
              <span className="text-[#515c4d] font-medium">✓ Cash on Delivery is serviceable at this location.</span>
            ) : (
              <span className="text-[#8b5a42] font-medium">Prepaid online checkout required for this pincode.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
