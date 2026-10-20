# Pulso · Gym Routine Planner

Planificador de entrenamientos en español con **Next.js 16 App Router, React 19,
TypeScript, Tailwind CSS 4 y Supabase**. Diseño oscuro adaptable a móvil, inspirado
en los wireframes: inicio → editar calendario → seleccionar ejercicios.

## Ejecutar ahora

Requiere Node.js 22 o superior.

```bash
npm ci
npm run dev
```

Abre http://localhost:3000. Sin variables de entorno puedes explorar como invitado,
editar una rutina inicial y guardar los cambios en `localStorage`.

## Funciones

| Ruta                   | Función                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| `/`                    | Saludo, resumen semanal, 7 días seleccionables, ejercicios y progreso diario |
| `/calendar/edit`       | Enfoque por día; añadir, eliminar, reordenar; series y repeticiones          |
| `/calendar/edit?day=4` | Abre directamente el jueves (lunes=1, domingo=7)                             |
| `/exercises`           | Biblioteca, búsqueda, filtros combinados y selección del día de destino      |
| `/login`, `/register`  | Email/contraseña, confirmación por correo y sesión                           |
| `/auth/callback`       | Intercambio del código de confirmación por una sesión                        |
| `/api/exercises`       | Proxy ExerciseDB, caché del proveedor de 24 horas y paginación               |
| `/api/routines`        | Lectura y guardado autenticado del plan semanal                              |

- La rutina **se repite cada semana**. Navegar entre semanas cambia las fechas;
  no crea versiones independientes del plan.
- Las marcas de ejercicios completados se guardan **por fecha en este navegador**,
  separadas por usuario; no son un historial sincronizado en la nube.
- El guardado del calendario es explícito y atómico. Se avisa antes de salir por
  enlaces o recargar con cambios pendientes.
- Hasta 30 ejercicios por día, de 1 a 20 series y repeticiones como `10`, `8-12` o
  `30s`. La reordenación usa botones accesibles.
- La cuenta nueva empieza con una semana vacía. La rutina inicial es del modo
  invitado; no se importa automáticamente a una cuenta.

## Conectar Supabase

1. Crea un proyecto en Supabase y copia la plantilla:

   ```bash
   cp config/environment.example .env.local
   ```

2. Sustituye `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` por la URL
   del proyecto y su clave pública anon/publishable. **No uses service-role.**
3. Ejecuta una vez en SQL Editor el archivo
   [`supabase/migrations/202610200001_initial_schema.sql`](supabase/migrations/202610200001_initial_schema.sql).
   También puedes usar Supabase CLI:

   ```bash
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase db push
   ```

4. En **Authentication → URL Configuration** establece:
   - Site URL: `http://localhost:3000` en desarrollo o tu dominio Vercel en producción.
   - Redirect URLs: `http://localhost:3000/auth/callback` y
     `https://TU_DOMINIO/auth/callback`.
5. Activa Email/Password, confirmación por correo y contraseña mínima de 8 caracteres.
   Configura SMTP para el envío de correo en producción.
6. Reinicia Next.js después de cambiar variables públicas.

Con Supabase configurado, las páginas de planificación exigen una sesión válida.
Se usa `auth.getUser()` en el servidor y renovación de cookies en `src/proxy.ts`.
Las páginas privadas no se cachean de forma compartida.

### Modelo y RLS

- `auth.users`: identidad gestionada por Supabase Auth.
- `public.users`: perfil privado (id, email, name, created_at), creado por trigger.
- `weekly_routines`: una fila por usuario y día ISO con su enfoque muscular.
- `routine_exercises`: ejercicios ordenados, imagen/GIF, series y repeticiones.

Las tres tablas tienen RLS. El perfil se lee solo por su propietario y solo se
permite actualizar `name`. Las rutinas y ejercicios comprueban propiedad al leer,
insertar y modificar. No existe acceso anónimo a las tablas.

`save_weekly_plan(jsonb)` usa **SECURITY INVOKER**, conserva RLS y obtiene al usuario
de `auth.uid()`. Guarda los siete días en una transacción: un error revierte todo.
Un bloqueo por usuario serializa guardados simultáneos; se conserva el último
válido. No se confía en un `user_id` del cliente. Los triggers de perfil usan
`search_path` vacío y nombres cualificados.

Las pruebas ejecutan la migración en PostgreSQL embebido (PGlite), con roles que
no son propietarios. Comprueban aislamiento de dos cuentas, denegación anónima,
escritura cruzada y rollback de la semana completa.

## Conectar ExerciseDB

Configura en `.env.local` y Vercel:

```dotenv
EXERCISE_DB_API_KEY=TU_CLAVE_DE_RAPIDAPI
EXERCISE_DB_HOST=exercisedb.p.rapidapi.com
```

La clave solo se utiliza en el servidor, no tiene prefijo `NEXT_PUBLIC_` y no se
envía al navegador. El host está restringido al proveedor esperado. La API de pago
requiere además Supabase configurado y una sesión autenticada. Sin clave o sin
Supabase se sirve un catálogo de ejemplo de 16 ejercicios con fotos locales CC0.

