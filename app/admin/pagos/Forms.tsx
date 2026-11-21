"use client";
import { useActionState } from "react";
import PasswordInput from "@/components/PasswordInput";
import { saveToken, savePrice, saveWebhookSecret, testConnection, type PagosState } from "./actions";

function Msg({ s }: { s: PagosState }) {
  if (s.error) return <p className="form-error" role="alert">{s.error}</p>;
  if (s.ok) return <p className="form-ok" role="status">{s.ok}</p>;
  return null;
}

export function TokenForm({ configured, last4 }: { configured: boolean; last4: string | null }) {
  const [s, action, pending] = useActionState<PagosState, FormData>(saveToken, {});
  return (
    <form action={action} className="paper">
      <h2>Token de Mercado Pago</h2>
      <p className="sub">
        {configured ? `Cargado ✓ (termina en …${last4}). Para cambiarlo, pegá uno nuevo.` : "Pegalo acá una sola vez. Queda guardado cifrado y nadie lo puede ver."}
      </p>
      <Msg s={s} />
      <div className="field">
        <label htmlFor="token">Access Token de producción</label>
        <PasswordInput id="token" name="token" autoComplete="off" />
        <span className="help">Mercado Pago → Tus integraciones → tu aplicación → Credenciales de producción → Access Token. Empieza con APP_USR-.</span>
      </div>
      <button className="btn btn-oro" disabled={pending}>{pending ? "Guardando y probando…" : "Guardar token"}</button>
    </form>
  );
}

export function PriceForm({ current }: { current: number | null }) {
  const [s, action, pending] = useActionState<PagosState, FormData>(savePrice, {});
  return (
    <form action={action} className="paper">
      <h2>Precio de la cuota mensual</h2>
      <p className="sub">{current ? `Ahora: $ ${current.toLocaleString("es-AR")} por mes.` : "Todavía no definiste el precio."}</p>
      <Msg s={s} />
      <div className="field">
        <label htmlFor="price">Precio en pesos</label>
        <input className="input" id="price" name="price" inputMode="numeric" placeholder="5000" defaultValue={current ?? ""} required />
        <span className="help">Si cambiás el precio, también se actualiza en los débitos automáticos activos.</span>
      </div>
      <button className="btn btn-oro" disabled={pending}>{pending ? "Guardando…" : "Guardar precio"}</button>
    </form>
  );
}

export function WebhookForm({ configured, url }: { configured: boolean; url: string }) {
  const [s, action, pending] = useActionState<PagosState, FormData>(saveWebhookSecret, {});
  return (
    <form action={action} className="paper">
      <h2>Aviso automático de pagos (opcional, recomendado)</h2>
      <p className="sub">
        Con esto, las renovaciones de cada mes se acreditan al instante. Sin esto, se acreditan cuando el vendedor entra a su panel.
      </p>
      <ol className="pay-list" style={{ marginTop: 0 }}>
        <li>En Mercado Pago → tu aplicación → <strong>Webhooks</strong> → Configurar notificaciones → <strong>Modo productivo</strong>.</li>
        <li>URL: <code style={{ wordBreak: "break-all" }}>{url}</code></li>
        <li>Eventos: <strong>Pagos</strong>, <strong>Planes y suscripciones</strong> y <strong>Pagos recurrentes</strong>. Guardar.</li>
        <li>Copiá la <strong>clave secreta</strong> que aparece y pegala acá abajo.</li>
      </ol>
      <Msg s={s} />
      <div className="field">
        <label htmlFor="secret">Clave secreta del webhook {configured && "(cargada ✓)"}</label>
        <PasswordInput id="secret" name="secret" autoComplete="off" />
      </div>
      <button className="btn btn-ghost" disabled={pending}>{pending ? "Guardando…" : "Guardar clave"}</button>
    </form>
  );
}

export function TestButton() {
  const [s, action, pending] = useActionState<PagosState, FormData>(testConnection, {});
  return (
    <form action={action}>
      <Msg s={s} />
      <button className="btn btn-claro" disabled={pending}>{pending ? "Probando…" : "Probar conexión con Mercado Pago"}</button>
    </form>
  );
}
