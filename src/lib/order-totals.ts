import type { StoreSettings } from "@/lib/settings";

export const COD_COURIER_CHARGE_INR = 200;

export type PaymentMethod = "online" | "cod";

export function computeShippingAmount(
  paymentMethod: PaymentMethod,
  subtotalAfterDiscount: number,
  settings: Pick<StoreSettings, "shippingFlatRate" | "freeShippingAbove" | "codCourierCharge">
): number {
  if (paymentMethod === "cod") {
    return settings.codCourierCharge ?? COD_COURIER_CHARGE_INR;
  }
  let shipping = settings.shippingFlatRate;
  if (settings.freeShippingAbove && subtotalAfterDiscount >= settings.freeShippingAbove) {
    shipping = 0;
  }
  return shipping;
}

export function shippingLineLabel(paymentMethod: PaymentMethod, shipping: number): string {
  if (shipping <= 0) return "Shipping";
  if (paymentMethod === "cod") {
    return "Courier charge (COD — includes delivery)";
  }
  return "Shipping";
}

export function computeOrderTotal(
  subtotal: number,
  discount: number,
  paymentMethod: PaymentMethod,
  settings: Pick<StoreSettings, "shippingFlatRate" | "freeShippingAbove" | "taxPercent" | "codCourierCharge">
) {
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = computeShippingAmount(paymentMethod, afterDiscount, settings);
  const tax = (afterDiscount * settings.taxPercent) / 100;
  const total = afterDiscount + shipping + tax;
  return { afterDiscount, shipping, tax, total };
}
