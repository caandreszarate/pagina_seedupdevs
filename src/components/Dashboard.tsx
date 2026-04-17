'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Activity, FolderGit2, BookOpen, Calendar,
  Star, TrendingUp, Award, ChevronRight, Filter
} from 'lucide-react';

const sidebarItems = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'actividad', label: 'Actividad', icon: Activity },
  { id: 'proyectos', label: 'Proyectos', icon: FolderGit2 },
  { id: 'recursos', label: 'Recursos', icon: BookOpen },
  { id: 'eventos', label: 'Eventos', icon: Calendar },
];

const resources = [
  { title: 'React 19 Deep Dive', level: 'Avanzado', tag: 'Frontend', link: '#' },
  { title: 'Docker en producción', level: 'Intermedio', tag: 'DevOps', link: '#' },
  { title: 'LangChain + RAG', level: 'Avanzado', tag: 'IA', link: '#' },
  { title: 'FastAPI desde cero', level: 'Básico', tag: 'Backend', link: '#' },
  { title: 'Kubernetes para devs', level: 'Intermedio', tag: 'DevOps', link: '#' },
  { title: 'Prompt Engineering', level: 'Intermedio', tag: 'IA', link: '#' },
];

const events = [
  { name: 'Hackathon SeedUp #3', date: '2025-05-10', type: 'hackathon', spots: 40 },
  { name: 'React Meetup Online', date: '2025-04-28', type: 'meetup', spots: 120 },
  { name: 'Workshop: CI/CD avanzado', date: '2025-05-03', type: 'workshop', spots: 25 },
  { name: 'Demo Day Proyectos', date: '2025-05-17', type: 'demo', spots: 200 },
];

const levelColors: Record<string, string> = {
  Básico: '#22c55e',
  Intermedio: '#f59e0b',
  Avanzado: '#ef4444',
};

const eventColors: Record<string, string> = {
  hackathon: '#00E0FF',
  meetup: '#1E90FF',
  workshop: '#7C3AED',
  demo: '#f59e0b',
};

const resourceTags = ['Todos', 'Frontend', 'Backend', 'IA', 'DevOps'];

function ProfilePanel() {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-[#05070D]"
              style={{ background: '#00E0FF', boxShadow: '0 0 30px #00E0FF88' }}
            >
              X
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-[#0A0F1C] animate-pulse-glow" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">xdev_carlos</h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold text-[#05070D]"
                style={{ background: '#00E0FF', boxShadow: '0 0 10px #00E0FF88' }}
              >
                Full Stack Dev
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full text-[#f59e0b] border border-[#f59e0b44] bg-[#f59e0b11]">
                ⭐ Core Member
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Proyectos', value: '12', icon: FolderGit2 },
            { label: 'Participación', value: '94%', icon: TrendingUp },
            { label: 'Reputación', value: '1.2k', icon: Award },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(0,224,255,0.05)', border: '1px solid rgba(0,224,255,0.1)' }}>
                <Icon size={16} className="mx-auto mb-1 text-[#00E0FF]" />
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ResourcesPanel() {
  const [activeTag, setActiveTag] = useState('Todos');

  const filtered = activeTag === 'Todos'
    ? resources
    : resources.filter((r) => r.tag === activeTag);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {resourceTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className="text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
            style={{
              background: activeTag === tag ? '#00E0FF' : 'rgba(0,224,255,0.08)',
              color: activeTag === tag ? '#05070D' : '#00E0FF',
              border: `1px solid ${activeTag === tag ? '#00E0FF' : 'rgba(0,224,255,0.2)'}`,
              boxShadow: activeTag === tag ? '0 0 12px #00E0FF66' : 'none',
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((res) => (
          <div key={res.title} className="glass-card rounded-xl p-4 group">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold text-white group-hover:text-[#00E0FF] transition-colors">{res.title}</h4>
              <span
                className="text-xs px-2 py-0.5 rounded-full shrink-0 ml-2"
                style={{ background: `${levelColors[res.level]}18`, color: levelColors[res.level], border: `1px solid ${levelColors[res.level]}33` }}
              >
                {res.level}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{res.tag}</span>
              <a href={res.link} className="flex items-center gap-1 text-xs text-[#00E0FF] hover:text-white transition-colors">
                Ver recurso <ChevronRight size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsPanel() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {events.map((ev) => (
        <div key={ev.name} className="glass-card rounded-xl p-5 group">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize"
              style={{
                background: `${eventColors[ev.type]}18`,
                color: eventColors[ev.type],
                border: `1px solid ${eventColors[ev.type]}33`,
              }}
            >
              {ev.type}
            </span>
          </div>
          <h4 className="text-sm font-bold text-white mb-2 group-hover:text-[#00E0FF] transition-colors">{ev.name}</h4>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
            <span>📅 {ev.date}</span>
            <span>{ev.spots} cupos</span>
          </div>
          <button
            className="w-full py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: `${eventColors[ev.type]}18`,
              color: eventColors[ev.type],
              border: `1px solid ${eventColors[ev.type]}33`,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = eventColors[ev.type];
              (e.target as HTMLButtonElement).style.color = '#05070D';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = `${eventColors[ev.type]}18`;
              (e.target as HTMLButtonElement).style.color = eventColors[ev.type];
            }}
          >
            Participar
          </button>
        </div>
      ))}
    </div>
  );
}

const panels: Record<string, React.ReactNode> = {
  perfil: <ProfilePanel />,
  actividad: (
    <div className="glass-card rounded-2xl p-6 text-center text-slate-500 text-sm">
      Timeline de actividad — próximamente
    </div>
  ),
  proyectos: (
    <div className="glass-card rounded-2xl p-6 text-center text-slate-500 text-sm">
      Mis proyectos — próximamente
    </div>
  ),
  recursos: <ResourcesPanel />,
  eventos: <EventsPanel />,
};

export default function Dashboard() {
  const [active, setActive] = useState('perfil');

  return (
    <section className="relative z-10 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-mono text-[#00E0FF] tracking-[0.3em] uppercase">
            Panel de control
          </span>
          <h2 className="text-4xl font-bold text-white mt-3">
            Tu <span className="text-[#00E0FF] glow-text">Dashboard</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex gap-6"
        >
          {/* Sidebar */}
          <div className="glass rounded-2xl p-3 flex flex-col gap-1 w-48 shrink-0 self-start sticky top-24">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left w-full"
                  style={{
                    background: isActive ? 'rgba(0,224,255,0.12)' : 'transparent',
                    color: isActive ? '#00E0FF' : '#94a3b8',
                    borderLeft: isActive ? '2px solid #00E0FF' : '2px solid transparent',
                  }}
                >
                  <Icon size={16} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {panels[active]}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
