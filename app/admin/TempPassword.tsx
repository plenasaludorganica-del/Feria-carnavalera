"use client";
import { useActionState, useState } from "react";
import { makeTempPassword, type TempPasswordState } from "./actions";

/** Da una contraseña temporal a un vendedor que no puede entrar. */
export default function TempPassword({ id, name, whatsapp }: { id: string; name: string; whatsapp: string | null }) {
  const [state, action, pending] = useActionState<TempPasswordState, FormData>(makeTempPassword, {});
  const [copied, setCopied] = useState(false);

  if (state.password) {
    const msg = `Hola ${name}, tu contraseña temporal de la Feria del Comparsero es: ${state.password}\nEntrá y cambiala desde "¿Olvidaste tu contraseña?" cuando quieras.`;
    return (
      <div className="temp-pw">
        <code>{state.password}</code>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => navigator.clipboard.writeText(state.password!).then(() => setCopied(true))}
        >
          {copied ? "Copiada" : "Copiar"}
        </button>
        {whatsapp && (
          <a className="btn btn-sm btn-vendido" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer">
            Enviar por WhatsApp
          </a>
        )}
      </div>
    );
  }
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`¿Darle una contraseña temporal a ${name}? La contraseña actual deja de funcionar.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-ghost btn-sm" disabled={pending}>{pending ? "Generando…" : "Contraseña temporal"}</button>
      {state.error && <small style={{ color: "var(--bad)" }}>{state.error}</small>}
    </form>
  );
}
