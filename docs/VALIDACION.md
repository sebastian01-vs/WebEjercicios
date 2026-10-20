# Validación de la entrega

Implementación de aplicación: commit `d4a5a5a837676d5835aeb4692da1f5d4f459b06e`.
Repositorio: https://github.com/sebastian01-vs/WebEjercicios · rama `main`.

## Comprobaciones ejecutadas

- Lint ESLint: correcto.
- TypeScript: correcto.
- 18 pruebas de dominio, API y PostgreSQL: correctas.
- Build de producción Next.js: correcto.
- 5 recorridos de Playwright en Chromium: correctos.
- Revisión visual de escritorio y móvil: ocho capturas, sin errores de JavaScript.
- Git: commits y push completados; permiso de administrador confirmado.

Las pruebas de PostgreSQL ejecutan la migración con dos identidades y roles no
propietarios. Verifican aislamiento, bloqueo de escritura cruzada, denegación
anónima y rollback de toda la semana ante un error.

Los recorridos de navegador comprueban filtros, añadir/eliminar/reordenar,
series y repeticiones, persistencia después de recargar, cambios sin guardar,
modales y navegación móvil.

Los tests del proveedor usan respuestas controladas. No se ha probado una
conexión en vivo a Supabase o ExerciseDB porque no hay credenciales configuradas.
El workflow está en GitHub; los resultados anteriores corresponden a la ejecución
local, sin confirmación del resultado del runner remoto de Actions.

## Configuración externa pendiente

1. Conectar Supabase, ejecutar la migración y configurar las variables y URLs de Auth.
2. Añadir una API key válida de ExerciseDB/RapidAPI para el catálogo remoto.
3. Importar el repositorio en Vercel y configurar las variables de producción.

No se han creado secretos ficticios ni se ha desplegado en Vercel. La API de
GitHub CLI está bloqueada por la política de red; Git HTTPS permitió los pushes
y el conector de GitHub permitió verificar los permisos de administrador.

[Guía de configuración](../README.md) · [Capturas](VISTA-PREVIA.md)
