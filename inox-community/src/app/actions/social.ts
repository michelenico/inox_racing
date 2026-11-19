"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Accedi per continuare");
  return { supabase, userId: data.user.id };
}

/** Imposta la reazione dell'utente al post. `null` la rimuove. Una sola reazione per post. */
export async function setReaction(postId: string, emoji: string | null) {
  const { supabase, userId } = await requireUser();
  if (emoji === null) {
    await supabase.from("reactions").delete().match({ post_id: postId, user_id: userId });
    return;
  }
  const clean = emoji.trim();
  if (!clean || clean.length > 16) throw new Error("Emoji non valida");
  const { error } = await supabase
    .from("reactions")
    .upsert({ post_id: postId, user_id: userId, emoji: clean, created_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function toggleSave(postId: string, save: boolean) {
  const { supabase, userId } = await requireUser();
  if (save) await supabase.from("saved_posts").upsert({ post_id: postId, user_id: userId });
  else await supabase.from("saved_posts").delete().match({ post_id: postId, user_id: userId });
}

export async function toggleFollow(profileId: string, follow: boolean) {
  const { supabase, userId } = await requireUser();
  if (follow) await supabase.from("follows").upsert({ follower_id: userId, following_id: profileId });
  else await supabase.from("follows").delete().match({ follower_id: userId, following_id: profileId });
  revalidatePath("/garage/[username]", "page");
}

export async function toggleAttendance(eventId: string, attend: boolean) {
  const { supabase, userId } = await requireUser();
  if (attend) await supabase.from("event_attendees").upsert({ event_id: eventId, user_id: userId });
  else await supabase.from("event_attendees").delete().match({ event_id: eventId, user_id: userId });
  revalidatePath("/raduni");
}
