#!/bin/bash
# Banco e API descartáveis para o teste de permissões. Nunca toca no Supabase real.
# Uso: e2e/ambiente.sh subir | e2e/ambiente.sh descer. `subir` grava as variáveis em e2e/.teste.env.
set -euo pipefail
cd "$(dirname "$0")/.."
N=e2e-net

if [ "${1:-}" = "descer" ]; then
  [ -f e2e/.proxy.pid ] && kill "$(cat e2e/.proxy.pid)" 2>/dev/null || true
  docker rm -f e2e-rest e2e-pg >/dev/null 2>&1 || true
  docker network rm "$N" >/dev/null 2>&1 || true
  rm -f e2e/.teste.env e2e/.proxy.pid
  exit 0
fi

docker network create "$N" >/dev/null
docker run -d --name e2e-pg --network "$N" -e POSTGRES_PASSWORD=x postgres:17-alpine >/dev/null
for _ in $(seq 1 60); do
  [ "$(docker exec e2e-pg psql -U postgres -tAc 'select 1' 2>/dev/null)" = 1 ] && break
  sleep 1
done
sleep 2
q() { docker exec -i -e PGOPTIONS="-c client_min_messages=warning" e2e-pg psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }
q -c "create role anon; create role authenticated; create role service_role bypassrls;
  create schema storage; create table storage.buckets(id text primary key, name text, public boolean);
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;"
for f in supabase/migrations/*.sql; do q -f - < "$f" >/dev/null; done

JS=$(openssl rand -hex 32)
jwt() {
  local h p s
  h=$(printf '{"alg":"HS256","typ":"JWT"}' | openssl base64 -A | tr '+/' '-_' | tr -d '=')
  p=$(printf '{"role":"%s","exp":2102397313}' "$1" | openssl base64 -A | tr '+/' '-_' | tr -d '=')
  s=$(printf '%s.%s' "$h" "$p" | openssl dgst -sha256 -hmac "$JS" -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
  printf '%s.%s.%s' "$h" "$p" "$s"
}
docker run -d --name e2e-rest --network "$N" -p 127.0.0.1:8091:3000 \
  -e PGRST_DB_URI=postgres://postgres:x@e2e-pg:5432/postgres -e PGRST_DB_SCHEMAS=public \
  -e PGRST_DB_ANON_ROLE=anon -e "PGRST_JWT_SECRET=$JS" postgrest/postgrest:v12.2.3 >/dev/null

nohup node e2e/proxy.cjs >/dev/null 2>&1 &
echo $! > e2e/.proxy.pid
cat > e2e/.teste.env <<V
export SUPABASE_URL=http://127.0.0.1:8092 VITE_SUPABASE_URL=http://127.0.0.1:8092
export SUPABASE_SERVICE_ROLE_KEY=$(jwt service_role) SUPABASE_PUBLISHABLE_KEY=$(jwt anon) VITE_SUPABASE_PUBLISHABLE_KEY=$(jwt anon)
export DISCORD_SESSION_SECRET=$(openssl rand -hex 32) DISCORD_BOT_TOKEN= DISCORD_WEBHOOK_URL= DISCORD_WEBHOOK_LOG_URL=
export DISCORD_INSTRUTOR_ROLE_IDS=111 DISCORD_ALTO_COMANDO_ROLE_IDS=222 DISCORD_DESENVOLVEDOR_ROLE_IDS=333
V
