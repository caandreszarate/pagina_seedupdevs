'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import type { Recommendation } from '@/app/api/recommendations/route';

interface Props {
  recommendation: Recommendation;
}

export default function RecommendationCard({ recommendation: r }: Props) {
  return (
    <Link
      href={`/lesson/${r.lesson_id}`}
      className="flex items-start gap-4 p-4 rounded-xl border border-white/6 hover:border-[#00E0FF]/20 hover:bg-[#00E0FF]/[0.02] transition-all group"
      style={{ background: 'rgba(255,255,255,0.01)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(0,224,255,0.08)', border: '1px solid rgba(0,224,255,0.15)' }}
      >
        <BookOpen size={15} style={{ color: '#00E0FF' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium leading-snug">{r.lesson_title}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{r.path_name} · {r.module_title}</p>
        <p className="text-xs text-slate-600 mt-1.5 italic">{r.reason}</p>
      </div>
      <ArrowRight size={14} className="text-slate-600 group-hover:text-[#00E0FF] shrink-0 mt-1 transition-colors" />
    </Link>
  );
}
