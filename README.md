# Feria del Comparsero

Marketplace de insumos usados de comparsa (plumas, piedrería, trajes, armazones, zapatos y otros).
Los vendedores pagan una cuota mensual por Mercado Pago y los compradores los contactan por WhatsApp.

## Arquitectura

```
Navegador ──► Next.js 15 (App Router, en Cloudflare Workers vía OpenNext)
               ├─ Páginas públicas (catálogo, producto) ──► Supabase RPC search_catalog / get_catalog_product
               ├─ /ingresar ───────────────────────────────► Supabase Auth (email + contraseña)
               ├─ /suscripcion ─► /api/mp/checkout ────────► Mercado Pago Checkout Pro
               │                    Mercado Pago ──aviso──► /api/mp/webhook ─► register_payment() (service role)
               ├─ /panel (vendedor) ───────────────────────► tablas profiles / products (RLS) + Storage
               └─ /admin ──────────────────────────────────► RPC admin_* (solo role = admin)
```

| Capa | Qué hace | Dónde |
|---|---|---|
| Base de datos | Perfiles, productos, pagos, reglas de visibilidad, RLS | `supabase/migrations/0001…0004` (aplicadas en el proyecto `feria-carnavalera`) |
| Clientes Supabase | Navegador, servidor (con sesión) y service role (solo webhook) | `lib/supabase/*` |
| Sesión y protección | Refresca sesión y protege `/panel`, `/admin`, `/suscripcion` | `middleware.ts`, `lib/session.ts` |
| Mercado Pago | Preferencia de pago, lectura del pago, firma del webhook | `lib/mercadopago.ts`, `app/api/mp/*` |
| Diseño | Tokens, portada con capas, tarjetas blancas | `app/globals.css`, `components/*` |

### Regla de vencimiento (último día de cada mes)

Cada perfil tiene `paid_until`, el último día del mes ya pagado. **El estado se calcula, no se guarda.**
Un vendedor está activo cuando cumple `not suspended and paid_until >= hoy`.

- El 1° del mes, quien no pagó deja de cumplir la condición. Sus productos desaparecen del catálogo sin que corra ningún proceso, y **no se borran**.
- Al entrar a `/panel` con la cuota vencida, se lo manda a `/suscripcion`, que muestra el aviso y el botón para pagar.
- Cuando Mercado Pago confirma el pago, `register_payment()` calcula el nuevo `paid_until`:
  - si estaba al día, suma el mes siguiente;
  - si estaba vencido o es nuevo, cubre hasta el fin del mes actual.
  
  Los productos vuelven a verse tal como estaban.
- `register_payment()` es idempotente: si Mercado Pago avisa dos veces, el pago se cuenta una sola vez.

La zona horaria del negocio está en `app_today()` (SQL) y en `todayISO()` (`lib/subscription.ts`).
Está configurada para Argentina (Buenos Aires).

## Puesta en marcha

### 1. Supabase
1. Creá un proyecto nuevo, por ejemplo "feria-del-comparsero".
2. En **SQL Editor**, pegá y ejecutá `supabase/migrations/0001_feria_init.sql`. Crea las tablas, la RLS, las funciones y el bucket `product-images`.
3. En **Authentication → URL Configuration**:
   - Site URL: tu dominio.
   - Redirect URLs: agregá `https://TU-DOMINIO/auth/callback`.
4. Registrate en la web y hacete admin:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'TU_EMAIL');
   ```

### Emails de registro (importante)
El servicio de email que trae Supabase de fábrica **solo manda emails a los miembros de tu equipo de Supabase**, con un límite de pocos por hora. Los vendedores nunca recibirían el email de confirmación.
- **Para arrancar:** desactivá *Authentication → Sign In / Providers → Email → Confirm email*. El vendedor entra directo al pago al registrarse.
- **Más adelante:** configurá un servicio de email propio (por ejemplo Resend, con plan gratis) en *Authentication → Emails → SMTP Settings*. Con eso podés volver a activar la confirmación y sumar "Olvidé mi contraseña".

### 2. Variables de entorno
Copiá `.env.example` a `.env.local` y completalo. En Cloudflare se cargan como se explica en "Publicar en Cloudflare".

### 3. Mercado Pago
1. En [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app), creá una aplicación de tipo **Checkout Pro**.
2. Copiá el Access Token a `MP_ACCESS_TOKEN`. Usá uno `TEST-...` para probar: el sistema usa el checkout de prueba automáticamente.
3. En **Webhooks**, cargá la URL `https://TU-DOMINIO/api/mp/webhook` con los eventos **Pagos**, **Planes y suscripciones** y **Pagos recurrentes**. Copiá la clave secreta a `MP_WEBHOOK_SECRET`.

