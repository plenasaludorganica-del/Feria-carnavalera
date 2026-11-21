"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isCategory, normalizeWhatsapp } from "@/lib/config";
import { requireUser } from "@/lib/session";

export type FormState = { error?: string; ok?: string };

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser("/panel");
  const whatsapp = normalizeWhatsapp(String(form.get("whatsapp") ?? ""));
  if (!/^[0-9]{10,15}$/.test(whatsapp))
    return { error: "Revisá el número: escribilo con código de área, por ejemplo 351 1234567." };
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: String(form.get("display_name") ?? "").trim().slice(0, 60),
      city: String(form.get("city") ?? "").trim().slice(0, 60) || null,
      whatsapp,
    })
    .eq("id", user.id);
  if (error) return { error: "No se pudieron guardar los datos. Intentá de nuevo." };
  revalidatePath("/panel");
  return { ok: `Guardado. Los compradores te van a escribir al +${whatsapp}.` };
}

export async function saveProduct(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser("/panel");
  const id = String(form.get("id") ?? "");
  const category = String(form.get("category") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const price = Number(String(form.get("price") ?? "").replace(/\./g, "").replace(",", "."));
  let images: string[] = [];
  try { images = JSON.parse(String(form.get("images") ?? "[]")); } catch {}

  if (title.length < 3) return { error: "Poné un título de al menos 3 letras." };
  if (!Number.isFinite(price) || price < 0) return { error: "Escribí el precio solo con números." };
  if (!isCategory(category)) return { error: "Elegí una categoría." };
  if (!images.length) return { error: "Subí al menos una foto: es lo primero que miran los compradores." };

  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${user.id}/`;
  images = images.filter((u) => typeof u === "string" && u.startsWith(prefix)).slice(0, 8);

  const row = {
    title: title.slice(0, 90),
    description: String(form.get("description") ?? "").trim().slice(0, 3000),
    price,
    category,
    condition: String(form.get("condition") ?? "usado"),
    images,
  };

  const { error } = id
    ? await supabase.from("products").update(row).eq("id", id).eq("seller_id", user.id)
    : await supabase.from("products").insert({ ...row, seller_id: user.id });
  if (error) {
    console.error(error);
    return { error: "No se pudo guardar. Revisá que tengas tu WhatsApp cargado y la cuota al día." };
  }
  revalidatePath("/panel");
  revalidatePath("/");
  redirect("/panel?guardado=1");
}

export async function setProductStatus(form: FormData) {
  const { supabase, user } = await requireUser("/panel");
  const status = form.get("status") === "paused" ? "paused" : "active";
  await supabase.from("products").update({ status }).eq("id", String(form.get("id"))).eq("seller_id", user.id);
  revalidatePath("/panel");
  revalidatePath("/");
}

export async function deleteProduct(form: FormData) {
  const { supabase, user } = await requireUser("/panel");
  const id = String(form.get("id"));
  const { data } = await supabase.from("products").select("images").eq("id", id).eq("seller_id", user.id).single();
  await supabase.from("products").delete().eq("id", id).eq("seller_id", user.id);
  const paths = (data?.images ?? [])
    .map((u: string) => u.split("/product-images/")[1])
    .filter((p: string | undefined): p is string => Boolean(p?.startsWith(user.id + "/")));
  if (paths.length) await supabase.storage.from("product-images").remove(paths);
  revalidatePath("/panel");
  revalidatePath("/");
}
