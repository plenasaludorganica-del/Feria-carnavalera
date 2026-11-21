"use client";
import { useActionState } from "react";
import { requestReset, type ResetState } from "./actions";

export default function ResetForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestReset, {});
  if (state.sent)
    return (
      <div role="status">
        <p className="form-ok">Si ese email tiene cuenta, te mandamos un enlace para elegir una contraseña nueva.</p>
        <p className="sub">Abrilo desde este mismo celular o computadora. Revisá también la carpeta de spam.</p>
        <p className="sub">
          ¿No te llegó en unos minutos? Tocá <button type="button" className="linklike" data-open-feedback>Ayuda</button>,
          elegí “Tengo un problema” y dejanos tu email: te damos una contraseña temporal.
        </p>
      </div>
    );
  return (
    <form action={action}>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <div className="field">
        <label htmlFor="email">Email de tu cuenta</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <button className="btn btn-fucsia" style={{ width: "100%" }} disabled={pending}>
        {pending ? "Enviando…" : "Mandarme el enlace"}
      </button>
    </form>
  );
}
