"use client";
import { useEffect, useState } from "react";
import { IconWhatsapp } from "./icons";

const MESSAGE =
  "Feria del Comparsero: plumas, piedrería, trajes, armazones y zapatos de comparsa usados, todo en un solo lugar y con contacto directo por WhatsApp. Si vendés o buscás algo para el carnaval, entrá:";

/** Botones para compartir la Feria (menú nativo del celular, WhatsApp o copiar enlace). */
export default function ShareFeria({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.origin);
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const full = `${MESSAGE} ${url}`;

  async function share() {
    try {
      await navigator.share({ title: "Feria del Comparsero", text: MESSAGE, url });
    } catch {
      /* la persona cerró el menú: no pasa nada */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copiá este mensaje:", full);
    }
  }

  return (
    <div className={`share share-${tone}`}>
      {canShare && (
        <button type="button" className="btn btn-oro" onClick={share}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
          </svg>
          Compartir la Feria
        </button>
      )}
      <a
        className="btn btn-whatsapp share-wa"
        href={`https://wa.me/?text=${encodeURIComponent(full)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconWhatsapp /> Mandar por WhatsApp
      </a>
      <button type="button" className={`btn ${tone === "light" ? "btn-ghost" : "btn-claro"}`} onClick={copy} aria-live="polite">
        {copied ? "¡Enlace copiado!" : "Copiar enlace"}
      </button>
    </div>
  );
}
