"use client";



import { useCallback, useEffect, useState } from "react";

import useEmblaCarousel from "embla-carousel-react";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

import { OptimizedImage } from "@/components/ui/optimized-image";



export type GlimpseVideo = {

  id: number;

  title: string;

  description: string | null;

  videoUrl: string;

  thumbnailUrl: string | null;

  autoplay: boolean;

  loop: boolean;

};



export function GlimpsesSection({

  videos,

  sectionTitle,

  storeTagline,

  showCopy = false,

}: {

  videos: GlimpseVideo[];

  sectionTitle?: string;

  storeTagline?: string;

  /** When true, shows title block inside this section (legacy). Homepage uses GlimpsesIntro separately. */

  showCopy?: boolean;

}) {

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true });

  const [selected, setSelected] = useState(0);

  const [playing, setPlaying] = useState<Record<number, boolean>>({});



  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);

  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);



  useEffect(() => {

    if (!emblaApi) return;

    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());

    emblaApi.on("select", onSelect);

    onSelect();

    return () => {

      emblaApi.off("select", onSelect);

    };

  }, [emblaApi]);



  if (!videos.length) return null;



  return (

    <section
      className="border-b border-black/5 bg-paji-gray-light py-16 md:py-24"
      aria-label={showCopy && sectionTitle ? sectionTitle : "Store videos"}
    >

      <div className="mx-auto max-w-7xl px-4 lg:px-6">

        <div className="mb-6 flex justify-center gap-2 sm:hidden">

          <button type="button" onClick={scrollPrev} className="rounded-full border border-black/10 bg-white p-2" aria-label="Previous">

            <ChevronLeft className="h-5 w-5" />

          </button>

          <button type="button" onClick={scrollNext} className="rounded-full border border-black/10 bg-white p-2" aria-label="Next">

            <ChevronRight className="h-5 w-5" />

          </button>

        </div>



        <div className="overflow-hidden" ref={emblaRef}>

          <div className="flex gap-4 md:gap-6">

            {videos.map((video, index) => {

              const isActive = index === selected;

              const isPlaying = playing[video.id] ?? (video.autoplay && isActive);

              return (

                <div key={video.id} className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_48%] lg:flex-[0_0_31%]">

                  <div className="overflow-hidden rounded-2xl border border-black/5 bg-paji-deep shadow-card">

                    <div className="relative aspect-[9/16] max-h-[520px] w-full sm:aspect-[3/4] sm:max-h-none">

                      {isActive && isPlaying ? (

                        <video

                          src={video.videoUrl}

                          className="h-full w-full object-cover"

                          muted

                          playsInline

                          loop={video.loop}

                          autoPlay={video.autoplay}

                          poster={video.thumbnailUrl ?? undefined}

                          preload="metadata"

                        />

                      ) : (

                        <button

                          type="button"

                          className="relative h-full w-full"

                          onClick={() => setPlaying((p) => ({ ...p, [video.id]: true }))}

                          aria-label={`Play ${video.title}`}

                        >

                          {video.thumbnailUrl ? (

                            <OptimizedImage

                              src={video.thumbnailUrl}

                              alt=""

                              preset="card"

                              className="h-full w-full object-cover"

                            />

                          ) : (

                            <div className="h-full w-full bg-paji-black" />

                          )}

                          <span className="absolute inset-0 flex items-center justify-center bg-black/35">

                            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-paji-deep shadow-lg">

                              <Play className="ml-1 h-7 w-7" fill="currentColor" />

                            </span>

                          </span>

                        </button>

                      )}

                      {isActive && isPlaying && (

                        <button

                          type="button"

                          className="absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white"

                          onClick={() => setPlaying((p) => ({ ...p, [video.id]: false }))}

                          aria-label="Pause video"

                        >

                          <Pause className="h-4 w-4" />

                        </button>

                      )}

                    </div>

                    <div className="border-t border-white/10 p-4 text-white">

                      <h3 className="font-medium">{video.title}</h3>

                      {video.description && (

                        <p className="mt-1 text-sm text-white/65 line-clamp-2">{video.description}</p>

                      )}

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        </div>



        <div className="mt-8 hidden justify-end gap-2 sm:flex">

          <button type="button" onClick={scrollPrev} className="rounded-full border border-black/10 bg-white p-2.5 hover:bg-paji-cream" aria-label="Previous">

            <ChevronLeft className="h-5 w-5" />

          </button>

          <button type="button" onClick={scrollNext} className="rounded-full border border-black/10 bg-white p-2.5 hover:bg-paji-cream" aria-label="Next">

            <ChevronRight className="h-5 w-5" />

          </button>

        </div>



        {showCopy && sectionTitle && (

          <div className="mt-10 text-center md:mt-12">

            <p className="section-eyebrow">Store life</p>

            <h2 className="section-title mt-3">{sectionTitle}</h2>

            {storeTagline && (

              <p className="mx-auto mt-3 max-w-lg text-sm text-gray-600">{storeTagline}</p>

            )}

            <p className="font-serif mt-4 text-lg text-paji-deep/80">Crafted to be worn. Filmed to be felt.</p>

          </div>

        )}

      </div>

    </section>

  );

}


