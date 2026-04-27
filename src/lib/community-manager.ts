export type RankingEntry = {
  nombres: string;
  score: number;
  position: number;
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DAILY_SEED_PROMPTS = [
  '☀️ Buenos días devs. Una pregunta para arrancar el día: ¿Qué proyecto personal tienes pendiente que siempre postpones? Hoy es el día.',
  '🔥 ¿En qué proyecto estás enfocado esta semana? Cuéntanos en 2 líneas y hagamos accountability juntos.',
  '💡 Reflexión técnica del día: ¿Cuál fue el bug más difícil que resolviste en tu vida? ¿Cómo lo encontraste?',
  '🚀 ¿Qué tecnología o herramienta descubriste recientemente que te cambió el flujo de trabajo?',
  '🧠 Debate del día: ¿Prefieres resolver un problema con más código simple o menos código complejo? ¿Por qué?',
  '🎯 ¿Qué meta técnica te pusiste esta semana? ¿La cumpliste? Sé honesto.',
  '🌱 ¿Qué aprendiste esta semana que cambió tu forma de pensar sobre el código?',
  '⚡ ¿Cuál es el consejo técnico más valioso que alguien te dio y que realmente aplicaste?',
  '🛠️ ¿Qué stack usarías hoy si tuvieras que construir un SaaS desde cero? ¿Por qué ese y no otro?',
  '🤔 ¿Hay algo que aprendiste hace poco y que desearías haber aprendido mucho antes? Cuéntanos.',
  '🎓 ¿Qué recurso (curso, libro, video, doc) recomendarías a alguien que quiere subir de nivel ahora mismo?',
  '💬 Si pudieras darle un consejo a tu yo de hace 2 años que empezaba a programar, ¿cuál sería?',
  '🌍 ¿Estás trabajando en algo que podría impactar a otras personas fuera del código? Cuéntanos.',
  '🏗️ ¿Cuál fue la decisión de arquitectura más difícil que tomaste en un proyecto? ¿Qué aprendiste?',
  '🔍 ¿Qué problema del mundo real te gustaría resolver con código si tuvieras tiempo ilimitado?',
  '💼 ¿Freelance, trabajo remoto o startup propia? ¿Dónde te ves en 2 años y por qué?',
  '🧩 ¿Cuál es el concepto de programación que más te costó entender y cuándo hizo "click"?',
  '🚦 ¿Tienes algún proyecto pausado? ¿Qué necesitarías para retomarlo esta semana?',
  '📦 ¿Cuál es la librería o herramienta que más usas y que crees que está underrated en la comunidad?',
  '🎯 ¿Qué habilidad técnica o blanda quieres desarrollar antes de que termine el año?',
];

const CHALLENGE_PROMPTS = [
  '💻 **Reto del día — Algoritmos:**\nEscribe una función que reciba un array de enteros y retorne el segundo número más grande sin usar `.sort()`.\nTiempo: 15 min. Comparte tu solución aquí 👇',
  '🎨 **Reto del día — Frontend:**\nConstruye un componente toggle switch animado usando solo CSS, sin librerías externas.\nTiempo: 20 min. Sube tu código o screenshot 👇',
  '🏗️ **Reto del día — Arquitectura:**\nDiseña el esquema de DB para un sistema de notificaciones multi-canal (email, SMS, push). ¿Qué tablas necesitas? ¿Qué índices?\nComparte tu propuesta 👇',
  '⚡ **Reto del día — Performance:**\nTienes una lista de 10,000 elementos en React que hace tu app lenta. Nombra 3 estrategias para optimizarla y justifica cada una.\nTiempo: 10 min 👇',
  '🔐 **Reto del día — Seguridad:**\nEncuentra el fallo en este código:\n```\nif (user.role == "admin") allowAccess()\n```\n¿Qué está mal? ¿Cómo lo corriges? 👇',
  '🤖 **Reto del día — APIs:**\nDiseña los endpoints REST para un sistema de reservas de turnos. Métodos HTTP, rutas y qué retorna cada uno.\nComparte tu diseño 👇',
  '🧪 **Reto del día — Testing:**\nEscribe 3 casos de prueba para una función que valida emails. Incluye casos edge que la mayoría ignora.\nTiempo: 10 min 👇',
  '🗄️ **Reto del día — SQL:**\nDada una tabla `orders(id, user_id, total, created_at)`, escribe una query que retorne los 3 usuarios con mayor gasto total en los últimos 30 días.\nTiempo: 10 min 👇',
  '🔄 **Reto del día — Recursión:**\nImplementa `flatten(arr)` que aplane un array anidado de cualquier profundidad sin usar `.flat()`.\nEjemplo: `[[1,[2]],3]` → `[1,2,3]`. Tiempo: 15 min 👇',
  '🎯 **Reto del día — Git:**\nExplica en 5 pasos cómo revertirías un commit que ya fue pusheado a `main` sin usar `git push --force`.\nComparte tu flujo 👇',
  '🌐 **Reto del día — HTTP:**\nExplica la diferencia entre `401 Unauthorized` y `403 Forbidden`. ¿En qué caso usarías cada uno en tu propia API?\nTiempo: 5 min 👇',
  '📱 **Reto del día — UI/UX:**\nRediseña mentalmente el formulario de login de cualquier app que uses. ¿Qué cambiarías y por qué? Dibuja o describe el resultado 👇',
  '🧮 **Reto del día — Lógica:**\nSin ejecutar el código, ¿qué imprime esto?\n```js\nconsole.log([] + [])\nconsole.log([] + {})\nconsole.log({} + [])\n```\n¿Por qué? 👇',
  '🔁 **Reto del día — Patrones:**\nImplementa el patrón Observer en menos de 30 líneas de código en el lenguaje que prefieras.\nTiempo: 20 min 👇',
  '📊 **Reto del día — Datos:**\nTienes un array de objetos `{nombre, ventas}`. Escribe código que agrupe por rango de ventas: bajo (<100), medio (100-500), alto (>500).\nTiempo: 10 min 👇',
  '🚀 **Reto del día — DevOps:**\nEscribe un `Dockerfile` mínimo para una app Node.js que exponga el puerto 3000 y no incluya `node_modules` en la imagen.\nTiempo: 15 min 👇',
  '💡 **Reto del día — Refactoring:**\nEsta función hace demasiado. ¿Cómo la dividirías?\n```js\nfunction processUser(data) { validate(); saveDB(); sendEmail(); updateCache(); }\n```\nComparte tu propuesta 👇',
  '🔐 **Reto del día — Auth:**\nExplica el flujo completo de JWT: emisión, validación y refresh token. ¿Dónde guardarías el token en el cliente y por qué?\nTiempo: 10 min 👇',
];

const WINS_PROMPTS = [
  '🌙 Hora de los logros. ¿Qué construiste hoy? No importa si fue un componente, una query o simplemente entender un concepto. Todo cuenta 👇',
  '🏆 Final del día, devs. ¿Cuál fue tu victoria de hoy? Técnica, de aprendizaje o de productividad. Comparte 👇',
  '✨ Cierre de jornada. ¿Qué problema resolviste hoy que ayer no sabías cómo atacar? 👇',
  '🎉 ¿Qué deployaste, aprendiste o desbloqueaste hoy? Pequeño o grande, comparte tu win del día 👇',
  '💪 Rendición de cuentas: ¿Qué tarea que venías postergando finalmente completaste hoy? 👇',
  '🚀 ¿Hiciste un deploy hoy? ¿Resolviste un bug que te traía loco? ¿Aprendiste algo nuevo? Cuéntanos 👇',
  '🔥 El día casi termina. ¿Qué línea de código te hizo sentir orgulloso hoy? 👇',
  '🛠️ ¿Qué construiste, mejoró o rompiste hoy? (los bugs también son progreso) 👇',
  '🌟 Comparte tu win de hoy — grande o pequeño. La consistencia es lo que separa a los buenos devs de los grandes 👇',
  '💡 ¿Tuviste un "aha moment" hoy? ¿Algo que de repente hizo sentido? Cuéntanos 👇',
  '📈 ¿En qué mejoró tu código, tu proceso o tu entendimiento hoy comparado con ayer? 👇',
  '🎯 Último check-in del día: ¿llegaste a tu meta de hoy? Sé honesto, la comunidad está aquí para celebrar y apoyar 👇',
];

const INACTIVITY_TEMPLATES = [
  (discordId: string) =>
    `🚀 <@${discordId}> hace rato no te vemos construyendo con nosotros. ¿En qué andas? Cuéntanos, la comunidad quiere saber.`,
  (discordId: string) =>
    `👋 <@${discordId}> te extrañamos por aquí. ¿Qué proyecto tienes entre manos? Comparte, que para eso estamos.`,
  (discordId: string) =>
    `💡 <@${discordId}> la comunidad no es lo mismo sin ti. ¿Qué has estado aprendiendo últimamente? Cuéntanos.`,
];

export function generateDailySeedPrompt(): string {
  return pickRandom(DAILY_SEED_PROMPTS);
}

export function generateDailyChallengePrompt(): string {
  return pickRandom(CHALLENGE_PROMPTS);
}

export function generateWinPrompt(): string {
  return pickRandom(WINS_PROMPTS);
}

export function generateInactivityMessage(discordId: string, userName: string): string {
  const idx = userName.length % INACTIVITY_TEMPLATES.length;
  return INACTIVITY_TEMPLATES[idx](discordId);
}

export function generateWeeklyLeaderboardMessage(rankings: RankingEntry[]): string {
  const medals = ['🥇', '🥈', '🥉'];
  const lines = rankings.map((r) => {
    const prefix = medals[r.position - 1] ?? `${r.position}.`;
    return `${prefix} **${r.nombres}** — ${r.score} pts`;
  });

  return [
    '🏆 **RANKING SEMANAL — SeedUp Devs**',
    '',
    'Los devs más activos de esta semana:',
    '',
    ...lines,
    '',
    '¿No estás en el top 10? Esta semana es tu oportunidad. Cada mensaje, reto y sesión de voz suma 🔥',
  ].join('\n');
}
