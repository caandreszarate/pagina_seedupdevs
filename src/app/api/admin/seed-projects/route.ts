import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminByEmail } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

const PROJECTS = [
  {
    name: 'Landing Page para Startup FinTech con Dark Mode',
    description:
      'Se construye una landing page responsive de alto impacto visual. El objetivo es dominar el maquetado semántico y la interactividad básica. Tecnologías: HTML5, CSS3 (Variables, Flexbox, Grid), JavaScript Vanilla. Contexto: Una startup de microcréditos necesita su primera presencia web con un selector de tema claro/oscuro.',
    difficulty: 'dev-zero',
    repo_url: 'https://github.com/seedup-devs/fintech-landing-zero',
    figma_url: 'https://www.figma.com/file/placeholder-zero-1',
    team_scope: {
      frontend:
        'Maquetación semántica de secciones, implementación de CSS Variables para temas y layouts con Flexbox.',
      backend:
        'No requerido. Simulación de envío de formulario de contacto con validación en cliente.',
      extra: 'Optimización de assets (imágenes/fuentes) y accesibilidad básica (A11y).',
      stack: 'HTML5 + CSS3 + JavaScript Vanilla',
    },
  },
  {
    name: 'Buscador de Personajes con API de Rick and Morty',
    description:
      'Construcción de una interfaz para buscar y filtrar personajes. Objetivo: Aprender el manejo de peticiones asíncronas y renderizado dinámico. Tecnologías: JavaScript, Fetch API, CSS. Contexto: Simulación de un catálogo interno para una productora de medios.',
    difficulty: 'dev-zero',
    repo_url: 'https://github.com/seedup-devs/character-search-zero',
    figma_url: 'https://www.figma.com/file/placeholder-zero-2',
    team_scope: {
      frontend: 'Creación de tarjetas de personajes, barra de búsqueda y filtros por estado/especie.',
      backend: 'Consumo de API pública. Manejo de lógica de paginación en el cliente.',
      extra: 'Manejo de estados de carga (spinners) y estados vacíos.',
      stack: 'HTML5 + CSS3 + JavaScript (Fetch API)',
    },
  },
  {
    name: 'Calculadora de Inversiones con Interés Compuesto',
    description:
      'Herramienta que visualiza el crecimiento de ahorros en el tiempo. Objetivo: Manipulación de DOM y lógica matemática básica. Tecnologías: HTML, CSS, JavaScript. Contexto: Widget para un portal de educación financiera.',
    difficulty: 'dev-zero',
    repo_url: 'https://github.com/seedup-devs/investment-calc-zero',
    figma_url: 'https://www.figma.com/file/placeholder-zero-3',
    team_scope: {
      frontend: 'Formulario de entrada de datos, validación numérica y tabla de resultados dinámica.',
      backend: 'Lógica algorítmica en JavaScript para el cálculo de interés compuesto.',
      extra: 'Diseño responsive para uso en dispositivos móviles.',
      stack: 'HTML5 + CSS3 + JavaScript Vanilla',
    },
  },
  {
    name: 'Reloj Mundial para Equipos Remotos',
    description:
      'Interfaz que muestra la hora actual en diferentes zonas horarias configurables. Objetivo: Trabajo con el objeto Date de JS. Tecnologías: HTML, CSS, JS. Contexto: Utilidad para una empresa que coordina desarrolladores en varios países.',
    difficulty: 'dev-zero',
    repo_url: 'https://github.com/seedup-devs/world-clock-zero',
    figma_url: 'https://www.figma.com/file/placeholder-zero-9',
    team_scope: {
      frontend:
        'Visualización de relojes digitales, selectores de zona horaria y estilos dinámicos día/noche.',
      backend: 'Lógica de conversión de husos horarios mediante Date y Intl.DateTimeFormat.',
      extra: 'Uso de intervalos para actualización en tiempo real sin recarga de página.',
      stack: 'HTML5 + CSS3 + JavaScript Vanilla',
    },
  },
  {
    name: 'Perfil de Usuario con Tarjetas de Habilidades',
    description:
      'Maquetado de una hoja de vida interactiva. Objetivo: Estructura de componentes y responsive design avanzado. Tecnologías: HTML, SASS. Contexto: Solicitud de una agencia de reclutamiento para estandarizar perfiles.',
    difficulty: 'dev-zero',
    repo_url: 'https://github.com/seedup-devs/dev-profile-zero',
    figma_url: 'https://www.figma.com/file/placeholder-zero-10',
    team_scope: {
      frontend:
        'Estructura de perfil, secciones de experiencia, educación y barra de progreso de habilidades.',
      backend: 'Simulación de persistencia usando un archivo JSON local de datos de usuario.',
      extra: 'Interactividad simple (modales o tooltips) para detalles de experiencia.',
      stack: 'HTML5 + SASS + JavaScript',
    },
  },
  {
    name: 'E-commerce de Plantas Ornamentales',
    description:
      'Catálogo funcional con carrito de compras básico. Objetivo: Gestión de estados simples y persistencia de datos. Tecnologías: React o Vue (opcional), CSS Modules. Contexto: MVP para un vivero que desea digitalizar sus ventas.',
    difficulty: 'dev-bronce',
    repo_url: 'https://github.com/seedup-devs/green-shop-bronce',
    figma_url: 'https://www.figma.com/file/placeholder-bronce-1',
    team_scope: {
      frontend: 'Listado de productos, detalle de planta y lógica visual del carrito de compras.',
      backend:
        'Persistencia de productos seleccionados en LocalStorage y filtrado por categoría.',
      extra: 'Validación de campos en el proceso de simulación de checkout.',
      stack: 'React + CSS Modules + LocalStorage',
    },
  },
  {
    name: 'Sistema de Turnos para Barbería',
    description:
      'Agenda de citas con validación de horarios. Objetivo: Lógica de disponibilidad y validación de formularios complejos. Tecnologías: React, Firebase (opcional). Contexto: Digitalización de una barbería local.',
    difficulty: 'dev-bronce',
    repo_url: 'https://github.com/seedup-devs/barber-book-bronce',
    figma_url: 'https://www.figma.com/file/placeholder-bronce-2',
    team_scope: {
      frontend: 'Calendario de selección, formulario de reserva y vista de Mis Citas.',
      backend: 'Gestión de registros de turnos, prevención de duplicados en la misma hora.',
      extra: 'Uso de Context API para manejar el estado global de las reservas.',
      stack: 'React + Firebase Auth/Firestore',
    },
  },
  {
    name: 'Aplicación de Gastos Personales',
    description:
      'Registro de ingresos y egresos con visualización de categorías. Objetivo: Filtrado de datos y cálculos acumulados. Tecnologías: JavaScript ES6, Chart.js. Contexto: Herramienta interna para una consultora financiera.',
    difficulty: 'dev-bronce',
    repo_url: 'https://github.com/seedup-devs/expense-tracker-bronce',
    figma_url: 'https://www.figma.com/file/placeholder-bronce-3',
    team_scope: {
      frontend:
        'Formulario de ingreso de montos, lista de transacciones y gráficos circulares de gastos.',
      backend:
        'Lógica de cálculo de balance total e historial filtrable por mes/categoría.',
      extra: 'Exportación básica de los datos actuales a formato CSV.',
      stack: 'Vue.js + Chart.js + LocalStorage',
    },
  },
  {
    name: 'Portal de Adopción de Mascotas',
    description:
      'Web interactiva para ver mascotas disponibles con sistema de contacto. Objetivo: Routing básico y manejo de componentes dinámicos. Tecnologías: React Router, Tailwind. Contexto: Proyecto pro-bono para un refugio.',
    difficulty: 'dev-bronce',
    repo_url: 'https://github.com/seedup-devs/pet-adopt-bronce',
    figma_url: 'https://www.figma.com/file/placeholder-bronce-4',
    team_scope: {
      frontend:
        'Home con grid de mascotas, página de detalle y formulario de postulación para adopción.',
      backend: 'Manejo de rutas dinámicas y lógica de filtrado por especie/edad/tamaño.',
      extra: 'Implementación de una galería de fotos deslizable (slider) para cada mascota.',
      stack: 'React + React Router + Tailwind CSS',
    },
  },
  {
    name: 'Tablero de Tareas Kanban Personal',
    description:
      'Organizador de tareas con columnas de estado (To Do, Doing, Done). Objetivo: Funcionalidad de Drag and Drop básica. Tecnologías: React-beautiful-dnd, Tailwind. Contexto: Herramienta de productividad personal.',
    difficulty: 'dev-bronce',
    repo_url: 'https://github.com/seedup-devs/kanban-lite-bronce',
    figma_url: 'https://www.figma.com/file/placeholder-bronce-10',
    team_scope: {
      frontend:
        'Interfaz de columnas, creación de tarjetas y animaciones de movimiento entre estados.',
      backend: 'Persistencia del orden y contenido de las tareas en LocalStorage.',
      extra: 'Tematización por colores según la prioridad de la tarea asignada.',
      stack: 'React + React-beautiful-dnd + Tailwind CSS',
    },
  },
  {
    name: 'Plataforma de Freelancing (Mini Upwork)',
    description:
      'Marketplace donde clientes publican vacantes y devs postulan. Objetivo: Implementar CRUD completo y autenticación. Tecnologías: Node.js, Express, MongoDB, React. Contexto: MVP para conectar talento junior con ONGs.',
    difficulty: 'dev-silver',
    repo_url: 'https://github.com/seedup-devs/freelance-hub-silver',
    figma_url: 'https://www.figma.com/file/placeholder-silver-1',
    team_scope: {
      frontend:
        'Dashboard de usuario, búsqueda de empleos y panel de gestión de propuestas.',
      backend:
        'API REST con autenticación JWT, modelos de Vacantes, Usuarios y Postulaciones.',
      extra:
        'Implementación de carga de documentos (CV) y validación de esquemas con Joi o Zod.',
      stack: 'React + Node.js + MongoDB + Express',
    },
  },
  {
    name: 'Gestor de Reservas para Coworking',
    description:
      'Aplicación para reservar escritorios y salas de reuniones. Objetivo: Gestión de calendarios y estados en tiempo real. Tecnologías: Next.js, PostgreSQL, Prisma. Contexto: Sistema interno para una red de espacios colaborativos.',
    difficulty: 'dev-silver',
    repo_url: 'https://github.com/seedup-devs/cowork-book-silver',
    figma_url: 'https://www.figma.com/file/placeholder-silver-2',
    team_scope: {
      frontend:
        'Mapa interactivo del piso, selector de fechas/horas y vista de perfil con reservas activas.',
      backend:
        'Base de datos relacional para gestionar disponibilidad de recursos físicos y transacciones.',
      extra: 'Envío de correos automáticos de confirmación tras realizar una reserva.',
      stack: 'Next.js + Prisma + PostgreSQL + Tailwind CSS',
    },
  },
  {
    name: 'App de Chat Grupal por Canales',
    description:
      'Comunicación en tiempo real estructurada por temas. Objetivo: Uso de WebSockets y manejo de mensajes. Tecnologías: Socket.io, Express, React. Contexto: Herramienta de comunicación para comunidades.',
    difficulty: 'dev-silver',
    repo_url: 'https://github.com/seedup-devs/dev-chat-silver',
    figma_url: 'https://www.figma.com/file/placeholder-silver-3',
    team_scope: {
      frontend:
        'Sidebar de canales, ventana de mensajes con scroll infinito e indicador de usuarios online.',
      backend: 'Servidor de WebSockets para broadcast de mensajes y persistencia en DB.',
      extra: 'Manejo de historial de mensajes (mensajería persistente) y timestamps.',
      stack: 'React + Node.js + Socket.io + MongoDB',
    },
  },
  {
    name: 'Dashboard de Métricas para SaaS',
    description:
      'Panel administrativo para visualizar KPIs de suscripciones. Objetivo: Integración de librerías de gráficos y filtros de fecha. Tecnologías: React, Recharts, Supabase. Contexto: Herramienta para equipos de ventas.',
    difficulty: 'dev-silver',
    repo_url: 'https://github.com/seedup-devs/saas-metrics-silver',
    figma_url: 'https://www.figma.com/file/placeholder-silver-5',
    team_scope: {
      frontend:
        'Componentes de gráficos (líneas, barras), selectores de rango de fechas y tablas paginadas.',
      backend:
        'Configuración de Supabase (Auth + DB) y funciones de agregación para reportes.',
      extra: 'Optimización de consultas para manejo de grandes volúmenes de registros.',
      stack: 'React + Supabase + Recharts',
    },
  },
  {
    name: 'Sistema de Ticket de Soporte Técnico',
    description:
      'Gestión de incidencias con prioridades y asignación a agentes. Objetivo: Manejo de roles y flujos de estados. Tecnologías: NestJS, Vue, PostgreSQL. Contexto: Helpdesk para telecomunicaciones.',
    difficulty: 'dev-silver',
    repo_url: 'https://github.com/seedup-devs/support-ticket-silver',
    figma_url: 'https://www.figma.com/file/placeholder-silver-6',
    team_scope: {
      frontend:
        'Panel de control para agentes, formulario de creación para clientes y notificaciones.',
      backend:
        'Lógica de negocio para cambio de estados (Abierto, En Progreso, Resuelto) y control de acceso.',
      extra: 'Documentación de la API con Swagger y pruebas unitarias básicas.',
      stack: 'Vue 3 + NestJS + PostgreSQL',
    },
  },
  {
    name: 'ERP de Inventarios Multinivel',
    description:
      'Control de stock para múltiples almacenes con alertas de rotura. Objetivo: Arquitectura de base de datos optimizada y reportes complejos. Tecnologías: NestJS, TypeORM, React Query. Contexto: Software de gestión para distribuidoras.',
    difficulty: 'dev-gold',
    repo_url: 'https://github.com/seedup-devs/erp-inventory-gold',
    figma_url: 'https://www.figma.com/file/placeholder-gold-1',
    team_scope: {
      frontend:
        'Gestión de tablas dinámicas, filtros avanzados de inventario y generador de reportes visuales.',
      backend:
        'Arquitectura modular, transacciones de DB para movimientos de stock y sistema de alertas.',
      extra: 'Implementación de caché con Redis para consultas frecuentes de disponibilidad.',
      stack: 'Next.js + NestJS + TypeORM + PostgreSQL + Redis',
    },
  },
  {
    name: 'Plataforma de Votación Segura',
    description:
      'Sistema de elecciones internas con verificación de identidad. Objetivo: Seguridad, hashing y auditoría de datos. Tecnologías: Python (FastAPI), Redis, React. Contexto: Herramienta para juntas directivas.',
    difficulty: 'dev-gold',
    repo_url: 'https://github.com/seedup-devs/secure-vote-gold',
    figma_url: 'https://www.figma.com/file/placeholder-gold-2',
    team_scope: {
      frontend:
        'Flujo de votación paso a paso, visualización de resultados en tiempo real y perfil de votante.',
      backend:
        'Sistema de encriptación de votos, prevención de doble voto y logs de auditoría inmutables.',
      extra: 'Testing de integración para asegurar la integridad de la lógica de conteo.',
      stack: 'React + FastAPI + PostgreSQL + Redis',
    },
  },
  {
    name: 'CRM para Bienes Raíces',
    description:
      'Gestión de prospectos, propiedades y seguimiento de ventas. Objetivo: Integración con servicios externos (Maps, Email). Tecnologías: Node.js, Vue 3, MySQL. Contexto: Plataforma para inmobiliarias.',
    difficulty: 'dev-gold',
    repo_url: 'https://github.com/seedup-devs/real-estate-crm-gold',
    figma_url: 'https://www.figma.com/file/placeholder-gold-3',
    team_scope: {
      frontend:
        'Buscador con filtros geográficos, gestión de fotos de propiedades y pipeline de ventas.',
      backend:
        'Modelado de relaciones complejas (Clientes-Propiedades-Agentes) e integración de Mapas API.',
      extra: 'Automatización de correos electrónicos de seguimiento (Cron jobs).',
      stack: 'Vue 3 + Node.js (Express) + MySQL + Google Maps API',
    },
  },
  {
    name: 'Plataforma de Streaming con Suscripciones',
    description:
      'Servicio de video bajo demanda con gestión de pagos recurrentes. Objetivo: Manejo de webhooks y streams de video. Tecnologías: Node.js, AWS S3, Stripe. Contexto: Startup de cursos especializados.',
    difficulty: 'dev-gold',
    repo_url: 'https://github.com/seedup-devs/stream-fit-gold',
    figma_url: 'https://www.figma.com/file/placeholder-gold-5',
    team_scope: {
      frontend:
        'Reproductor de video customizado, landing de planes y dashboard de suscriptor.',
      backend:
        'Integración de Stripe Billing para suscripciones y almacenamiento seguro en Cloud.',
      extra: 'Seguridad de contenido (URLs firmadas) y manejo de eventos vía Webhooks.',
      stack: 'Next.js + Node.js + Stripe + AWS S3',
    },
  },
  {
    name: 'SaaS de Automatización de Marketing',
    description:
      'Envío masivo de correos y seguimiento de campañas. Objetivo: Procesos en segundo plano (Workers) y colas. Tecnologías: Node.js, BullMQ, Redis. Contexto: Herramienta para agencias.',
    difficulty: 'dev-gold',
    repo_url: 'https://github.com/seedup-devs/marketing-auto-gold',
    figma_url: 'https://www.figma.com/file/placeholder-gold-9',
    team_scope: {
      frontend:
        'Editor de plantillas de correo, visualizador de estadísticas de apertura y clics.',
      backend:
        'Gestión de colas de envío para no bloquear el hilo principal y procesamiento asíncrono.',
      extra: 'Implementación de un sistema de tracking de píxeles para medir efectividad.',
      stack: 'React + Node.js + BullMQ + Redis + PostgreSQL',
    },
  },
  {
    name: 'Neo-Banco Digital MVP',
    description:
      'Plataforma financiera core: transacciones internas, ahorros y monedero. Objetivo: Integridad transaccional y seguridad financiera. Tecnologías: Node.js/Go, PostgreSQL, React. Contexto: MVP para una Fintech local.',
    difficulty: 'dev-platinum',
    repo_url: 'https://github.com/seedup-devs/neo-bank-platinum',
    figma_url: 'https://www.figma.com/file/placeholder-platinum-1',
    team_scope: {
      frontend:
        'Interfaz bancaria con alta seguridad, historial transaccional y transferencias P2P.',
      backend:
        'Manejo de transacciones ACID en DB para evitar inconsistencias de saldo y API protegida.',
      extra:
        'Implementación de logs detallados y sistema de alertas por actividad sospechosa.',
      stack: 'React + Go/Node.js + PostgreSQL (Isolation Levels) + Docker',
    },
  },
  {
    name: 'Marketplace de Energía Renovable (P2P)',
    description:
      'Sistema para compra/venta de excedentes de energía solar entre vecinos. Objetivo: Simulación de ledger y contratos. Tecnologías: Next.js, PostgreSQL, Node.js. Contexto: Proyecto de sostenibilidad urbana.',
    difficulty: 'dev-platinum',
    repo_url: 'https://github.com/seedup-devs/energy-swap-platinum',
    figma_url: 'https://www.figma.com/file/placeholder-platinum-5',
    team_scope: {
      frontend:
        'Visualización de oferta/demanda energética local y panel de control de excedentes.',
      backend:
        'Algoritmo de matching de precios y registro histórico de transacciones (Ledger).',
      extra: 'Simulación de dispositivos IoT que reportan generación de energía vía API.',
      stack: 'Next.js + Node.js + PostgreSQL + Socket.io + Docker',
    },
  },
  {
    name: 'Plataforma de Telemedicina y Gestión Clínica',
    description:
      'Sistema integral para videoconsultas, recetas digitales e historias clínicas. Objetivo: Privacidad y manejo de datos sensibles. Tecnologías: WebRTC, NestJS, React. Contexto: Startup de salud digital.',
    difficulty: 'dev-platinum',
    repo_url: 'https://github.com/seedup-devs/health-core-platinum',
    figma_url: 'https://www.figma.com/file/placeholder-platinum-9',
    team_scope: {
      frontend:
        'Sala de videollamada integrada, visor de historia clínica y portal de paciente.',
      backend:
        'Servidor de señalización WebRTC, encriptación de datos médicos y firma digital.',
      extra:
        'Cumplimiento normativo básico de privacidad y pruebas de carga para video.',
      stack: 'React + NestJS + WebRTC + PostgreSQL + AWS (S3/CloudFront)',
    },
  },
  {
    name: 'SaaS de Gestión de Flotas de Delivery',
    description:
      'Centro de comando para empresas de logística: rutas, despachos y monitoreo. Objetivo: Optimización y geolocalización. Tecnologías: React, Node.js, Redis. Contexto: Solución para empresas de mensajería.',
    difficulty: 'dev-platinum',
    repo_url: 'https://github.com/seedup-devs/logistic-platinum',
    figma_url: 'https://www.figma.com/file/placeholder-platinum-8',
    team_scope: {
      frontend:
        'Dashboard central con mapas interactivos y monitoreo de repartidores en vivo.',
      backend:
        'Cálculo de rutas óptimas e integración de geolocalización en tiempo real vía Sockets.',
      extra: 'Sistema de notificaciones Push para repartidores y clientes finales.',
      stack: 'React + Node.js + Redis + MongoDB + Socket.io + Google Maps API',
    },
  },
  {
    name: 'Plataforma de Crowdfunding para Proyectos Tech',
    description:
      'Sitio de recaudación con recompensas, niveles y fondeo. Objetivo: Gestión de pagos complejos y metas dinámicas. Tecnologías: Next.js, Stripe, PostgreSQL. Contexto: Startup enfocada en hardware libre.',
    difficulty: 'dev-platinum',
    repo_url: 'https://github.com/seedup-devs/tech-fund-platinum',
    figma_url: 'https://www.figma.com/file/placeholder-platinum-3',
    team_scope: {
      frontend:
        'Páginas de proyectos ricas en multimedia, flujos de pago y perfiles de patrocinadores.',
      backend:
        'Sistema de gestión de fondos (escrow simulación), comisiones y lógica de recompensas.',
      extra: 'Optimización SEO para indexación dinámica de proyectos nuevos.',
      stack: 'Next.js (App Router) + Node.js + Stripe + PostgreSQL + AWS S3',
    },
  },
];

export async function POST(req: NextRequest) {
  let body: { admin_email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const adminId = body.admin_email ? await verifyAdminByEmail(body.admin_email) : null;
  if (!adminId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { data: existing } = await supabaseAdmin.from('projects').select('name');
  const existingNames = new Set((existing ?? []).map((p: { name: string }) => p.name));

  const toInsert = PROJECTS.filter((p) => !existingNames.has(p.name));

  if (toInsert.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0, skipped: PROJECTS.length });
  }

  const { error } = await supabaseAdmin.from('projects').insert(toInsert);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    inserted: toInsert.length,
    skipped: PROJECTS.length - toInsert.length,
  });
}
