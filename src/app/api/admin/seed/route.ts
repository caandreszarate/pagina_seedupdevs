import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminByEmail } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

const SEED_DATA = [
  {
    name: 'Fundamentos del Desarrollo',
    description: 'Bases sólidas para cualquier desarrollador que comienza su camino.',
    level: 'dev-zero',
    is_premium: false,
    order_index: 0,
    modules: [
      {
        title: 'Lógica de Programación',
        description: 'Pensamiento computacional y resolución de problemas.',
        order_index: 0,
        lessons: [
          {
            title: '¿Qué es un algoritmo?',
            content: `# ¿Qué es un algoritmo?\n\nUn **algoritmo** es un conjunto finito de instrucciones ordenadas que resuelven un problema específico.\n\n## Características\n\n- **Finito**: debe terminar en algún momento.\n- **Definido**: cada paso debe ser claro y sin ambigüedad.\n- **Entrada**: puede recibir datos.\n- **Salida**: produce un resultado.\n\n## Ejemplo cotidiano\n\nReceta para hacer café:\n\n1. Calentar agua\n2. Agregar café molido al filtro\n3. Verter agua caliente\n4. Esperar 3 minutos\n5. Servir\n\n## En código\n\n\`\`\`js\nfunction sumar(a, b) {\n  return a + b;\n}\n\`\`\`\n\nEste es un algoritmo simple: recibe dos números y devuelve su suma.`,
            is_premium: false,
            duration_minutes: 8,
            order_index: 0,
          },
          {
            title: 'Variables y tipos de datos',
            content: `# Variables y tipos de datos\n\nUna **variable** es un contenedor con nombre que almacena un valor.\n\n## Tipos de datos básicos\n\n| Tipo | Ejemplo | Descripción |\n|------|---------|-------------|\n| String | \`"hola"\` | Texto |\n| Number | \`42\` | Número |\n| Boolean | \`true\` | Verdadero o falso |\n| Array | \`[1, 2, 3]\` | Lista de valores |\n| Object | \`{ nombre: "Ana" }\` | Colección clave-valor |\n\n## Declaración en JavaScript\n\n\`\`\`js\nconst nombre = "Carlos";\nlet edad = 25;\nvar activo = true;\n\`\`\`\n\n> 💡 Prefiere \`const\` cuando el valor no cambia, \`let\` cuando sí cambia. Evita \`var\`.`,
            is_premium: false,
            duration_minutes: 10,
            order_index: 1,
          },
        ],
      },
      {
        title: 'Control de Flujo',
        description: 'Condicionales, bucles y estructuras de control.',
        order_index: 1,
        lessons: [
          {
            title: 'Condicionales: if / else',
            content: `# Condicionales: if / else\n\nLos condicionales permiten ejecutar código solo cuando se cumple una condición.\n\n## Sintaxis básica\n\n\`\`\`js\nif (condición) {\n  // código si es verdadero\n} else {\n  // código si es falso\n}\n\`\`\`\n\n## Ejemplo real\n\n\`\`\`js\nconst nivel = "dev-gold";\n\nif (nivel === "dev-platinum") {\n  console.log("¡Eres experto!");\n} else if (nivel === "dev-gold") {\n  console.log("¡Vas muy bien!");\n} else {\n  console.log("Sigue practicando");\n}\n\`\`\``,
            is_premium: false,
            duration_minutes: 12,
            order_index: 0,
          },
          {
            title: 'Bucles: for y while',
            content: `# Bucles: for y while\n\nLos bucles repiten un bloque de código múltiples veces.\n\n## for loop\n\n\`\`\`js\nfor (let i = 0; i < 5; i++) {\n  console.log(i); // 0, 1, 2, 3, 4\n}\n\`\`\`\n\n## while loop\n\n\`\`\`js\nlet contador = 0;\nwhile (contador < 3) {\n  console.log(contador);\n  contador++;\n}\n\`\`\`\n\n## forEach con arrays\n\n\`\`\`js\nconst devs = ["Ana", "Luis", "Sofía"];\ndevs.forEach(dev => console.log(\`Hola, \${dev}!\`));\n\`\`\``,
            is_premium: true,
            duration_minutes: 15,
            order_index: 1,
          },
        ],
      },
    ],
  },
  {
    name: 'JavaScript Intermedio',
    description: 'Funciones avanzadas, asincronía y patrones modernos.',
    level: 'dev-bronce',
    is_premium: false,
    order_index: 1,
    modules: [
      {
        title: 'Funciones Avanzadas',
        description: 'Arrow functions, closures y callbacks.',
        order_index: 0,
        lessons: [
          {
            title: 'Arrow Functions',
            content: `# Arrow Functions\n\nLas arrow functions son una sintaxis más concisa para definir funciones.\n\n## Sintaxis\n\n\`\`\`js\n// Función tradicional\nfunction saludar(nombre) {\n  return \`Hola, \${nombre}!\`;\n}\n\n// Arrow function\nconst saludar = (nombre) => \`Hola, \${nombre}!\`;\n\`\`\`\n\n## Diferencias clave\n\n- No tienen su propio \`this\`\n- No se pueden usar como constructores\n- Son ideales como callbacks\n\n## Ejemplos con arrays\n\n\`\`\`js\nconst numeros = [1, 2, 3, 4, 5];\n\nconst dobles = numeros.map(n => n * 2);\nconst pares = numeros.filter(n => n % 2 === 0);\nconst suma = numeros.reduce((acc, n) => acc + n, 0);\n\`\`\``,
            is_premium: false,
            duration_minutes: 12,
            order_index: 0,
          },
          {
            title: 'Promesas y async/await',
            content: `# Promesas y async/await\n\nJavaScript es asíncrono por naturaleza. Las promesas y async/await permiten manejar operaciones que toman tiempo.\n\n## Promesas\n\n\`\`\`js\nfetch('/api/users')\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));\n\`\`\`\n\n## async/await (más legible)\n\n\`\`\`js\nasync function obtenerUsuarios() {\n  try {\n    const res = await fetch('/api/users');\n    const data = await res.json();\n    return data;\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}\n\`\`\`\n\n> 💡 async/await hace que el código asíncrono se vea y se comporte como sincrónico.`,
            is_premium: true,
            duration_minutes: 18,
            order_index: 1,
          },
        ],
      },
      {
        title: 'Patrones Modernos',
        description: 'Destructuring, spread, y módulos ES6.',
        order_index: 1,
        lessons: [
          {
            title: 'Destructuring y Spread',
            content: `# Destructuring y Spread\n\n## Destructuring de objetos\n\n\`\`\`js\nconst usuario = { nombre: "Ana", nivel: "dev-gold", edad: 28 };\nconst { nombre, nivel } = usuario;\nconsole.log(nombre); // "Ana"\n\`\`\`\n\n## Destructuring de arrays\n\n\`\`\`js\nconst [primero, segundo, ...resto] = [1, 2, 3, 4, 5];\n\`\`\`\n\n## Spread operator\n\n\`\`\`js\nconst base = { plan: 'free', activo: true };\nconst extendido = { ...base, plan: 'pro', creado: new Date() };\n\`\`\`\n\n## En funciones\n\n\`\`\`js\nfunction configurar({ tema = 'oscuro', idioma = 'es' } = {}) {\n  return { tema, idioma };\n}\n\`\`\``,
            is_premium: true,
            duration_minutes: 14,
            order_index: 0,
          },
        ],
      },
    ],
  },
  {
    name: 'TypeScript y Arquitectura',
    description: 'Tipado estático, interfaces y patrones de diseño.',
    level: 'dev-silver',
    is_premium: true,
    order_index: 2,
    modules: [
      {
        title: 'TypeScript Fundamentos',
        description: 'Tipos, interfaces y generics.',
        order_index: 0,
        lessons: [
          {
            title: 'Tipos básicos en TypeScript',
            content: `# Tipos básicos en TypeScript\n\nTypeScript agrega tipado estático a JavaScript, detectando errores antes de ejecutar el código.\n\n## Tipos primitivos\n\n\`\`\`ts\nconst nombre: string = "Carlos";\nconst edad: number = 25;\nconst activo: boolean = true;\n\`\`\`\n\n## Interfaces\n\n\`\`\`ts\ninterface Usuario {\n  id: string;\n  nombre: string;\n  nivel: 'dev-zero' | 'dev-bronce' | 'dev-silver' | 'dev-gold' | 'dev-platinum';\n  createdAt: Date;\n}\n\nfunction mostrarNivel(usuario: Usuario): string {\n  return \`\${usuario.nombre} está en \${usuario.nivel}\`;\n}\n\`\`\`\n\n## Generics\n\n\`\`\`ts\nfunction obtenerPrimero<T>(arr: T[]): T | undefined {\n  return arr[0];\n}\n\nconst primeroStr = obtenerPrimero(['a', 'b', 'c']); // string\nconst primeroNum = obtenerPrimero([1, 2, 3]);       // number\n\`\`\``,
            is_premium: true,
            duration_minutes: 20,
            order_index: 0,
          },
          {
            title: 'Patrones de diseño en TS',
            content: `# Patrones de diseño en TypeScript\n\n## Repository Pattern\n\n\`\`\`ts\ninterface UserRepository {\n  findById(id: string): Promise<User | null>;\n  findByEmail(email: string): Promise<User | null>;\n  save(user: User): Promise<void>;\n}\n\nclass SupabaseUserRepository implements UserRepository {\n  async findById(id: string) {\n    const { data } = await supabase.from('users').select().eq('id', id).single();\n    return data;\n  }\n  // ...\n}\n\`\`\`\n\n## Factory Pattern\n\n\`\`\`ts\ntype Plan = 'free' | 'pro';\n\nfunction createSubscription(plan: Plan) {\n  const base = { plan, createdAt: new Date() };\n  return plan === 'pro'\n    ? { ...base, features: ['all'] }\n    : { ...base, features: ['basic'] };\n}\n\`\`\``,
            is_premium: true,
            duration_minutes: 25,
            order_index: 1,
          },
        ],
      },
    ],
  },
];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;

  if (!await verifyAdminByEmail(email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const results = { paths: 0, modules: 0, lessons: 0 };

  for (const pathData of SEED_DATA) {
    const { modules, ...pathFields } = pathData;

    const { data: path, error: pathError } = await supabaseAdmin
      .from('learning_paths')
      .insert(pathFields)
      .select()
      .single();

    if (pathError || !path) continue;
    results.paths++;

    for (const modData of modules) {
      const { lessons, ...modFields } = modData;

      const { data: mod, error: modError } = await supabaseAdmin
        .from('modules')
        .insert({ ...modFields, learning_path_id: path.id })
        .select()
        .single();

      if (modError || !mod) continue;
      results.modules++;

      for (const lessonData of lessons) {
        const { error: lessonError } = await supabaseAdmin
          .from('lessons')
          .insert({ ...lessonData, module_id: mod.id });

        if (!lessonError) results.lessons++;
      }
    }
  }

  return NextResponse.json({ ok: true, created: results });
}