```text
GET /api/exercises?bodyPart=chest&equipment=barbell&q=press&limit=24&offset=0
```

- Parámetros: `bodyPart`, `equipment`, `q`, `limit` (1–100), `offset` (0–10000).
- Respuesta: `{ exercises, source, hasMore, nextOffset }`.
- Se utiliza el filtro primario del proveedor y los filtros combinados se aplican
  a cada página. Si no hay coincidencias en una página se permite seguir cargando
  cuando hay más resultados; no se confunde página vacía con fin del catálogo.
- ExerciseDB conserva nombres e instrucciones originales, normalmente en inglés.
  La búsqueda local en español reconoce acentos; la remota usa nombres del proveedor.
- `fetch(..., { next: { revalidate: 86400 } })` cachea la respuesta del proveedor,
  no cookies ni datos personales. Timeout de 8 segundos.
- Cuota agotada, fallos o cambios de contrato muestran error y permiten reintentar;
  no se sustituyen silenciosamente por datos de ejemplo.

## Git y GitHub

Se reutiliza [`sebastian01-vs/WebEjercicios`](https://github.com/sebastian01-vs/WebEjercicios)
y `main`, conservando historial y visibilidad pública. El usuario propietario
tiene permisos `admin` y `push`, verificados mediante GitHub.

La fase inicial creó `.gitignore`, el commit de scaffold y el primer push. Todos
los `.env*`, dependencias, builds y archivos de trabajo están excluidos. La plantilla
pública está en `config/environment.example` para mantener esa exclusión estricta.

El script reutilizable comprueba autenticación, crea un repositorio **privado**
`gym-routine-planner` si falta `origin`, y verifica administración, webhooks y Actions:

```bash
gh auth login --web --scopes repo,admin:repo_hook,workflow  # solo si falta sesión
npm run github:setup
```

Si `gh` devuelve `Forbidden` por la política de red, debe permitirse `api.github.com`
en la configuración del entorno. Un bloqueo de red no se resuelve repitiendo el
login. Git por HTTPS puede funcionar de forma independiente. El script no puede
autoasignar permisos; un propietario debe concederlos si la comprobación ADMIN falla.

Para configurar secretos reales disponibles como variables del proceso:

```bash
bash scripts/setup-github.sh --secrets
```

Configura `SUPABASE_URL` desde `NEXT_PUBLIC_SUPABASE_URL` y `EXERCISE_DB_API_KEY`
solo si tienen valores. Se envían por stdin; no se crean secretos ficticios.
Vercel utiliza **sus propias variables**: los secretos GitHub no se copian al hosting.
CI funciona sin secretos externos.

## Despliegue continuo en Vercel

Incluye `vercel.json` y GitHub Actions para lint, TypeScript, pruebas de dominio,
API y PostgreSQL, build y recorridos de navegador.

1. En Vercel: **Add New → Project → Import Git Repository → WebEjercicios**.
2. Usa la raíz del repositorio, framework **Next.js**, Node.js **22.x**, y `main`
   como Production Branch. Los comandos están declarados.
3. Añade las cinco variables de `config/environment.example` en Production/Preview
   para usar los servicios reales. Las públicas de Supabase deben existir **antes del build**.
4. Establece `NEXT_PUBLIC_SITE_URL=https://TU_DOMINIO` y configura el dominio y
   `/auth/callback` en Supabase Auth.
5. Despliega. La integración nativa genera previews de PR y producción con cada push a `main`.
6. Si quieres impedir despliegues con CI fallido, configura Deployment Checks en
   Vercel. La integración nativa no espera por sí sola a GitHub Actions.

La vinculación inicial requiere una cuenta Vercel con acceso al repositorio.
El proyecto está preparado para importación. No se crea un proyecto remoto de
Supabase ni un despliegue Vercel sin sus credenciales.

## Validación

```bash
npm run check          # lint, TypeScript, 18 pruebas y build
npx playwright install chromium
npm run test:e2e       # 5 recorridos sobre la build de producción
```

Con Chromium del sistema:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e
```

Los recorridos verifican calendario, filtros, añadir/eliminar/reordenar, series,
repeticiones, persistencia tras recarga, cambios pendientes, móvil, modales y
estados reales de Auth/API. CI conserva traces fallidos durante siete días.
La conexión en vivo a Supabase/ExerciseDB se verifica con una cuenta real después
de configurar los servicios.

## Estructura

```text
src/app/(planner)/       Páginas privadas y layout compartido
src/app/api/             ExerciseDB y rutinas
src/app/auth/callback/   Confirmación y sesión
src/app/login/          Acceso
src/app/register/       Registro
src/components/         UI, calendario, selector y estado
src/lib/supabase/        Clientes SSR/browser y configuración
src/lib/                Validación, catálogo, fechas y persistencia
supabase/migrations/    Tablas, RLS, triggers y transacción
config/                 Plantilla de variables sin secretos
tests/                  Dominio, API y PostgreSQL
e2e/                    Playwright
scripts/                Automatización GitHub
```

Recursos visuales y licencias en [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
