# pasty-bakery-front

Frontend Next.js 16 / React 19, generado originalmente con v0, ahora self-hosted (NO en Vercel). Consume `lingo-backend`, corre en otra máquina (`dsc-tec18`, backend Go), ver su `CLAUDE.md` para el contrato completo de la API.

## Cómo corre esta máquina (`pasty-front` / `dsc-tec15`)

No había Node instalado — se agregó vía `nvm` (`~/.nvm`, sin sudo). Para correr comandos manualmente:
```
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```
pnpm vive vía corepack (`pnpm -v` ya funciona una vez cargado nvm).

Dos servicios systemd **de usuario** (no de sistema — no hay sudo/linger configurado, así que dependen de que haya una sesión activa; si el usuario cierra sesión del todo podrían no persistir hasta que alguien habilite `loginctl enable-linger shakira` con sudo):
- `~/.config/systemd/user/pasty-front.service` — `next start -H 0.0.0.0 -p 3000`, producción.
- `~/.config/systemd/user/cloudflared-tunnel.service` — túnel Cloudflare dedicado (tunnel `pasty-front`, id `a729a331-...`), expone `https://pastydulc.jblasc.com` → `localhost:3000`. Config en `~/.cloudflared/config.yml`.

Ver logs: `systemctl --user status pasty-front.service` / `journalctl --user -u pasty-front.service` (puede no haber journal persistente en esta máquina).

Tras cambiar código: `pnpm build && systemctl --user restart pasty-front.service`.

## Variables de entorno (`.env.local`, gitignored)

```
NEXT_PUBLIC_API_BASE_URL=https://pastyback.jblasc.com/api
NEXT_PUBLIC_WS_URL=wss://pastyback.jblasc.com/ws
NEXT_PUBLIC_API_KEY=<debe matchear APP_API_KEY del backend>
```
`NEXT_PUBLIC_*` se hornea en el bundle JS en build time — la API key queda visible en el navegador. Es un filtro anti-bot casual, no protección real (decisión consciente, ver `CLAUDE.md` del backend).

## Modelo de datos: Stock y Resource son singleton

El backend maneja un solo Stock y un solo Resource (`GET /stocks/default`, `GET /resources/default`, autocreados si no existen). **No hay selector de "cuál stock"** — la pantalla de Optimizar siempre opera sobre el único que existe.

Importante: crear un `Ingredient` o `Machine` en Configuración **no lo agrega automáticamente** al Stock/Resource del día — hay que además hacer upsert explícito (`apiClient.upsertStockIngredient` / `upsertResourceMachine`) para que aparezca en la pantalla de Optimizar. Si en Configuración se agrega un ingrediente y no aparece en Optimizar, es por esto — falta ese paso.

## Estructura

- `lib/api.ts` — cliente HTTP tipado, todos los métodos devuelven las formas exactas de los modelos Go (`Optimization.results[]` es un array, no un dict — cuidado, versiones viejas de este código asumían dicts y estaban rotas).
- `lib/store.ts` — Zustand, sin auth (no hay `user`/login, se sacó — ver git log si aparece código que lo referencia, es basura vieja).
- `app/optimize/page.tsx` — cargá stock/resource default, permite editar cantidades del día, guarda (upsert) antes de lanzar `/optimize`. WS + polling combinados para status; el resultado final se pide aparte con `getOptimizationStatus` → `getResults(id)` (el backend NO manda el resultado embebido en el mensaje WS).
- `app/config/page.tsx` + `components/config/matrix-editor.tsx` — CRUD de productos/ingredientes/máquinas/recursos operativos + matrices Q (ingrediente), T (máquina), CM (recurso operativo) por producto.
- `app/dashboard/page.tsx`, `app/history/page.tsx` — consumen `Optimization` completo (con `results[]`), no inventes campos que no existen en el modelo del backend.

## Gotchas conocidos

- No hay login/roles — negocio de 2 personas, decisión explícita del dueño. No reintroducir auth sin que lo pidan.
- `next.config.mjs` tiene `ignoreBuildErrors: true` — un `pnpm build` exitoso NO garantiza que TypeScript esté sano. Correr `npx tsc --noEmit` aparte si hay dudas.
- Antes de asumir que un endpoint del backend existe, chequear `cmd/api/main.go` en `lingo-backend` — varios sub-recursos (update/delete de product-machines, product-operational-resources, resource-machines) no existían hasta que se agregaron a propósito; no asumir que el patrón CRUD está completo en todos lados.
