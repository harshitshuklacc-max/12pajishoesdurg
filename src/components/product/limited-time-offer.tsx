"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

type Props = {
  endsAt: string;
};

export function LimitedTimeOffer({ endsAt }: Props) {
  const endMs = new Date(endsAt).getTime();
  const [remaining, setRemaining] = useState(() => Math.max(0, endMs - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, endMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endMs]);

  if (remaining <= 0) return null;

  const totalSec = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const progress = Math.min(1, remaining / (24 * 60 * 60 * 1000));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 lg:px-6">
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card">
        <div className="flex items-center gap-2 bg-[#E85D4C] px-4 py-3 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
            <Clock className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-bold uppercase tracking-wide">Limited time deal</span>
        </div>
        <div className="px-4 py-6 text-center sm:px-8">
          <p className="text-sm text-gray-500">Hurry up! Offer ends in</p>
          <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3">
            <TimeBlock value={pad(hours)} label="Hours" />
            <span className="pb-5 text-xl font-bold text-gray-300">:</span>
            <TimeBlock value={pad(mins)} label="Mins" />
            <span className="pb-5 text-xl font-bold text-gray-300">:</span>
            <TimeBlock value={pad(secs)} label="Secs" />
          </div>
        </div>
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-[#E85D4C] to-paji-orange transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.max(8, progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex min-w-[4.5rem] items-center justify-center rounded-xl bg-[#FFF5F0] px-3 py-4 sm:min-w-[5rem]">
        <span className="text-3xl font-bold tabular-nums text-[#E85D4C] sm:text-4xl">{value}</span>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
    </div>
  );
}
