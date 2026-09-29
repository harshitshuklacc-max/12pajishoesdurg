"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

type Address = {
  fullName: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  mobile: string;
};

type User = {
  userId: number;
  mobile: string;
  fullName: string;
  email?: string;
  address: Address | null;
  addressLocked: boolean;
};

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  items: { productName: string; quantity: number }[];
};

function safeReturnPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export default function AccountPage() {
  const router = useRouter();
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [step, setStep] = useState<"phone" | "otp" | "address" | "dashboard">("phone");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [displayOtp, setDisplayOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    addressLine: "",
    city: "Durg",
    state: "Chhattisgarh",
    pincode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function continueAfterLogin(userData: User) {
    const target = returnTo;
    if (target && userData.address) {
      router.replace(target);
      return true;
    }
    return false;
  }

  async function loadSession() {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.user) return null;
    setUser(data.user);
    if (!data.user.address) {
      setAddressForm((f) => ({ ...f, fullName: data.user.fullName || "" }));
      setStep("address");
    } else {
      if (continueAfterLogin(data.user)) return data.user;
      setStep("dashboard");
      const oRes = await fetch("/api/account/orders");
      if (oRes.ok) setOrders(await oRes.json());
    }
    return data.user;
  }

  useEffect(() => {
    setReturnTo(safeReturnPath(new URLSearchParams(window.location.search).get("next")));
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to send OTP");
      return;
    }
    setDisplayOtp(data.displayOtp);
    setStep("otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp, fullName: fullName || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Invalid OTP");
      return;
    }
    const u = await loadSession();
    if (u?.address && returnTo) router.replace(returnTo);
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/account/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressForm),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not save address");
      return;
    }
    const u = await loadSession();
    if (u?.address && returnTo) router.replace(returnTo);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOrders([]);
    setStep("phone");
    setMobile("");
    setOtp("");
    setDisplayOtp("");
  }

  if (step === "address") {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold">Complete registration</h1>
          <p className="mt-1 text-sm text-gray-500">
            {returnTo === "/checkout"
              ? "Add your delivery address to continue checkout."
              : "Enter your delivery address once. It cannot be changed later — contact the store for help."}
          </p>
          {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          <form onSubmit={saveAddress} className="mt-6 space-y-3">
            <Input placeholder="Full name" value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} required />
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Full address"
              value={addressForm.addressLine}
              onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
              required
            />
            <Input placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required />
            <Input placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} required />
            <Input placeholder="Pincode" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} required />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save address & continue"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (step === "dashboard" && user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="mt-1 text-gray-600">Welcome, {user.fullName}</p>
            <p className="text-sm text-gray-500">+91 {user.mobile}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        {user.address && (
          <section className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Saved address</h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              {user.address.fullName}
              <br />
              {user.address.addressLine}
              <br />
              {user.address.city}, {user.address.state} — {user.address.pincode}
            </p>
            <p className="mt-2 text-xs text-amber-700">Address is locked and cannot be edited online.</p>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-xl font-semibold">My Orders</h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-gray-500">No orders yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {orders.map((o) => (
                <li key={o.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{o.orderNumber}</span>
                    <span className="rounded-full bg-paji-orange/10 px-3 py-0.5 text-xs font-medium text-paji-orange capitalize">
                      {o.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {new Date(o.createdAt).toLocaleDateString("en-IN")} · {formatPrice(o.total)}
                  </p>
                  <ul className="mt-2 text-sm text-gray-500">
                    {o.items.map((item, i) => (
                      <li key={i}>
                        {item.productName} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/order/invoice/${o.orderNumber}`} className="mt-2 inline-block text-sm text-paji-orange hover:underline">
                    View invoice
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-2xl border bg-white p-8 shadow-card">
        <h1 className="text-2xl font-bold">Customer Login</h1>
        <p className="mt-1 text-sm text-gray-500">
          {returnTo === "/checkout"
            ? "Sign in with your mobile number to complete your order."
            : "Sign in with your mobile number"}
        </p>

        {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        {step === "phone" && (
          <form onSubmit={sendOtp} className="mt-6 space-y-4">
            <Input type="tel" placeholder="10-digit mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Get OTP"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <div className="rounded-lg border-2 border-dashed border-paji-orange bg-paji-orange/5 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-paji-orange">Your OTP (on-screen)</p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em]">{displayOtp}</p>
            </div>
            <Input
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
              className="text-center text-lg tracking-widest"
            />
            <Input placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <button type="button" className="w-full text-sm text-gray-500 hover:text-paji-orange" onClick={() => setStep("phone")}>
              Change number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
