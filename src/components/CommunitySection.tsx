'use client';

import { motion } from 'framer-motion';
import { Activity, Users, Zap } from 'lucide-react';

const onlineUsers = [
  { name: 'xdev_carlos', role: 'Full Stack', color: '#00E0FF' },
  { name: 'ana_codes', role: 'Frontend', color: '#1E90FF' },
  { name: 'ml_mario', role: 'IA / ML', color: '#00E0FF' },
  { name: 'devops_pao', role: 'DevOps', color: '#7C3AED' },
  { name: 'backend_juan', role: 'Backend', color: '#1E90FF' },
];

const feed = [
  { user: 'xdev_carlos', action: 'subió el proyecto', target: 'AgriControl API', time: '2m', icon: '🚀' },
  { user: 'ana_codes', action: 'compartió un recurso', target: 'React 19 Tips', time: '8m', icon: '📚' },
  { user: 'devops_pao', action: 'creó un evento', target: 'Docker Workshop', time: '15m', icon: '📅' },
  { user: 'ml_mario', action: 'completó el reto', target: 'LLM Challenge #4', time: '32m', icon: '⚡' },
  { user: 'backend_juan', action: 'abrió PR en', target: 'SeedHub Backend', time: '1h', icon: '🔧' },
];

export default function CommunitySection() {
  return (
    <section id="comunidad" className="relative z-10 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-mono text-[#00E0FF] tracking-[0.3em] uppercase">
            Dashboard en vivo
          </span>
          <h2 className="text-4xl font-bold text-white mt-3">
            La comunidad, <span className="text-[#00E0FF] glow-text">ahora mismo</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Online users */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Users size={16} className="text-[#00E0FF]" />
              <span className="text-sm font-semibold text-white">Online ahora</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                {onlineUsers.length} activos
              </span>
            </div>

            <div className="space-y-3">
              {onlineUsers.map((u, i) => (
                <motion.div
                  key={u.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-[#05070D]"
                      style={{ background: u.color, boxShadow: `0 0 12px ${u.color}88` }}
                    >
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#05070D]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.role}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Activity feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 md:col-span-2"
          >
            <div className="flex items-center gap-2 mb-5">
              <Activity size={16} className="text-[#00E0FF]" />
              <span className="text-sm font-semibold text-white">Actividad reciente</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E0FF] animate-pulse" />
                <span className="text-xs text-[#00E0FF] font-mono">LIVE</span>
              </div>
            </div>

            <div className="space-y-4">
              {feed.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="text-xl mt-0.5">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">
                      <span className="text-[#00E0FF] font-medium">{item.user}</span>
                      {' '}{item.action}{' '}
                      <span className="text-white font-medium">{item.target}</span>
                    </p>
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">{item.time}</span>
                </motion.div>
              ))}
            </div>

            {/* Counter */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-4">
              <Zap size={14} className="text-[#00E0FF]" />
              <span className="text-xs text-slate-500">
                <span className="text-[#00E0FF] font-semibold">500+</span> miembros ·{' '}
                <span className="text-[#00E0FF] font-semibold">120+</span> proyectos activos
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
