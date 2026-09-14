"use client";

import { useCallback, useState } from "react";

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface RazorpayOrderParams {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  email: string;
  description: string;
  onSuccess: (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onError: (message: string) => void;
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);

  const openCheckout = useCallback(async (p: RazorpayOrderParams) => {
    setLoading(true);
    const loaded = await loadScript(SCRIPT_SRC);
    if (!loaded || !window.Razorpay) {
      p.onError(
        "Could not load Razorpay. Check your internet connection and try again."
      );
      setLoading(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: p.keyId,
      amount: p.amount,
      currency: p.currency,
      name: "Nova Threads",
      description: p.description,
      order_id: p.orderId,
      prefill: { email: p.email },
      theme: { color: "#171717" },
      modal: {
        ondismiss: () => {
          setLoading(false);
          p.onError("Payment cancelled.");
        },
      },
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        setLoading(false);
        p.onSuccess(response);
      },
    });
    rzp.open();
  }, []);

  return { openCheckout, loading };
}
