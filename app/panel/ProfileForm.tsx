"use client";
import { useActionState } from "react";
import { updateProfile, type FormState } from "./actions";
import type { Profile } from "@/lib/types";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action}>
      <h2>Tus datos de contacto</h2>
      <p className="sub">Los compradores te escriben a este WhatsApp desde cada publicación.</p>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.ok && <p className="form-ok" role="status">{state.ok}</p>}
      <div className="field">
        <label htmlFor="whatsapp">WhatsApp (obligatorio)</label>
        <input
          className="input" id="whatsapp" name="whatsapp" inputMode="tel" required
          defaultValue={profile.whatsapp ? `+${profile.whatsapp}` : ""} placeholder="351 1234567"
        />
        <span className="help">Con código de área, sin 0 ni 15. Si no es de Argentina, empezá con + y el código de país.</span>
      </div>
      <div className="field">
        <label htmlFor="display_name">Nombre que ven los compradores</label>
        <input className="input" id="display_name" name="display_name" defaultValue={profile.display_name} maxLength={60} required />
      </div>
      <div className="field">
        <label htmlFor="city">Ciudad</label>
        <input className="input" id="city" name="city" defaultValue={profile.city ?? ""} maxLength={60} placeholder="Corrientes" />
      </div>
      <button className="btn btn-fucsia" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Guardando…" : "Guardar datos"}
      </button>
    </form>
  );
}
