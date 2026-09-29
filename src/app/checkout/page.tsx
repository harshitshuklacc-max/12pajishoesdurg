"use client";



import { useEffect, useMemo, useState } from "react";

import Script from "next/script";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { formatPrice } from "@/lib/utils";

import { useCart } from "@/store/cart";

import { cn } from "@/lib/utils";



type PaymentMethod = "online" | "cod";



type Quote = {

  subtotal: number;

  discount: number;

  shipping: number;

  shippingLabel: string;

  tax: number;

  total: number;

  codNote: string | null;

};



declare global {

  interface Window {

    Razorpay: new (options: Record<string, unknown>) => { open: () => void };

  }

}



export default function CheckoutPage() {

  const { items, subtotal, clear } = useCart();

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");

  const [quote, setQuote] = useState<Quote | null>(null);

  const [form, setForm] = useState({

    fullName: "",

    mobile: "",

    email: "",

    address: "",

    city: "Durg",

    state: "Chhattisgarh",

    pincode: "",

  });

  const [addressLocked, setAddressLocked] = useState(false);



  const linePayload = useMemo(

    () =>

      items.map((i) => ({

        productId: i.productId,

        variantId: i.variantId,

        quantity: i.quantity,

      })),

    [items]

  );



  useEffect(() => {

    fetch("/api/auth/me")

      .then((r) => (r.ok ? r.json() : null))

      .then((data) => {

        if (!data?.user) return;

        const u = data.user;

        if (u.address) {

          setForm({

            fullName: u.address.fullName,

            mobile: u.mobile,

            email: u.email || "",

            address: u.address.addressLine,

            city: u.address.city,

            state: u.address.state,

            pincode: u.address.pincode,

          });

          setAddressLocked(true);

        } else {

          setForm((f) => ({ ...f, fullName: u.fullName, mobile: u.mobile }));

        }

      });

  }, []);



  useEffect(() => {

    if (!items.length) return;

    let cancelled = false;

    fetch("/api/checkout/quote", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ items: linePayload, paymentMethod }),

    })

      .then((r) => (r.ok ? r.json() : null))

      .then((data) => {

        if (!cancelled && data && !data.error) setQuote(data);

      });

    return () => {

      cancelled = true;

    };

  }, [items.length, linePayload, paymentMethod]);



  if (!items.length) {

    return (

      <div className="mx-auto max-w-lg px-4 py-20 text-center">

        <p>Your cart is empty.</p>

        <Button className="mt-4" onClick={() => router.push("/shop")}>

          Shop now

        </Button>

      </div>

    );

  }



  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    setError("");

    setLoading(true);

    try {

      const res = await fetch("/api/checkout/create-order", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          customer: form,

          items: linePayload,

          paymentMethod,

        }),

      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Checkout failed");



      if (data.paymentMethod === "cod") {

        clear();

        router.push(`/order/success?order=${data.orderNumber}&cod=1`);

        return;

      }



      const rzp = new window.Razorpay({

        key: data.keyId,

        amount: data.amount,

        currency: "INR",

        name: data.storeName,

        description: `Order ${data.orderNumber}`,

        order_id: data.razorpayOrderId,

        handler: async (response: {

          razorpay_payment_id: string;

          razorpay_order_id: string;

          razorpay_signature: string;

        }) => {

          const verify = await fetch("/api/checkout/verify-payment", {

            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({

              orderNumber: data.orderNumber,

              razorpayPaymentId: response.razorpay_payment_id,

              razorpayOrderId: response.razorpay_order_id,

              razorpaySignature: response.razorpay_signature,

            }),

          });

          const vData = await verify.json();

          if (!verify.ok) {

            setError(vData.error || "Payment verification failed");

            return;

          }

          clear();

          router.push(`/order/success?order=${data.orderNumber}`);

        },

        prefill: {

          name: form.fullName,

          contact: form.mobile,

          email: form.email || undefined,

        },

        theme: { color: "#F97316" },

      });

      rzp.open();

    } catch (err) {

      setError(err instanceof Error ? err.message : "Something went wrong");

    } finally {

      setLoading(false);

    }

  }



  const displaySubtotal = quote?.subtotal ?? subtotal();

  const displayTotal = quote?.total ?? subtotal();



  return (

    <>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2 lg:px-6">

        <form onSubmit={handleSubmit} className="space-y-4">

          <h1 className="font-serif text-3xl font-semibold">Checkout</h1>

          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {addressLocked && (

            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">

              Using your saved registration address (cannot be changed here).

            </p>

          )}

          <Input required placeholder="Full name" value={form.fullName} readOnly={addressLocked} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />

          <Input required placeholder="Mobile number" value={form.mobile} readOnly={addressLocked} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />

          <Input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <textarea

            required

            placeholder="Full address"

            readOnly={addressLocked}

            className="min-h-24 w-full rounded-md border border-gray-200 px-3 py-2 text-sm read-only:bg-gray-50"

            value={form.address}

            onChange={(e) => setForm({ ...form, address: e.target.value })}

          />

          <div className="grid grid-cols-2 gap-3">

            <Input required readOnly={addressLocked} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />

            <Input required readOnly={addressLocked} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" />

          </div>

          <Input required readOnly={addressLocked} placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />



          <fieldset className="space-y-3 rounded-xl border border-black/10 bg-white p-4">

            <legend className="px-1 text-sm font-semibold">Payment method</legend>

            <label

              className={cn(

                "flex cursor-pointer gap-3 rounded-lg border p-3 transition",

                paymentMethod === "online" ? "border-paji-orange bg-paji-orange/5" : "border-gray-200"

              )}

            >

              <input

                type="radio"

                name="paymentMethod"

                value="online"

                checked={paymentMethod === "online"}

                onChange={() => setPaymentMethod("online")}

                className="mt-1"

              />

              <span>

                <span className="block font-medium">Pay online (Razorpay)</span>

                <span className="text-xs text-gray-600">UPI, cards, net banking — standard shipping rules apply</span>

              </span>

            </label>

            <label

              className={cn(

                "flex cursor-pointer gap-3 rounded-lg border p-3 transition",

                paymentMethod === "cod" ? "border-paji-orange bg-paji-orange/5" : "border-gray-200"

              )}

            >

              <input

                type="radio"

                name="paymentMethod"

                value="cod"

                checked={paymentMethod === "cod"}

                onChange={() => setPaymentMethod("cod")}

                className="mt-1"

              />

              <span>

                <span className="block font-medium">Cash on Delivery (COD)</span>

                <span className="text-xs text-gray-600">

                  ₹200 courier charge included — pay product total + ₹200 at delivery

                </span>

              </span>

            </label>

          </fieldset>



          <Button type="submit" size="lg" className="w-full" disabled={loading}>

            {loading

              ? "Processing..."

              : paymentMethod === "cod"

                ? `Place COD order · ${formatPrice(displayTotal)}`

                : "Pay with Razorpay"}

          </Button>

        </form>

        <div className="h-fit rounded-xl bg-paji-gray-light p-6">

          <h2 className="text-lg font-semibold">Order Summary</h2>

          <ul className="mt-4 space-y-3 text-sm">

            {items.map((i) => (

              <li key={`${i.productId}-${i.variantId}`} className="flex justify-between gap-4">

                <span>

                  {i.name} × {i.quantity}

                  {i.sizeLabel && ` · ${i.sizeLabel}`}

                  {i.colorName && ` · ${i.colorName}`}

                </span>

                <span>{formatPrice(i.price * i.quantity)}</span>

              </li>

            ))}

          </ul>

          <div className="mt-6 space-y-2 border-t pt-4 text-sm">

            <div className="flex justify-between">

              <span>Subtotal</span>

              <span>{formatPrice(displaySubtotal)}</span>

            </div>

            {quote && quote.discount > 0 && (

              <div className="flex justify-between text-green-700">

                <span>Discount</span>

                <span>-{formatPrice(quote.discount)}</span>

              </div>

            )}

            {quote && quote.shipping > 0 && (

              <div className="flex justify-between gap-4">

                <span className="text-gray-600">{quote.shippingLabel}</span>

                <span>{formatPrice(quote.shipping)}</span>

              </div>

            )}

            {quote && quote.tax > 0 && (

              <div className="flex justify-between">

                <span>Tax</span>

                <span>{formatPrice(quote.tax)}</span>

              </div>

            )}

          </div>

          {quote?.codNote && paymentMethod === "cod" && (

            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{quote.codNote}</p>

          )}

          <div className="mt-4 flex justify-between text-lg font-bold">

            <span>Total</span>

            <span className="text-paji-orange">{formatPrice(displayTotal)}</span>

          </div>

        </div>

      </div>

    </>

  );

}


