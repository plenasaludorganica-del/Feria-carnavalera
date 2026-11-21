"use client";
import Image from "next/image";
import { useState } from "react";
import { IconBrillo } from "./icons";

export default function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (!images.length)
    return (
      <div className="gallery-main" style={{ display: "grid", placeItems: "center", color: "#b7aec6" }}>
        <IconBrillo width={72} height={72} />
      </div>
    );
  return (
    <div>
      <div className="gallery-main">
        <Image src={images[i]} alt={`${title}, foto ${i + 1} de ${images.length}`} fill sizes="(max-width: 860px) 100vw, 640px" priority />
      </div>
      {images.length > 1 && (
        <div className="thumbs" role="group" aria-label="Fotos">
          {images.map((src, idx) => (
            <button key={src} type="button" aria-pressed={idx === i} aria-label={`Ver foto ${idx + 1}`} onClick={() => setI(idx)}>
              <Image src={src} alt="" width={72} height={72} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
