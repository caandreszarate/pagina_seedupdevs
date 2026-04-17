'use client';

// ============================================================
// LANDING CONTENT — SeedUp Devs
// Contiene las secciones 2 al 6 de la landing page.
// Solo usa Tailwind CSS (sin dependencias externas).
// Cada sección es una función interna reutilizable.
// ============================================================

// ── SECCIÓN 2: ¿Qué es SeedUp Devs? ──────────────────────────
function AboutSection() {
  return (
    <section className="relative z-10 py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">

        {/* Etiqueta superior */}
        <span className="text-xs font-mono tracking-[0.3em] uppercase text-[#00E0FF]">
          ¿Quiénes somos?
        </span>

        {/* Título */}
        <h2 className="mt-4 text-4xl md:text-5xl font-black text-white leading-tight">
          Más que una comunidad,{' '}
          <span className="text-[#00E0FF]" style={{ textShadow: '0 0 20px #00E0FF66' }}>
            un ecosistema dev
          </span>
        </h2>

        {/* Divisor decorativo */}
        <div className="my-8 flex items-center justify-center gap-3">
          <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #00E0FF)' }} />
          <div className="w-2 h-2 rounded-full bg-[#00E0FF]" style={{ boxShadow: '0 0 8px #00E0FF' }} />
          <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #00E0FF, transparent)' }} />
        </div>

        {/* Párrafo con palabras clave en cyan */}
        <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
          Nacimos con una misión clara: crear un espacio donde{' '}
          <span className="text-[#00E0FF] font-semibold">cualquier persona</span>,
          sin importar su nivel, pueda{' '}
          <span className="text-[#00E0FF] font-semibold">aprender programación</span>,
          colaborar en{' '}
          <span className="text-[#00E0FF] font-semibold">proyectos reales</span>{' '}
          y crecer{' '}
          <span className="text-[#00E0FF] font-semibold">profesionalmente</span>{' '}
          rodeada de personas con los mismos objetivos.
        </p>

      </div>
    </section>
  );
}

// ── SECCIÓN 3: ¿Qué ofrecemos? ────────────────────────────────
const ofertas = [
  {
    icono: '🧠',
    nombre: 'Aprendizaje colectivo',
    descripcion: 'Comparte dudas, recursos y conocimiento con otros devs.',
  },
  {
    icono: '🤝',
    nombre: 'Networking real',
    descripcion: 'Conecta con desarrolladores de distintos niveles y backgrounds.',
  },
  {
    icono: '🚀',
    nombre: 'Proyectos colaborativos',
    descripcion: 'Participa en proyectos grupales para ganar experiencia real.',
  },
  {
    icono: '📅',
    nombre: 'Eventos y talleres',
    descripcion: 'Workshops, sesiones en vivo y hackathons próximamente.',
  },
  {
    icono: '💬',
    nombre: 'Soporte constante',
    descripcion: 'Nunca estarás solo aprendiendo, siempre habrá alguien dispuesto a ayudar.',
  },
];

function OffersSection() {
  return (
    <section
      className="relative z-10 py-24 px-4"
      style={{ background: 'rgba(10, 15, 28, 0.5)' }}
    >
      {/* Línea decorativa superior */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #00E0FF22, #00E0FF55, #00E0FF22, transparent)' }}
      />

      <div className="max-w-6xl mx-auto">

        {/* Encabezado */}
        <div className="text-center mb-14">
          <span className="text-xs font-mono tracking-[0.3em] uppercase text-[#00E0FF]">
            Beneficios
          </span>
          <h2 className="mt-4 text-4xl font-black text-white">
            Todo lo que necesitas para{' '}
            <span className="text-[#00E0FF]" style={{ textShadow: '0 0 20px #00E0FF66' }}>
              crecer
            </span>
          </h2>
        </div>

        {/* Grid de cards — 2 cols en tablet, 3 en desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ofertas.map((item) => (
            <div
              key={item.nombre}
              className="group rounded-2xl p-6 transition-all duration-300 cursor-default"
              style={{
                background: 'rgba(10, 15, 28, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0, 224, 255, 0.12)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.border = '1px solid rgba(0, 224, 255, 0.4)';
                el.style.boxShadow = '0 0 30px rgba(0, 224, 255, 0.12), inset 0 0 20px rgba(0, 224, 255, 0.04)';
                el.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.border = '1px solid rgba(0, 224, 255, 0.12)';
                el.style.boxShadow = 'none';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Ícono */}
              <div className="text-4xl mb-4">{item.icono}</div>

              {/* Nombre */}
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#00E0FF] transition-colors duration-300">
                {item.nombre}
              </h3>

              {/* Descripción */}
              <p className="text-sm text-slate-400 leading-relaxed">
                {item.descripcion}
              </p>

              {/* Línea inferior decorativa */}
              <div
                className="mt-5 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(90deg, transparent, #00E0FF, transparent)' }}
              />
            </div>
          ))}

          {/* Última card centrada si son 5 (ocupa espacio en lg) */}
          <div className="hidden lg:block" />
        </div>
      </div>

      {/* Línea decorativa inferior */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #00E0FF22, #00E0FF55, #00E0FF22, transparent)' }}
      />
    </section>
  );
}

