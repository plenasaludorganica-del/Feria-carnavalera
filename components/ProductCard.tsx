import Image from "next/image";
import Link from "next/link";
import { categoryLabel, formatPrice, thumbUrl } from "@/lib/config";
import type { CatalogItem } from "@/lib/types";
import { IconBrillo } from "./icons";

export default function ProductCard({ item, priority = false }: { item: CatalogItem; priority?: boolean }) {
  return (
    <Link href={`/producto/${item.id}`} className="tag">
      <div className="tag-photo">
        {item.cover ? (
          <Image
            src={thumbUrl(item.cover)}
            alt=""
            fill
            sizes="(max-width: 520px) 50vw, (max-width: 1000px) 33vw, 240px"
            priority={priority}
          />
        ) : (
          <div className="tag-photo-empty"><IconBrillo /></div>
        )}
      </div>
      <div className="tag-body">
        <span className="tag-price">{formatPrice(Number(item.price), item.currency)}</span>
        <h3 className="tag-title">{item.title}</h3>
        <div className="tag-meta">
          <span className="chip" data-cat={item.category}>{categoryLabel(item.category)}</span>
          {item.city && <span>{item.city}</span>}
        </div>
      </div>
    </Link>
  );
}
