"use client";
import { useActionState } from "react";
import PasswordInput from "@/components/PasswordInput";
import { setNewPassword, type NewPasswordState } from "../recuperar/actions";

export default function NewPasswordForm() {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(setNewPassword, {});
  return (
    <form action={action}>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <div className="field">
        <label htmlFor="password">Contraseña nueva</label>
        <PasswordInput id="password" name="password" minLength={8} autoComplete="new-password" />
        <span className="help">Mínimo 8 caracteres.</span>
      </div>
      <div className="field">
        <label htmlFor="repeat">Repetila</label>
        <PasswordInput id="repeat" name="repeat" minLength={8} autoComplete="new-password" />
      </div>
      <button className="btn btn-fucsia" style={{ width: "100%" }} disabled={pending}>
        {pending ? "Guardando…" : "Guardar contraseña nueva"}
      </button>
    </form>
  );
}
