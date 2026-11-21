"use client";
import { useFormStatus } from "react-dom";

/** Botón de formulario que pide confirmación antes de enviar. */
export default function ConfirmButton({
  message,
  className,
  children,
  pendingLabel,
  ariaLabel,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
  pendingLabel?: string;
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      disabled={pending}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? pendingLabel ?? "Un momento…" : children}
    </button>
  );
}
