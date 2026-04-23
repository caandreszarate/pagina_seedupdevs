'use client';

import { useReducer, useCallback } from 'react';
import type { RespuestaUsuario } from '@/types/evaluacion';

interface EvaluacionState {
  indiceActual: number;
  respuestas: RespuestaUsuario[];
  enviando: boolean;
  error: string | null;
}

type EvaluacionAction =
  | { type: 'SET_RESPUESTA'; preguntaId: string; respuesta: string }
  | { type: 'SIGUIENTE' }
  | { type: 'ANTERIOR' }
  | { type: 'SET_ENVIANDO'; value: boolean }
  | { type: 'SET_ERROR'; message: string };

const initialState: EvaluacionState = {
  indiceActual: 0,
  respuestas: [],
  enviando: false,
  error: null,
};

function reducer(state: EvaluacionState, action: EvaluacionAction): EvaluacionState {
  switch (action.type) {
    case 'SET_RESPUESTA': {
      const existe = state.respuestas.find(r => r.preguntaId === action.preguntaId);
      const respuestas = existe
        ? state.respuestas.map(r =>
            r.preguntaId === action.preguntaId ? { ...r, respuesta: action.respuesta } : r
          )
        : [...state.respuestas, { preguntaId: action.preguntaId, respuesta: action.respuesta }];
      return { ...state, respuestas };
    }
    case 'SIGUIENTE':
      return { ...state, indiceActual: state.indiceActual + 1 };
    case 'ANTERIOR':
      return { ...state, indiceActual: Math.max(0, state.indiceActual - 1) };
    case 'SET_ENVIANDO':
      return { ...state, enviando: action.value, error: null };
    case 'SET_ERROR':
      return { ...state, enviando: false, error: action.message };
    default:
      return state;
  }
}

export function useEvaluacion(totalPreguntas: number) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const respuestaActual = useCallback(
    (preguntaId: string) =>
      state.respuestas.find(r => r.preguntaId === preguntaId)?.respuesta ?? null,
    [state.respuestas]
  );

  const setRespuesta = useCallback((preguntaId: string, respuesta: string) => {
    dispatch({ type: 'SET_RESPUESTA', preguntaId, respuesta });
  }, []);

  const siguiente = useCallback(() => {
    dispatch({ type: 'SIGUIENTE' });
  }, []);

  const anterior = useCallback(() => {
    dispatch({ type: 'ANTERIOR' });
  }, []);

  const esUltima = state.indiceActual === totalPreguntas - 1;
  const esPrimera = state.indiceActual === 0;
  const progreso = ((state.indiceActual + 1) / totalPreguntas) * 100;

  return {
    indiceActual: state.indiceActual,
    respuestas: state.respuestas,
    enviando: state.enviando,
    error: state.error,
    esUltima,
    esPrimera,
    progreso,
    respuestaActual,
    setRespuesta,
    siguiente,
    anterior,
    dispatch,
  };
}
