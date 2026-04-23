import type { Nivel } from '@/types/evaluacion';

export const NIVEL_ORDER: Nivel[] = [
  'dev-zero',
  'dev-bronce',
  'dev-silver',
  'dev-gold',
  'dev-platinum',
];

export const ROLE_MAP: Record<Nivel, string> = {
  'dev-zero':     process.env.DISCORD_ROLE_DEV_ZERO!,
  'dev-bronce':   process.env.DISCORD_ROLE_DEV_BRONCE!,
  'dev-silver':   process.env.DISCORD_ROLE_DEV_SILVER!,
  'dev-gold':     process.env.DISCORD_ROLE_DEV_GOLD!,
  'dev-platinum': process.env.DISCORD_ROLE_DEV_PLATINUM!,
};

export function nivelIndex(nivel: Nivel): number {
  return NIVEL_ORDER.indexOf(nivel);
}

export function isUpgrade(currentLevel: Nivel | null | undefined, newLevel: Nivel): boolean {
  if (!currentLevel) return true;
  return nivelIndex(newLevel) > nivelIndex(currentLevel);
}
