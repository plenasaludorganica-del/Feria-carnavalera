"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { sendFeedback, type FeedbackState } from "@/app/feedback-actions";

type Kind = "problema" | "opinion";

/**
 * Botón "Ayuda" en todas las páginas. Todo lo que se manda llega solo al
 * panel de administración (Admin → Opiniones). No se usa WhatsApp.
 */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("opinion");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, action, pending] = useActionState<FeedbackState, FormData>(sendFeedback, {});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState("");
  useEffect(() => setPage(window.location.pathname), []);
  // Cualquier elemento con data-open-feedback (ej. "Ayuda" del pie) abre la ventanita
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-open-feedback]")) setOpen(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const shown = hover || rating;
  const labels = ["", "Le falta mucho", "Le faltan cosas", "Está bien", "Muy buena", "¡Me encanta!"];

  return (
    <>
      <button type="button" className="fb-tab" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z" /></svg>
        <span className="fb-tab-long">Ayuda y opiniones</span>
        <span className="fb-tab-short">Ayuda</span>
      </button>

      <dialog ref={dialogRef} className="fb-dialog" onClose={() => setOpen(false)} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        {state.ok ? (
          <div className="fb-body">
            <h2>¡Gracias!</h2>
            <p>{kind === "problema" ? "Recibimos tu mensaje. Si dejaste un contacto, te respondemos." : "Tu opinión nos llegó. La leemos para mejorar la feria."}</p>
            <button type="button" className="btn btn-fucsia" onClick={() => setOpen(false)}>Cerrar</button>
          </div>
        ) : (
          <form action={action} className="fb-body">
            <button type="button" className="fb-close" aria-label="Cerrar" onClick={() => setOpen(false)}>×</button>
            <h2>¿En qué te ayudamos?</h2>

            <div className="fb-kinds" role="radiogroup" aria-label="Tipo de mensaje">
              <button type="button" role="radio" aria-checked={kind === "problema"} onClick={() => setKind("problema")}>Tengo un problema</button>
              <button type="button" role="radio" aria-checked={kind === "opinion"} onClick={() => setKind("opinion")}>Quiero dejar una opinión</button>
            </div>
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="page" value={page} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />

            {kind === "opinion" ? (
              <>
                <p className="fb-sub">Es anónimo: no guardamos quién lo manda y no se publica.</p>
                <fieldset className="fb-stars" onMouseLeave={() => setHover(0)}>
                  <legend>¿Qué te parece la página?</legend>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`} aria-pressed={rating === n}
                      className={n <= shown ? "on" : ""} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}>★</button>
                  ))}
                  <span className="fb-label">{labels[shown]}</span>
                </fieldset>
                <input type="hidden" name="rating" value={rating || ""} />
                <div className="field">
                  <label htmlFor="fb-msg">¿Qué te gustaría encontrar o qué le falta?</label>
                  <textarea id="fb-msg" name="message" className="textarea" maxLength={1500}
                    placeholder="Ej.: filtrar por talle, ver vendedores de mi ciudad…" />
                </div>
              </>
            ) : (
              <>
                <p className="fb-sub">Llega solo a la administración de la feria.</p>
                <div className="field">
                  <label htmlFor="fb-msg">¿Qué pasó?</label>
                  <textarea id="fb-msg" name="message" className="textarea" maxLength={1500} required
                    placeholder="Ej.: no puedo subir fotos, no me llegó el email, el pago no se acreditó…" />
                </div>
                <div className="field">
                  <label htmlFor="fb-contact">Tu email para responderte (opcional)</label>
                  <input id="fb-contact" name="contact" type="email" className="input" maxLength={120} autoComplete="email" />
                </div>
              </>
            )}
            {state.error && <p className="form-error" role="alert">{state.error}</p>}
            <button className="btn btn-fucsia" style={{ width: "100%" }} disabled={pending}>
              {pending ? "Enviando…" : kind === "problema" ? "Enviar mensaje" : "Enviar opinión"}
            </button>
          </form>
        )}
      </dialog>
    </>
  );
}
