'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, Clock } from 'lucide-react';
import PaywallModal from '@/components/billing/PaywallModal';

interface LessonData {
  id: string;
  title: string;
  content: string;
  is_premium: boolean;
  duration_minutes: number;
}

interface Props {
  lessonId: string;
  email: string;
  onComplete?: () => void;
}

export default function LessonPlayer({ lessonId, email, onComplete }: Props) {
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [paywalled, setPaywalled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setCompleted(false);
    fetch(`/api/lessons/${lessonId}?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => {
        if (d.paywalled) {
          setPaywalled(true);
          setShowPaywall(true);
        } else {
          setLesson(d.lesson);
          setPaywalled(false);
        }
      })
      .finally(() => setLoading(false));
  }, [lessonId, email]);

  useEffect(() => {
    if (!bottomRef.current || !lesson) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !completed) markComplete();
      },
      { threshold: 0.9 },
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [lesson, completed]);

  async function markComplete() {
    if (completed || !lesson || paywalled) return;
    setCompleted(true);
    await fetch('/api/progress/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, lesson_id: lessonId, progress_percentage: 100 }),
    });
    onComplete?.();
  }

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-6 bg-white/5 rounded-lg w-3/4" />
        <div className="h-4 bg-white/5 rounded w-1/4" />
        <div className="h-64 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (paywalled) {
    return (
      <>
        {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
        <div
          className="rounded-2xl border border-white/8 p-8 text-center flex flex-col items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <p className="text-slate-400 text-sm">Esta lección es exclusiva de plan Pro.</p>
          <button
            onClick={() => setShowPaywall(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] transition-all"
          >
            Ver planes Pro
          </button>
        </div>
      </>
    );
  }

  if (!lesson) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white font-bold text-2xl">{lesson.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={11} />
              {lesson.duration_minutes} min
            </span>
            {lesson.is_premium && (
              <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(0,224,255,0.1)', color: '#00E0FF' }}>Pro</span>
            )}
          </div>
        </div>
        {completed && (
          <div className="flex items-center gap-1.5 text-green-400 text-xs shrink-0">
            <CheckCircle2 size={14} />
            Completada
          </div>
        )}
      </div>

      <div
        className="rounded-2xl border border-white/6 p-6 md:p-8"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-slate-300 prose-code:text-[#00E0FF] prose-code:bg-white/5 prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/8 prose-a:text-[#00E0FF] prose-strong:text-white prose-blockquote:border-[#00E0FF]/30 prose-blockquote:text-slate-400 prose-th:text-slate-300 prose-td:text-slate-400">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {lesson.content}
          </ReactMarkdown>
        </div>
      </div>

      <div ref={bottomRef} className="flex items-center justify-center pt-4">
        {!completed ? (
          <button
            onClick={markComplete}
            className="px-6 py-3 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] transition-all flex items-center gap-2"
          >
            <CheckCircle2 size={15} />
            Marcar como completada
          </button>
        ) : (
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <CheckCircle2 size={16} />
            ¡Lección completada!
          </div>
        )}
      </div>
    </div>
  );
}
