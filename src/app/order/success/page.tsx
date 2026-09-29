import Link from "next/link";

import { Button } from "@/components/ui/button";

import { CheckCircle } from "lucide-react";



type SP = Promise<{ order?: string; cod?: string }>;



export default async function OrderSuccessPage({ searchParams }: { searchParams: SP }) {

  const { order, cod } = await searchParams;

  const isCod = cod === "1";



  return (

    <div className="mx-auto max-w-lg px-4 py-20 text-center">

      <CheckCircle className="mx-auto h-16 w-16 text-green-600" />

      <h1 className="mt-6 text-3xl font-bold">{isCod ? "Order placed" : "Payment successful"}</h1>

      {order && <p className="mt-2 text-gray-600">Order {order} is confirmed.</p>}

      {isCod && (

        <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">

          Cash on Delivery: please keep the order total ready at delivery. This includes a ₹200 courier charge.

        </p>

      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">

        {order && (

          <Button asChild variant="outline">

            <Link href={`/order/invoice/${order}`}>View invoice</Link>

          </Button>

        )}

        <Button asChild>

          <Link href="/shop">Continue shopping</Link>

        </Button>

      </div>

    </div>

  );

}


