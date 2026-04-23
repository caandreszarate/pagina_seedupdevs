export type Nivel = 'dev-zero' | 'dev-bronce' | 'dev-silver' | 'dev-gold' | 'dev-platinum';

export type TipoPregunta = 'multiple_choice' | 'code';

export type Habilidad =
  | 'variables'
  | 'condicionales'
  | 'bucles'
  | 'funciones'
  | 'arrays'
  | 'objetos'
  | 'modularizacion'
  | 'async_await'
  | 'promesas'
  | 'fetch'
  | 'manejo_errores'
  | 'solid'
  | 'testing'
  | 'system_design'
  | 'arquitectura'
  | 'tipos_datos'
  | 'operadores'
  | 'scope'
  | 'html_semantica'
  | 'css_selectores'
  | 'css_box_model'
  | 'html_formularios'
  | 'spread_destructuring'
  | 'css_flexbox'
  | 'git_basico'
  | 'git_branches'
  | 'http_protocolos'
  | 'css_grid'
  | 'css_responsive'
  | 'git_avanzado'
  | 'typescript'
  | 'rest_api'
  | 'node_js'
  | 'patrones_diseno'
  | 'base_datos'
  | 'autenticacion'
  | 'performance'
  | 'seguridad'
  | 'devops';

export interface Pregunta {
  id: string;
  pregunta: string;
  tipo: TipoPregunta;
  codigo?: string;
  opciones: string[];
  respuestaCorrecta: string;
  habilidad: Habilidad;
  nivel: Nivel;
}

export interface RespuestaUsuario {
  preguntaId: string;
  respuesta: string;
}

export interface ResultadoEvaluacion {
  nivel: Nivel;
  score: number;
  totalCorrectas: number;
  totalPreguntas: number;
  fortalezas: string[];
  debilidades: string[];
  descripcionNivel: string;
}
