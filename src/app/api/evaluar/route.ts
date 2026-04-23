import { NextRequest, NextResponse } from 'next/server';
import { preguntas } from '@/data/preguntas';
import type { Nivel, RespuestaUsuario, ResultadoEvaluacion } from '@/types/evaluacion';

const UMBRAL_NIVEL = 2;

const ORDEN_NIVELES: Nivel[] = [
  'dev-zero',
  'dev-bronce',
  'dev-silver',
  'dev-gold',
  'dev-platinum',
];

const DESCRIPCION_NIVEL: Record<Nivel, string> = {
  'dev-zero':
    'Estás comenzando tu camino en el desarrollo. Dominar variables, condicionales y bucles es tu próximo objetivo.',
  'dev-bronce':
    'Manejas los conceptos básicos. El siguiente paso es profundizar en funciones, estructuras de datos y modularización.',
  'dev-silver':
    'Tienes bases sólidas. Refuerza tu manejo de asincronía, APIs y manejo de errores para seguir creciendo.',
  'dev-gold':
    'Tu código funciona bien. Llevar tus prácticas al siguiente nivel con SOLID, testing y clean code te distinguirá.',
  'dev-platinum':
    'Tienes dominio técnico avanzado. Piensas en sistemas, arquitectura y escalabilidad como un senior.',
};

const ETIQUETAS_HABILIDAD: Record<string, string> = {
  variables: 'Variables',
  condicionales: 'Condicionales',
  bucles: 'Bucles',
  funciones: 'Funciones',
  arrays: 'Arrays y métodos',
  objetos: 'Objetos',
  modularizacion: 'Modularización (ESModules)',
  async_await: 'Async / Await',
  promesas: 'Promesas',
  fetch: 'Consumo de APIs (fetch)',
  manejo_errores: 'Manejo de errores',
  solid: 'Principios SOLID',
  testing: 'Testing',
  system_design: 'System Design',
  arquitectura: 'Arquitectura de software',
  tipos_datos: 'Tipos de datos',
  operadores: 'Operadores',
  scope: 'Scope y Hoisting',
  html_semantica: 'HTML Semántico',
  css_selectores: 'Selectores CSS',
  css_box_model: 'Box Model',
  html_formularios: 'Formularios HTML',
  spread_destructuring: 'Spread y Destructuring',
  css_flexbox: 'Flexbox',
  git_basico: 'Git Básico',
  git_branches: 'Ramas Git',
  http_protocolos: 'Protocolo HTTP',
  css_grid: 'CSS Grid',
  css_responsive: 'Diseño Responsive',
  git_avanzado: 'Git Avanzado',
  typescript: 'TypeScript',
  rest_api: 'APIs REST',
  node_js: 'Node.js',
  patrones_diseno: 'Patrones de Diseño',
  base_datos: 'Bases de Datos',
  autenticacion: 'Autenticación',
  performance: 'Performance Web',
  seguridad: 'Seguridad Web',
  devops: 'DevOps',
};

export async function POST(req: NextRequest) {
  let respuestas: RespuestaUsuario[];
  let preguntaIds: string[];

  try {
    const body = await req.json();
    respuestas = body.respuestas;
    preguntaIds = body.preguntaIds;
    if (!Array.isArray(respuestas) || !Array.isArray(preguntaIds)) throw new Error();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const preguntasActivas = preguntas.filter(p => preguntaIds.includes(p.id));

  // ── Aciertos por habilidad ──────────────────────────────────────────────
  const aciertosHabilidad: Record<string, { correctas: number; total: number }> = {};

  for (const pregunta of preguntasActivas) {
    if (!aciertosHabilidad[pregunta.habilidad]) {
      aciertosHabilidad[pregunta.habilidad] = { correctas: 0, total: 0 };
    }
    aciertosHabilidad[pregunta.habilidad].total++;

    const respuesta = respuestas.find(r => r.preguntaId === pregunta.id);
    if (respuesta?.respuesta === pregunta.respuestaCorrecta) {
      aciertosHabilidad[pregunta.habilidad].correctas++;
    }
  }

  // ── Aciertos por nivel ──────────────────────────────────────────────────
  const aciertosNivel: Record<Nivel, { correctas: number; total: number }> = {
    'dev-zero':     { correctas: 0, total: 0 },
    'dev-bronce':   { correctas: 0, total: 0 },
    'dev-silver':   { correctas: 0, total: 0 },
    'dev-gold':     { correctas: 0, total: 0 },
    'dev-platinum': { correctas: 0, total: 0 },
  };

  for (const pregunta of preguntasActivas) {
    aciertosNivel[pregunta.nivel].total++;
    const respuesta = respuestas.find(r => r.preguntaId === pregunta.id);
    if (respuesta?.respuesta === pregunta.respuestaCorrecta) {
      aciertosNivel[pregunta.nivel].correctas++;
    }
  }

  // ── Clasificación en cascada ────────────────────────────────────────────
  let nivelFinal: Nivel = 'dev-zero';

  for (const nivel of ORDEN_NIVELES) {
    const { correctas } = aciertosNivel[nivel];
    if (correctas >= UMBRAL_NIVEL) {
      nivelFinal = nivel;
    } else {
      break;
    }
  }

  // ── Score global ────────────────────────────────────────────────────────
  const totalCorrectas = Object.values(aciertosNivel).reduce((s, v) => s + v.correctas, 0);
  const totalPreguntas = preguntasActivas.length;
  const score = Math.round((totalCorrectas / totalPreguntas) * 100);

  // ── Fortalezas y debilidades por habilidad ──────────────────────────────
  const fortalezas: string[] = [];
  const debilidades: string[] = [];

  for (const [habilidad, { correctas, total }] of Object.entries(aciertosHabilidad)) {
    const etiqueta = ETIQUETAS_HABILIDAD[habilidad] ?? habilidad;
    if (correctas / total >= 0.7) {
      fortalezas.push(etiqueta);
    } else {
      debilidades.push(etiqueta);
    }
  }

  const resultado: ResultadoEvaluacion = {
    nivel: nivelFinal,
    score,
    totalCorrectas,
    totalPreguntas,
    fortalezas,
    debilidades,
    descripcionNivel: DESCRIPCION_NIVEL[nivelFinal],
  };

  return NextResponse.json(resultado);
}