// ── SECCIÓN 4: ¿Para quién es? ────────────────────────────────
const niveles = [
  {
    icono: '🌱',
    nombre: 'Principiantes',
    descripcion: 'Estás empezando y quieres una comunidad que te guíe paso a paso.',
    color: '#22c55e',
  },
  {
    icono: '⚡',
    nombre: 'Intermedios',
    descripcion: 'Ya sabes lo básico y buscas llevar tus skills al siguiente nivel.',
    color: '#f59e0b',
  },
  {
    icono: '🔥',
    nombre: 'Avanzados',
    descripcion: 'Tienes experiencia y quieres compartirla, colaborar y seguir creciendo.',
    color: '#ef4444',
  },
];

function ForWhoSection() {
  return (
    <section className="relative z-10 py-24 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Encabezado */}
        <div className="text-center mb-14">
          <span className="text-xs font-mono tracking-[0.3em] uppercase text-[#00E0FF]">
            ¿Para quién?
          </span>
          <h2 className="mt-4 text-4xl font-black text-white">
            Para todos los que quieren{' '}
            <span className="text-[#00E0FF]" style={{ textShadow: '0 0 20px #00E0FF66' }}>
              crecer en tech
            </span>
          </h2>
        </div>

        {/* 3 cards simétricas en fila */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {niveles.map((nivel) => (
            <div
              key={nivel.nombre}
              className="rounded-2xl p-8 text-center transition-all duration-300"
              style={{
                background: 'rgba(10, 15, 28, 0.6)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${nivel.color}22`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.border = `1px solid ${nivel.color}66`;
                el.style.boxShadow = `0 0 30px ${nivel.color}18`;
                el.style.transform = 'translateY(-6px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.border = `1px solid ${nivel.color}22`;
                el.style.boxShadow = 'none';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Ícono grande */}
              <div className="text-6xl mb-5">{nivel.icono}</div>

              {/* Badge de nivel */}
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
                style={{
                  background: `${nivel.color}18`,
                  color: nivel.color,
                  border: `1px solid ${nivel.color}44`,
                }}
              >
                {nivel.nombre}
              </span>

              {/* Descripción */}
              <p className="text-slate-400 text-sm leading-relaxed mt-2">
                {nivel.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── SECCIÓN 5: Próximamente ────────────────────────────────────
const proximamente = [
  {
    icono: '📆',
    nombre: 'Talleres semanales',
    descripcion: 'Sesiones en vivo sobre tecnologías del momento.',
  },
  {
    icono: '🏆',
    nombre: 'Primer Hackathon',
    descripcion: 'Compite, aprende y gana junto a la comunidad.',
  },
  {
    icono: '📚',
    nombre: 'Biblioteca de recursos',
    descripcion: 'Guías, tutoriales y materiales curados por la comunidad.',
  },
  {
    icono: '🎯',
    nombre: 'Mentorías 1 a 1',
    descripcion: 'Conecta con devs más experimentados para acelerar tu aprendizaje.',
  },
];

function ComingSoonSection() {
  return (
    <section
      className="relative z-10 py-24 px-4 overflow-hidden"
      style={{ background: 'rgba(10, 15, 28, 0.5)' }}
    >
      {/* Glow de fondo central */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,224,255,0.04) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-5xl mx-auto">

        {/* Encabezado */}
        <div className="text-center mb-4">
          <span className="text-xs font-mono tracking-[0.3em] uppercase text-[#00E0FF]">
            Roadmap
          </span>
          <h2 className="mt-4 text-4xl font-black text-white">
            Grandes cosas están{' '}
            <span className="text-[#00E0FF]" style={{ textShadow: '0 0 20px #00E0FF66' }}>
              por venir
            </span>
          </h2>
          <p className="mt-4 text-slate-400 text-base max-w-xl mx-auto">
            SeedUp Devs está en sus primeros pasos.{' '}
            <span className="text-white font-medium">Esto es solo el comienzo.</span>
          </p>
        </div>

        {/* Grid 2x2 */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {proximamente.map((item, i) => (
            <div
              key={item.nombre}
              className="relative rounded-2xl p-6 flex gap-5 items-start transition-all duration-300 group"
              style={{
                background: 'rgba(10, 15, 28, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0, 224, 255, 0.08)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.border = '1px solid rgba(0, 224, 255, 0.25)';
                el.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.border = '1px solid rgba(0, 224, 255, 0.08)';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Número de orden */}
              <div
                className="absolute top-4 right-4 text-xs font-mono opacity-20 text-[#00E0FF]"
              >
                0{i + 1}
              </div>

              {/* Ícono */}
              <div className="text-3xl mt-0.5 shrink-0">{item.icono}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="text-sm font-bold text-white">{item.nombre}</h3>
                  {/* Badge Próximamente */}
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{
                      background: 'rgba(0, 224, 255, 0.1)',
                      color: '#00E0FF',
                      border: '1px solid rgba(0, 224, 255, 0.3)',
                    }}
                  >
                    Próximamente
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #00E0FF22, #00E0FF55, #00E0FF22, transparent)' }}
      />
    </section>
  );
}

// ── SECCIÓN 6: CTA Final ──────────────────────────────────────
function CTASection() {
  return (
    <section className="relative z-10 py-28 px-4 overflow-hidden">

      {/* Fondo con gradiente especial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,224,255,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Anillo de glow exterior */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          border: '1px solid rgba(0, 224, 255, 0.06)',
          boxShadow: '0 0 80px rgba(0, 224, 255, 0.04)',
        }}
      />

      <div className="relative max-w-3xl mx-auto text-center">

        {/* Etiqueta */}
        <span className="text-xs font-mono tracking-[0.3em] uppercase text-[#00E0FF]">
          Únete ahora
        </span>

        {/* Título impactante */}
        <h2 className="mt-5 text-4xl md:text-6xl font-black text-white leading-tight">
          ¿Listo para ser parte{' '}
          <span
            className="text-[#00E0FF] block"
            style={{ textShadow: '0 0 30px #00E0FF88' }}
          >
            del inicio?
          </span>
        </h2>

        {/* Texto de urgencia */}
        <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          Los primeros miembros son los que{' '}
          <span className="text-white font-semibold">construyen la cultura</span>.
          Sé parte de SeedUp Devs{' '}
          <span className="text-[#00E0FF] font-semibold">desde el día uno</span>.
        </p>

        {/* Botón CTA con animación de pulso */}
        <div className="mt-10 flex justify-center">
          <a
            href="https://discord.gg/seedupdevs"
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-base font-bold text-[#05070D] bg-[#00E0FF] uppercase tracking-wider transition-all duration-300 hover:bg-[#00F0FF] hover:scale-105"
            style={{ boxShadow: '0 0 30px #00E0FF66, 0 0 60px #00E0FF33' }}
          >
            {/* Anillo pulsante */}
            <span
              className="absolute inset-0 rounded-2xl animate-ping"
              style={{
                background: 'transparent',
                border: '2px solid rgba(0, 224, 255, 0.5)',
                animationDuration: '2s',
              }}
            />
            Unirme ahora →
          </a>
        </div>

        {/* Dato social */}
        <p className="mt-6 text-xs text-slate-600 font-mono">
          + 500 devs ya forman parte de la comunidad
        </p>
      </div>
    </section>
  );
}

// ── COMPONENTE PRINCIPAL EXPORTADO ────────────────────────────
// Agrupa todas las secciones en el orden correcto.
export default function LandingContent() {
  return (
    <>
      <AboutSection />
      <OffersSection />
      <ForWhoSection />
      <ComingSoonSection />
      <CTASection />
    </>
  );
}
