export function GlimpsesIntro({
  sectionTitle,
  storeTagline,
}: {
  sectionTitle: string;
  storeTagline?: string;
}) {
  return (
    <section className="border-b border-black/5 bg-paji-gray-light py-12 md:py-16" aria-labelledby="glimpses-heading">
      <div className="mx-auto max-w-7xl px-4 text-center lg:px-6">
        <p className="section-eyebrow">Store life</p>
        <h2 id="glimpses-heading" className="section-title mt-3">
          {sectionTitle}
        </h2>
        {storeTagline && <p className="mx-auto mt-3 max-w-lg text-sm text-gray-600">{storeTagline}</p>}
        <p className="font-serif mt-4 text-lg text-paji-deep/80">Crafted to be worn. Filmed to be felt.</p>
      </div>
    </section>
  );
}
