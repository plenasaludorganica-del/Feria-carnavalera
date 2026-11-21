"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { sendFeedback, type FeedbackState } from "@/app/feedback-actions";

/** Botón al costado + ventanita para dejar una opinión anónima con estrellas. */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, action, pending] = useActionState<FeedbackState, FormData>(sendFeedback, {});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState("");
  useEffect(() => setPage(window.location.pathname), []);

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
        <span>¿Qué le falta a la feria?</span>
      </button>

      <dialog ref={dialogRef} className="fb-dialog" onClose={() => setOpen(false)} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        {state.ok ? (
          <div className="fb-body">
            <h2>¡Gracias!</h2>
            <p>Tu opinión nos llegó. La leemos para mejorar la feria.</p>
            <button type="button" className="btn btn-fucsia" onClick={() => setOpen(false)}>Cerrar</button>
          </div>
        ) : (
          <form action={action} className="fb-body">
            <button type="button" className="fb-close" aria-label="Cerrar" onClick={() => setOpen(false)}>×</button>
            <h2>Ayudanos a mejorar la feria</h2>
            <p className="fb-sub">Es anónimo: no guardamos quién lo manda y no se publica.</p>

            <fieldset className="fb-stars" onMouseLeave={() => setHover(0)}>
              <legend>¿Qué te parece la página?</legend>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                  aria-pressed={rating === n}
                  className={n <= shown ? "on" : ""}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                >★</button>
              ))}
              <span className="fb-label">{labels[shown]}</span>
            </fieldset>
            <input type="hidden" name="rating" value={rating || ""} />
            <input type="hidden" name="page" value={page} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />

            <div className="field">
              <label htmlFor="fb-msg">¿Qué te gustaría encontrar o qué le falta?</label>
              <textarea id="fb-msg" name="message" className="textarea" maxLength={1500}
                placeholder="Ej.: filtrar por talle, ver vendedores de mi ciudad, una página como tal otra…" />
            </div>
            {state.error && <p className="form-error" role="alert">{state.error}</p>}
            <button className="btn btn-fucsia" style={{ width: "100%" }} disabled={pending}>
              {pending ? "Enviando…" : "Enviar opinión"}
            </button>
          </form>
        )}
      </dialog>
    </>
  );
}
