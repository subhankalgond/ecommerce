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
      .catch(() => setError("Could not check delivery. Try again."))
      .finally(() => setLoading(false));
  };

  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <p className="text-sm font-semibold">Check delivery</p>
      <div className="mt-2 flex gap-2">
        <input
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && pin.length === 6 && check()}
          inputMode="numeric"
          placeholder="Enter pincode"
          className="w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          aria-label="Delivery pincode"
        />
        <button
          type="button"
          onClick={check}
          disabled={pin.length !== 6 || loading}
          className="rounded-lg border border-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:opacity-40"
        >
          {loading ? "Checking…" : "Check"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      {result && (
        <div className="mt-2 space-y-1 text-sm text-neutral-600">
          <p>
            🚚 Delivery to <span className="font-medium text-neutral-900">{result.city}, {result.state}</span> by{" "}
            <span className="font-medium text-neutral-900">{result.eta}</span> ({result.days} day{result.days === 1 ? "" : "s"})
          </p>
          <p>{result.codAvailable ? "✓ Cash on Delivery available" : "✗ COD not available here — prepay online"}</p>
        </div>
      )}
    </div>
  );
}
