import Link from "next/link";
import { CATEGORIES } from "@/lib/config";
import { CATEGORY_ICONS, IconTodo } from "./icons";

export default function CategoryNav({ current, q }: { current?: string; q?: string }) {
  const qs = (cat?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("cat", cat);
    const s = p.toString();
    return `/catalogo${s ? `?${s}` : ""}`;
  };
  return (
    <nav aria-label="Categorías">
      <ul className="cats">
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c.slug];
          return (
            <li key={c.slug}>
              <Link href={qs(c.slug)} className="cat" aria-current={current === c.slug ? "page" : undefined}>
                <Icon />
                <span>
                  {c.label}
                  <small>{c.hint}</small>
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link href={qs()} className="cat" aria-current={current === "" ? "page" : undefined}>
            <IconTodo />
            <span>
              Ver todo
              <small>Todas las categorías</small>
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
