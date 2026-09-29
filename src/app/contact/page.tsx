import { getStoreSettings } from "@/lib/settings";
import { MapPin, Phone, Clock, Instagram } from "lucide-react";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const s = await getStoreSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 lg:px-6">
      <h1 className="text-4xl font-bold">Contact Us</h1>
      <p className="mt-4 text-gray-600">We&apos;d love to help you find the perfect pair.</p>
      <ul className="mt-10 space-y-6">
        <li className="flex gap-4">
          <MapPin className="h-6 w-6 shrink-0 text-paji-orange" />
          <div>
            <p className="font-semibold">Address</p>
            <p className="text-gray-600">{s.address}</p>
          </div>
        </li>
        <li className="flex gap-4">
          <Phone className="h-6 w-6 shrink-0 text-paji-orange" />
          <div>
            <p className="font-semibold">Phone</p>
            <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="text-paji-orange hover:underline">
              {s.phone}
            </a>
          </div>
        </li>
        <li className="flex gap-4">
          <Clock className="h-6 w-6 shrink-0 text-paji-orange" />
          <div>
            <p className="font-semibold">Store hours</p>
            <p className="text-gray-600">{s.storeHours}</p>
          </div>
        </li>
        {s.instagram && (
          <li className="flex gap-4">
            <Instagram className="h-6 w-6 shrink-0 text-paji-orange" />
            <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="text-paji-orange hover:underline">
              @pajishoes1 on Instagram
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}
