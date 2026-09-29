import { notFound } from "next/navigation";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStoreSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";
import { StoreLogo } from "@/components/store/logo";
import { PrintButton } from "@/components/store/print-button";

type Props = { params: Promise<{ orderNumber: string }> };

export default async function InvoicePage({ params }: Props) {
  const { orderNumber } = await params;
  const [order, settings] = await Promise.all([
    db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumber),
      with: { items: true },
    }),
    getStoreSettings(),
  ]);
  if (!order) notFound();

  const payment = await db.query.payments.findFirst({ where: eq(payments.orderId, order.id) });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 print:py-4">
      <div className="rounded-xl border bg-white p-8 shadow-sm print:shadow-none">
        <div className="flex items-start justify-between border-b pb-6">
          <StoreLogo settings={settings} />
          <div className="text-right text-sm">
            <p className="font-bold text-lg">INVOICE</p>
            <p>{order.orderNumber}</p>
            <p className="text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-6 text-sm md:grid-cols-2">
          <div>
            <p className="font-semibold">{settings.storeName}</p>
            <p className="text-gray-600">{settings.address}</p>
            <p className="text-gray-600">{settings.phone}</p>
          </div>
          <div>
            <p className="font-semibold">Bill to</p>
            <p>{order.customerName}</p>
            <p>{order.customerMobile}</p>
            <p className="text-gray-600">{order.shippingAddress}</p>
            <p className="text-gray-600">
              {order.shippingCity}, {order.shippingState} — {order.shippingPincode}
            </p>
          </div>
        </div>
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-3">
                  {item.productName}
                  {item.sizeLabel && <span className="text-gray-500"> · Size {item.sizeLabel}</span>}
                  {item.colorName && <span className="text-gray-500"> · {item.colorName}</span>}
                  {!item.sizeLabel && !item.colorName && <span className="text-gray-500"> · Size N/A</span>}
                </td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3 text-right">{formatPrice(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 space-y-1 text-sm text-right">
          <p>Subtotal: {formatPrice(order.subtotal)}</p>
          {parseFloat(order.discountAmount || "0") > 0 && <p>Discount: -{formatPrice(order.discountAmount!)}</p>}
          {parseFloat(order.shippingAmount || "0") > 0 && (
            <p>
              {order.paymentMethod === "cod" ? "Courier (COD)" : "Shipping"}: {formatPrice(order.shippingAmount!)}
            </p>
          )}
          {parseFloat(order.taxAmount || "0") > 0 && <p>Tax: {formatPrice(order.taxAmount!)}</p>}
          <p className="text-lg font-bold text-paji-orange">Total: {formatPrice(order.total)}</p>
          <p className="text-gray-500 capitalize">
            {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"} · {payment?.status ?? "pending"}
          </p>
        </div>
      </div>
      <div className="mt-6">
        <PrintButton />
      </div>
    </div>
  );
}
