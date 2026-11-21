"use client";
import { useActionState, useRef, useState } from "react";
import { CATEGORIES, CONDITIONS, thumbUrl } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import type { OwnProduct } from "@/lib/types";
import { saveProduct, type FormState } from "./actions";

const MAX_PHOTOS = 8;

/** Achica la foto en el navegador (WebP) antes de subirla: menos datos, carga más rápida. */
async function compress(file: File, max: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo procesar"))), "image/webp", 0.82));
}

export default function ProductForm({ userId, product }: { userId: string; product?: OwnProduct }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError("");
    const supabase = createClient();
    const list = Array.from(files).slice(0, MAX_PHOTOS - images.length);
    setUploading(list.length);
    for (const f of list) {
      try {
        const [full, thumb] = await Promise.all([compress(f, 1600), compress(f, 480)]);
        const id = crypto.randomUUID();
        const path = `${userId}/${id}.webp`;
        const opts = { contentType: "image/webp", cacheControl: "31536000" };
        const { error } = await supabase.storage.from("product-images").upload(path, full, opts);
        if (error) throw error;
        await supabase.storage.from("product-images").upload(`${userId}/${id}_t.webp`, thumb, opts);
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        setImages((prev) => [...prev, data.publicUrl]);
      } catch {
        setUploadError(`No se pudo subir “${f.name}”. Probá con una foto JPG o PNG.`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <form action={action} className="paper">
      <h1 style={{ margin: "0 0 4px", fontSize: "1.4rem" }}>{product ? "Editar publicación" : "Nueva publicación"}</h1>
      <p className="sub">Fotos con buena luz y fondo liso se venden más rápido.</p>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="field">
        <span style={{ fontWeight: 700 }}>Fotos ({images.length}/{MAX_PHOTOS})</span>
        <div className="photos">
          {images.map((src, i) => (
            <div className="photo" key={src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl(src)} alt={`Foto ${i + 1}${i === 0 ? " (portada)" : ""}`} />
              <button type="button" aria-label={`Quitar foto ${i + 1}`} onClick={() => setImages((p) => p.filter((x) => x !== src))}>×</button>
            </div>
          ))}
          {images.length < MAX_PHOTOS && (
            <label className="photo-add">
              {uploading ? `Subiendo ${uploading}…` : "Agregar fotos"}
              <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            </label>
          )}
        </div>
        <span className="help">La primera foto es la portada del producto.</span>
        {uploadError && <p className="form-error">{uploadError}</p>}
      </div>

      <div className="field">
        <label htmlFor="title">Título</label>
        <input className="input" id="title" name="title" required minLength={3} maxLength={90} defaultValue={product?.title}
          placeholder="Ej.: Espaldar de plumas de faisán, 1,20 m" />
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="price">Precio (ARS)</label>
          <input className="input" id="price" name="price" inputMode="numeric" required defaultValue={product?.price} placeholder="45000" />
        </div>
        <div className="field">
          <label htmlFor="category">Categoría</label>
          <select className="select" id="category" name="category" required defaultValue={product?.category ?? ""}>
            <option value="" disabled>Elegí una</option>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="condition">Estado</label>
        <select className="select" id="condition" name="condition" defaultValue={product?.condition ?? "usado"}>
          {Object.entries(CONDITIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="description">Descripción</label>
        <textarea className="textarea" id="description" name="description" maxLength={3000} defaultValue={product?.description}
          placeholder="Medidas, cantidad, en cuántos carnavales se usó, detalles a tener en cuenta, si hacés envíos…" />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-oro" disabled={pending || uploading > 0}>
          {pending ? "Guardando…" : product ? "Guardar cambios" : "Publicar"}
        </button>
        <a href="/panel" className="btn btn-ghost">Cancelar</a>
      </div>
    </form>
  );
}
