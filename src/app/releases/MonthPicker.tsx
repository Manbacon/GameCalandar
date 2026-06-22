'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface Props {
  month: number; // 1-12
  year: number;
  platformsParam?: string;
  regionsParam?: string;
}

export default function MonthPicker({ month, year, platformsParam, regionsParam }: Props) {
  const [open, setOpen]           = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Reset picker year when the real year changes (navigating externally)
  useEffect(() => { setPickerYear(year); }, [year]);

  const now    = new Date();
  const minYear = now.getFullYear() - 1;
  const maxYear = now.getFullYear() + 2;
  const qs      = (m: number, y: number) =>
    `/releases?view=calendar&month=${m}&year=${y}${platformsParam ? `&platforms=${platformsParam}` : ''}${regionsParam ? `&regions=${regionsParam}` : ''}`;

  return (
    <div className="relative flex items-center gap-2" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open month picker"
        className="flex items-center gap-1.5 text-lg font-black text-zinc-100 hover:text-white transition-colors"
      >
        {MONTHS_FULL[month - 1]} {year}
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-60 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/60 p-4">
          {/* Year row */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setPickerYear((y) => Math.max(minYear, y - 1))}
              disabled={pickerYear <= minYear}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-bold text-zinc-200 tabular-nums">{pickerYear}</span>
            <button
              onClick={() => setPickerYear((y) => Math.min(maxYear, y + 1))}
              disabled={pickerYear >= maxYear}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1">
            {MONTHS_SHORT.map((label, i) => {
              const m         = i + 1;
              const isCurrent = pickerYear === year && m === month;
              const isToday   = pickerYear === now.getFullYear() && m === now.getMonth() + 1;
              return (
                <Link
                  key={label}
                  href={qs(m, pickerYear)}
                  onClick={() => setOpen(false)}
                  className={`py-1.5 rounded-lg text-sm font-semibold text-center transition-colors ${
                    isCurrent
                      ? 'bg-cyan-600 text-white'
                      : isToday
                      ? 'text-cyan-400 hover:bg-zinc-800 hover:text-white ring-1 ring-cyan-800'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
