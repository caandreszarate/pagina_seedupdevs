'use client';

import { motion } from 'framer-motion';
import { Cpu, Rocket, Network } from 'lucide-react';

const features = [
  {
    icon: Cpu,
    title: 'Desarrollo Colaborativo',
    desc: 'Trabaja en equipo en proyectos reales con metodologías ágiles y code reviews entre pares.',
    color: '#00E0FF',
  },
  {
    icon: Rocket,
    title: 'Proyectos Reales',
    desc: 'Desde la idea hasta producción. Construimos software que resuelve problemas del mundo real.',
    color: '#1E90FF',
  },
  {
    icon: Network,
    title: 'Networking Tech',
    desc: 'Conecta con desarrolladores de toda Latinoamérica. Mentorías, referencias y oportunidades.',
    color: '#00E0FF',
  },
];

export default function FeaturesSection() {
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
            ¿Qué ofrecemos?
          </span>
          <h2 className="text-4xl font-bold text-white mt-3">
            Una plataforma para <span className="text-[#00E0FF] glow-text">crecer</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card rounded-2xl p-7 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${feat.color}15`, border: `1px solid ${feat.color}33` }}
                >
                  <Icon size={22} style={{ color: feat.color }} className="group-hover:scale-110 transition-transform" />
                </div>

                <h3 className="text-lg font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>

                {/* Bottom circuit line */}
                <div className="mt-6 h-px w-full relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-30 group-hover:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(90deg, transparent, ${feat.color}, transparent)` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
