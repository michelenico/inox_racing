import type { SupabaseClient } from "@supabase/supabase-js";

export type FeedPost = {
  id: string;
  caption: string | null;
  city: string | null;
  created_at: string;
  author: { id: string; username: string; display_name: string; avatar_key: string | null; is_verified_customer: boolean };
  vehicle: { make: string; model: string } | null;
  media: { storage_key: string; kind: "image" | "video"; position: number }[];
  reactions: { emoji: string; total: number }[];
  myReaction: string | null;
  saved: boolean;
  following: boolean;
};

const SELECT =
  "id, caption, city, created_at, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_key, is_verified_customer), vehicle:vehicles(make, model), media:post_media(storage_key, kind, position)";

export async function loadFeed(
  supabase: SupabaseClient,
  userId: string | null,
  opts: { authorId?: string; followingOnly?: boolean; limit?: number } = {},
): Promise<FeedPost[]> {
  let query = supabase.from("posts").select(SELECT).is("deleted_at", null).order("created_at", { ascending: false }).limit(opts.limit ?? 20);

  let followingIds: string[] = [];
  if (userId) {
    const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
    followingIds = (data ?? []).map((r) => r.following_id as string);
  }
  if (opts.authorId) query = query.eq("author_id", opts.authorId);
  if (opts.followingOnly) {
    if (followingIds.length === 0) return [];
    query = query.in("author_id", followingIds);
  }

  const { data: posts, error } = await query;
  if (error) throw new Error(error.message);
  if (!posts?.length) return [];

  const ids = posts.map((p) => p.id as string);
  const [counts, mine, saved] = await Promise.all([
    supabase.from("post_reaction_counts").select("post_id, emoji, total").in("post_id", ids),
    userId ? supabase.from("reactions").select("post_id, emoji").eq("user_id", userId).in("post_id", ids) : Promise.resolve({ data: [] }),
    userId ? supabase.from("saved_posts").select("post_id").eq("user_id", userId).in("post_id", ids) : Promise.resolve({ data: [] }),
  ]);

  return posts.map((p) => {
    const post = p as unknown as Omit<FeedPost, "reactions" | "myReaction" | "saved" | "following">;
    return {
      ...post,
      media: [...(post.media ?? [])].sort((a, b) => a.position - b.position),
      reactions: (counts.data ?? [])
        .filter((c) => c.post_id === post.id)
        .map((c) => ({ emoji: c.emoji as string, total: c.total as number }))
        .sort((a, b) => b.total - a.total),
      myReaction: (mine.data ?? []).find((m: { post_id: string }) => m.post_id === post.id)?.emoji ?? null,
      saved: (saved.data ?? []).some((s: { post_id: string }) => s.post_id === post.id),
      following: followingIds.includes(post.author.id),
    };
  });
}
