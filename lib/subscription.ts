import type { Profile, SubscriptionState } from "./types";

/** Fecha de hoy (YYYY-MM-DD) en la zona del negocio. Debe coincidir con app_today() en SQL. */
export function todayISO(tz = "America/Argentina/Buenos_Aires") {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}

export function endOfMonthISO(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export function subscriptionState(p: Pick<Profile, "paid_until" | "suspended">): SubscriptionState {
  if (p.suspended) return "suspendido";
  if (!p.paid_until) return "sin_pago";
  return p.paid_until >= todayISO() ? "activo" : "vencido";
}

export function daysLeft(paidUntil: string | null) {
  if (!paidUntil) return 0;
  const a = Date.parse(todayISO() + "T00:00:00Z");
  const b = Date.parse(paidUntil + "T00:00:00Z");
  return Math.round((b - a) / 86_400_000);
}

export const STATE_COPY: Record<SubscriptionState, { label: string; tone: "ok" | "warn" | "bad" }> = {
  activo: { label: "Cuota al día", tone: "ok" },
  vencido: { label: "Cuota vencida", tone: "bad" },
  sin_pago: { label: "Falta el primer pago", tone: "warn" },
  suspendido: { label: "Cuenta suspendida", tone: "bad" },
};
