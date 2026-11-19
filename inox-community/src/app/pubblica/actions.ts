"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPost(input: {
  caption: string;
  city: string;
  vehicleId: string | null;
  media: { key: string; width: number; height: number }[];
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if (input.media.length === 0 || input.media.length > 10) throw new Error("Aggiungi da 1 a 10 foto");
  // Accetta solo chiavi caricate da questo utente tramite /api/upload.
  if (input.media.some((m) => !m.key.startsWith(`posts/${data.user!.id}/`))) throw new Error("File non valido");

  const { data: post, error } = await supabase
    .from("posts")
    .insert({ author_id: data.user.id, caption: input.caption.trim() || null, city: input.city.trim() || null, vehicle_id: input.vehicleId })
    .select("id")
    .single();
  if (error || !post) throw new Error("Pubblicazione non riuscita");

  await supabase.from("post_media").insert(
    input.media.map((m, i) => ({ post_id: post.id, kind: "image", storage_key: m.key, width: m.width, height: m.height, position: i })),
  );
  return { ok: true };
}
