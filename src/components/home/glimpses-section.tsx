"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
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

function ActiveVideo({
  video,
  inView,
  muted,
  onToggleMute,
}: {
  video: GlimpseVideo;
  inView: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
    if (inView) {
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [inView, muted, video.videoUrl]);

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        data-glimpse-video={video.id}
        src={video.videoUrl}
        className="h-full w-full object-cover"
        muted={muted}
        playsInline
        loop={video.loop}
        poster={video.thumbnailUrl ?? undefined}
        preload="auto"
      />

      <button
        type="button"
        className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 p-2.5 text-white hover:bg-black/70"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute();
        }}
        aria-label={muted ? "Unmute video" : "Mute video"}
        aria-pressed={!muted}
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function GlimpsesSection({
  videos,
  sectionTitle,
  storeTagline,
  showCopy = false,
}: {
  videos: GlimpseVideo[];
  sectionTitle?: string;
  storeTagline?: string;
  showCopy?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true });
  const [selected, setSelected] = useState(0);
  const [inView, setInView] = useState(true);
  const [muted, setMuted] = useState(true);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!inView) return;
    const id = videos[selected]?.id;
    if (!id) return;
    const t = window.setTimeout(() => {
      const el = document.querySelector<HTMLVideoElement>(`[data-glimpse-video="${id}"]`);
      if (el) void el.play().catch(() => {});
    }, 50);
    return () => window.clearTimeout(t);
  }, [selected, inView, videos]);

  if (!videos.length) return null;

  return (
    <section
      ref={sectionRef}
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

              return (
                <div key={video.id} className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_48%] lg:flex-[0_0_31%]">
                  <div className="overflow-hidden rounded-2xl border border-black/5 bg-paji-deep shadow-card">
                    <div className="relative aspect-[9/16] max-h-[520px] w-full sm:aspect-[3/4] sm:max-h-none">
                      {isActive ? (
                        <ActiveVideo
                          video={video}
                          inView={inView}
                          muted={muted}
                          onToggleMute={() => setMuted((m) => !m)}
                        />
                      ) : (
                        <div className="relative h-full w-full">
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
                        </div>
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
