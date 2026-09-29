"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      <p className="mt-2 text-gray-600">Sign in to save your favourite styles.</p>
      <Button asChild className="mt-6">
        <Link href="/account">Login with OTP</Link>
      </Button>
    </div>
  );
}