### Configurar pagos sin tocar Cloudflare
En **Admin → Pagos y precio** se cargan el token de Mercado Pago y la clave del webhook. Quedan cifrados en Supabase Vault y solo el servidor puede leerlos. Ahí también se define el precio de la cuota y hay un botón **Probar conexión**.

La Feria también **consulta a Mercado Pago** cuando el vendedor vuelve del pago y cuando entra a su panel. Por eso las cuentas se activan aunque el webhook no esté configurado; con el webhook, las renovaciones se acreditan al instante.

### Débito automático
- El botón principal crea una suscripción de Mercado Pago (`/preapproval`) con cobro el **día 1 de cada mes**. El primer cobro es proporcional a los días que quedan del mes.
- Cada cobro llega al webhook como "Pagos recurrentes" y extiende `paid_until` hasta el fin de mes.
- Con el débito activo hay **3 días de gracia** después del vencimiento. Mercado Pago puede tardar o reintentar el cobro del día 1, y así el vendedor no desaparece del catálogo por unas horas. Sin débito, la gracia es 0.
- El vendedor puede darlo de baja desde su panel. También existe la opción "pagar solo este mes" (Checkout Pro).
- Para cambiar el precio a quienes ya están suscriptos: `updatePreapprovalAmount()` en `lib/mercadopago.ts`.
4. Definí la cuota en `MP_MONTHLY_PRICE`.

> Para probar el webhook en local hace falta una URL pública (por ejemplo `ngrok http 3000`), puesta en `NEXT_PUBLIC_SITE_URL`.

### 4. Correr
```bash
npm install
npm run dev
```
Sin las claves de Supabase el sitio muestra **productos de muestra** (`lib/demo.ts`), para revisar el diseño.

## Publicar en Cloudflare

El sitio corre en **Cloudflare Workers** con el adaptador OpenNext (`wrangler.jsonc`, `open-next.config.ts`).

1. En Cloudflare, entrá a **Workers & Pages → Create → Import a repository** y elegí `feria-carnavalera`.
2. Configurá el build:
   - **Build command**: `npm run build`. Arma la versión para Cloudflare.
   - **Deploy command**: `npx opennextjs-cloudflare deploy`. También sirve `npx wrangler deploy`.
3. Cargá las **variables de build** (Build → Variables). Las `NEXT_PUBLIC_*` se incrustan al compilar:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_BRAND_WORDMARK`
4. Cargá las **variables y secretos de ejecución** (Settings → Variables and Secrets):
   - como *Secret*: `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`;
   - como texto: `MP_MONTHLY_PRICE`, `MP_CURRENCY`.
5. Cada push a la rama principal se publica solo.

Para probar en local, como lo ejecuta Cloudflare: `npm run preview`.

**Planes de Cloudflare:**
- El gratis alcanza para probar: 100.000 visitas por día, con un límite de CPU por visita.
- Para producción conviene **Workers Paid (US$ 5/mes)**. Saca ese límite y evita cortes en páginas pesadas.

**Fotos:** cada foto se sube en dos tamaños, 1600 px y una miniatura de 480 px (`_t.webp`). El catálogo usa las miniaturas, así que no hace falta el optimizador de imágenes pago.

## Piezas de Higgsfield

| Pieza | Dónde va |
|---|---|
| Logotipo / letras "Feria del Comparsero" | `public/brand/…` + `NEXT_PUBLIC_BRAND_WORDMARK=/brand/archivo.png`. Hasta entonces se ve una versión provisoria (`components/BrandWordmark.tsx`). |
| Fondo de la portada | `public/brand/fondo-plumas-brillos.webp` |
| Figuras laterales | `public/brand/comparsera.webp`, `comparsero.webp` |
| Textura del catálogo | `public/brand/plumas.webp` |
| Banda "¿Te quedaron plumas…?" | `public/brand/coronas-piedreria.webp` |

Para optimizar nuevas imágenes (WebP liviano): `node scripts/optimize-images.mjs carpeta-con-jpgs`.

## Rendimiento

- **Lluvia de brillos**: un solo `<canvas>` con sprites pre-dibujados. Menos partículas en el celular, resolución limitada a 1,5x. Se pausa fuera de pantalla o con la pestaña oculta.
- **Parallax**: un único listener de scroll con `requestAnimationFrame` que escribe una variable CSS usada en `translate3d` (GPU). La inclinación 3D con el mouse solo se activa en computadoras.
- **Sensación de flotar**: la portada queda fija (`position: sticky`) y el catálogo sube por encima como un telón, sin costo de JavaScript.
- **Reducir movimiento**: con "reducir movimiento" activado en el sistema, se apaga todo y queda un cuadro estático.
- **Fotos de productos**: se achican a WebP de 1600 px en el navegador antes de subirse a Storage y se sirven con `next/image`.
