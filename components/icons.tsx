import type { SVGProps } from "react";
type P = SVGProps<SVGSVGElement>;
const base = { viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const IconPluma = (p: P) => (
  <svg {...base} {...p}><path d="M10 40 34 12" /><path d="M34 12c6-2 8 2 7 6-3 9-13 16-23 18 4-8 9-16 16-24Z" fill="#e01f84" fillOpacity=".25" /><path d="M22 28l6 2M26 22l7 2M18 33l5 1" /></svg>
);
export const IconGema = (p: P) => (
  <svg {...base} {...p}><path d="M14 10h20l8 10-18 20L6 20l8-10Z" fill="#0e9aa7" fillOpacity=".25" /><path d="M6 20h36M18 10l-4 10 10 20 10-20-4-10" /></svg>
);
export const IconTraje = (p: P) => (
  <svg {...base} {...p}><path d="M17 6c2 4 12 4 14 0l5 6-5 6 6 24H11l6-24-5-6 5-6Z" fill="#7a1fb0" fillOpacity=".25" /><path d="M15 26h18" /></svg>
);
export const IconTocado = (p: P) => (
  <svg {...base} {...p}><path d="M10 34c2-10 7-16 14-16s12 6 14 16Z" fill="#e01f84" fillOpacity=".22" /><path d="M8 34h32" /><path d="M24 18V6M16 20 12 9M32 20l4-11" /><circle cx="24" cy="6" r="2" /><circle cx="12" cy="9" r="2" /><circle cx="36" cy="9" r="2" /><path d="M18 28l2 2 4-4 4 4 2-2" /></svg>
);
export const IconArmazon = (p: P) => (
  <svg {...base} {...p}><path d="M8 40c0-18 7-32 16-32s16 14 16 32" /><path d="M14 40c0-12 4-22 10-22s10 10 10 22" fill="#f5b83d" fillOpacity=".25" /><path d="M24 8v10M12 20l6 4M36 20l-6 4" /></svg>
);
export const IconZapato = (p: P) => (
  <svg {...base} {...p}><path d="M8 18c6 0 10 6 16 10 6 3 14 3 16 8v2H22c-6 0-10-4-12-8l-2-12Z" fill="#e05a3a" fillOpacity=".22" /><path d="M10 30l-1 10" /></svg>
);
export const IconBrillo = (p: P) => (
  <svg {...base} {...p}><path d="M24 6l4 14 14 4-14 4-4 14-4-14-14-4 14-4 4-14Z" fill="#f5b83d" fillOpacity=".3" /></svg>
);
export const IconTodo = (p: P) => (
  <svg {...base} {...p}><rect x="8" y="8" width="13" height="13" rx="3" /><rect x="27" y="8" width="13" height="13" rx="3" /><rect x="8" y="27" width="13" height="13" rx="3" /><rect x="27" y="27" width="13" height="13" rx="3" /></svg>
);
export const IconLupa = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
);
export const IconWhatsapp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden width="22" height="22" {...p}><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.2.3-1 1-1 2.4s1 2.7 1.1 2.9c.1.2 2 3.1 4.9 4.3 1.8.8 2.5.8 3.4.7.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3Z" /></svg>
);

export const CATEGORY_ICONS = {
  plumas: IconPluma,
  piedreria: IconGema,
  trajes: IconTraje,
  tocados: IconTocado,
  armazones: IconArmazon,
  zapatos: IconZapato,
  otros: IconBrillo,
} as const;
export const IconPersona = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden width="22" height="22" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
