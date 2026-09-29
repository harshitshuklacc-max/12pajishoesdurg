import type { StoreSettings } from "@/lib/settings";

export const COD_ADVANCE_INR = 200;
export const PREPAID_SHIPPING_FEE_INR = 100;

export type PaymentMethod = "online" | "cod";

export function getCodAdvanceAmount(
  settings: Pick<StoreSettings, "codCourierCharge">
): number {
  return settings.codCourierCharge ?? COD_ADVANCE_INR;
}

export function computeShippingAmount(
  paymentMethod: PaymentMethod,
  subtotalAfterDiscount: number,
  settings: Pick<StoreSettings, "shippingFlatRate" | "freeShippingAbove" | "codCourierCharge">
): number {
  if (paymentMethod === "cod") {
    return 0;
  }
  if (settings.freeShippingAbove && subtotalAfterDiscount >= settings.freeShippingAbove) {
    return 0;
  }
  return PREPAID_SHIPPING_FEE_INR;
}

export function shippingLineLabel(paymentMethod: PaymentMethod, shipping: number): string {
  if (shipping <= 0) {
    return paymentMethod === "online" ? "Shipping (prepaid)" : "Shipping";
  }
  if (paymentMethod === "online") {
    return "Shipping (orders below free-shipping minimum)";
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
