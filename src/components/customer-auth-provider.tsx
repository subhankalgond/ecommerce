"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { SavedAddress } from "@/lib/order-types";

/** Mirrors PublicCustomer from src/lib/auth-users.ts */
export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  addresses: SavedAddress[];
}

export interface CustomerOrderSummary {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  estimatedDelivery?: string;
  itemCount: number;
  items: { name: string; image: string; slug: string; size: string; qty: number }[];
}

interface CustomerContextValue {
  user: CustomerUser | null;
  orders: CustomerOrderSummary[];
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<string | null>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string
  ) => Promise<string | null>;
  logout: () => Promise<void>;
  saveUser: (user: CustomerUser | null) => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as {
        user: CustomerUser | null;
        orders?: CustomerOrderSummary[];
      };
      setUser(data.user);
      setOrders(data.orders ?? []);
    } catch {
      setUser(null);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { user?: CustomerUser; error?: string };
      if (!res.ok || !data.user) return data.error ?? "Login failed.";
      setUser(data.user);
      void refresh();
      return null;
    },
    [refresh]
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      phone: string,
      password: string
    ): Promise<string | null> => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = (await res.json()) as { user?: CustomerUser; error?: string };
      if (!res.ok || !data.user) return data.error ?? "Signup failed.";
      setUser(data.user);
      void refresh();
      return null;
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setOrders([]);
  }, []);

  const saveUser = useCallback((u: CustomerUser | null) => {
    setUser(u);
  }, []);

  return (
    <CustomerContext.Provider
      value={{ user, orders, loading, refresh, login, register, logout, saveUser }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer(): CustomerContextValue {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used inside <CustomerProvider>");
  return ctx;
}
