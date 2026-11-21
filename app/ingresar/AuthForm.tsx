"use client";
import Link from "next/link";
import { useActionState } from "react";
import PasswordInput from "@/components/PasswordInput";
import { signIn, signUp, type AuthState } from "./actions";

export default function AuthForm({ mode, next }: { mode: "ingreso" | "registro"; next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "registro" ? signUp : signIn, {});
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.info && <p className="form-ok" role="status">{state.info}</p>}
      {mode === "registro" && (
        <div className="field">
          <label htmlFor="name">Tu nombre o el de tu comparsa</label>
          <input className="input" id="name" name="name" required maxLength={60} autoComplete="organization" />
          <span className="help">Es lo que van a ver los compradores.</span>
        </div>
      )}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <PasswordInput
          id="password"
          name="password"
          minLength={mode === "registro" ? 8 : 1}
          autoComplete={mode === "registro" ? "new-password" : "current-password"}
        />
        {mode === "registro" && <span className="help">Mínimo 8 caracteres.</span>}
        {mode === "ingreso" && (
          <Link href="/recuperar" className="forgot">¿Olvidaste tu contraseña?</Link>
        )}
      </div>
      <button className="btn btn-fucsia" style={{ width: "100%" }} disabled={pending}>
        {pending ? "Un momento…" : mode === "registro" ? "Crear cuenta y armar mi puesto" : "Ingresar"}
      </button>
    </form>
  );
}
