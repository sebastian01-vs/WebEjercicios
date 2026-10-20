#!/usr/bin/env bash
set -euo pipefail

# Reuses an existing remote. No tokens or secret values are written to files.
cd "$(dirname "$0")/.."
command -v gh >/dev/null || { echo 'Instala GitHub CLI: https://cli.github.com/'; exit 1; }
if ! gh auth status >/dev/null 2>&1; then
  echo 'GitHub CLI no puede autenticar. Comprueba el acceso de red a api.github.com.'
  echo 'Si falta una sesión, ejecuta: gh auth login --web --scopes repo,admin:repo_hook,workflow'
  exit 1
fi

git rev-parse --git-dir >/dev/null 2>&1 || git init
git branch -M main
if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create gym-routine-planner --private --source=. --remote=origin
fi
repository="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
permission="$(gh repo view --json viewerPermission --jq .viewerPermission)"
if [ "$permission" != ADMIN ]; then
  echo "El usuario actual no tiene permiso ADMIN en $repository. El propietario debe concederlo."
  exit 1
fi

# Verify effective access without changing existing webhooks or workflows.
gh api "repos/$repository" --jq '{repository: .full_name, admin: .permissions.admin, push: .permissions.push}'
gh api "repos/$repository/hooks" --jq '"Acceso a webhooks verificado"'
gh api "repos/$repository/actions/permissions" --jq '{actions_enabled: .enabled}'

if [ "${1:-}" = '--secrets' ]; then
  if [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
    printf '%s' "$NEXT_PUBLIC_SUPABASE_URL" | gh secret set SUPABASE_URL --repo "$repository"
  fi
  if [ -n "${EXERCISE_DB_API_KEY:-}" ]; then
    printf '%s' "$EXERCISE_DB_API_KEY" | gh secret set EXERCISE_DB_API_KEY --repo "$repository"
  fi
  echo 'Solo se han configurado los secretos con valores disponibles en el entorno.'
fi

echo "Repositorio preparado: https://github.com/$repository"
echo 'La conexión de Vercel con GitHub se configura desde Vercel → Add New Project → Import.'
