'use client';

import { motion } from 'framer-motion';
import { ExternalLink, User } from 'lucide-react';

const projects = [
  {
    name: 'AgriControl API',
    desc: 'Sistema de gestión agrícola con sensores IoT y análisis predictivo.',
    stack: ['Node.js', 'MongoDB', 'Express'],
    author: 'xdev_carlos',
    stars: 34,
  },
  {
    name: 'SeedHub Frontend',
    desc: 'Plataforma colaborativa para gestión de proyectos open source.',
    stack: ['Next.js', 'TypeScript', 'Tailwind'],
    author: 'ana_codes',
    stars: 58,
  },
  {
    name: 'LLM Wrapper',
    desc: 'Abstracción unificada para múltiples proveedores de IA con caché.',
    stack: ['Python', 'FastAPI', 'Redis'],
    author: 'ml_mario',
    stars: 91,
  },
  {
    name: 'DevOps Toolkit',
    desc: 'Scripts y configs para CI/CD, Docker y Kubernetes listos para usar.',
    stack: ['Docker', 'K8s', 'GitHub Actions'],
    author: 'devops_pao',
    stars: 47,
  },
  {
    name: 'AuthCore',
    desc: 'Servicio de autenticación con JWT, OAuth2 y gestión de roles.',
    stack: ['Node.js', 'PostgreSQL', 'Redis'],
    author: 'backend_juan',
    stars: 62,
  },
  {
    name: 'MigraCom',
    desc: 'Sistema de gestión migratoria para datos de personas en tránsito.',
    stack: ['React', 'Express', 'MongoDB'],
    author: 'xdev_carlos',
    stars: 28,
  },
];

const stackColors: Record<string, string> = {
  'Node.js': '#68A063',
  'MongoDB': '#47A248',
  'Express': '#888',
  'Next.js': '#fff',
  'TypeScript': '#3178C6',
  'Tailwind': '#38BDF8',
  'Python': '#FFD43B',
  'FastAPI': '#009688',
  'Redis': '#FF4438',
  'Docker': '#2496ED',
  'K8s': '#326CE5',
  'GitHub Actions': '#2088FF',
  'PostgreSQL': '#336791',
  'React': '#61DAFB',
};

export default function ProjectsSection() {
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
            Showcase
          </span>
          <h2 className="text-4xl font-bold text-white mt-3">
            Proyectos de la <span className="text-[#00E0FF] glow-text">comunidad</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj, i) => (
            <motion.div
              key={proj.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 flex flex-col group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-bold text-white group-hover:text-[#00E0FF] transition-colors">
                  {proj.name}
                </h3>
                <span className="text-xs text-slate-500 font-mono">⭐ {proj.stars}</span>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">{proj.desc}</p>

              {/* Stack tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {proj.stack.map((tech) => (
                  <span
                    key={tech}
                    className="text-xs px-2 py-0.5 rounded-full font-mono"
                    style={{
                      background: `${stackColors[tech] || '#00E0FF'}18`,
                      color: stackColors[tech] || '#00E0FF',
                      border: `1px solid ${stackColors[tech] || '#00E0FF'}33`,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <User size={12} />
                  <span>{proj.author}</span>
                </div>
                <button className="flex items-center gap-1 text-xs text-[#00E0FF] hover:text-white transition-colors font-medium">
                  Ver más <ExternalLink size={11} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
