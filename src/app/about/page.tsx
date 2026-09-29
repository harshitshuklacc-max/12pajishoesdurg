import { getStoreSettings } from "@/lib/settings";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const s = await getStoreSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 lg:px-6">
      <h1 className="text-4xl font-bold">About {s.storeName}</h1>
      <p className="mt-6 text-lg leading-relaxed text-gray-600">{s.businessDescription}</p>
      <div className="mt-10 rounded-2xl bg-paji-gray-light p-8">
        <h2 className="text-xl font-semibold">Visit us in Durg</h2>
        <p className="mt-3 text-gray-600">{s.address}</p>
        <p className="mt-2">{s.storeHours}</p>
        <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="mt-4 inline-block font-semibold text-paji-orange">
          Call {s.phone}
        </a>
      </div>
    </div>
  );
}
