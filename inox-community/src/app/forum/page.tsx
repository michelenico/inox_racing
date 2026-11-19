import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/media";

export default async function ForumPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const { supabase } = await getCurrentUser();
  const { data: categories } = await supabase.from("forum_categories").select("id, slug, name").order("position");
  const active = categories?.find((c) => c.slug === categoria);

  let query = supabase
    .from("forum_threads")
    .select("id, title, last_activity_at, category:forum_categories(name), author:profiles!forum_threads_author_id_fkey(display_name), replies:forum_replies(count)")
    .is("deleted_at", null)
    .order("last_activity_at", { ascending: false })
    .limit(40);
  if (active) query = query.eq("category_id", active.id);
  const { data: threads } = await query;

  return (
    <main className="screen">
      <header className="topbar">
        <h1 className="title">Forum</h1>
        <Link href={`/forum/nuova${active ? `?categoria=${active.slug}` : ""}`} className="btn btn-primary" style={{ height: 44 }}>Nuova discussione</Link>
      </header>

      <nav className="chips" aria-label="Categorie">
        <Link href="/forum" className="chip" aria-current={!active ? "page" : undefined}>Tutte</Link>
        {categories?.map((c) => (
          <Link key={c.id} href={`/forum?categoria=${c.slug}`} className="chip" aria-current={active?.id === c.id ? "page" : undefined}>{c.name}</Link>
        ))}
      </nav>

      {!threads?.length ? (
        <div className="empty"><h2>Nessuna discussione</h2><p>Apri tu la prima.</p></div>
      ) : (
        <div className="stack">
          {threads.map((t) => {
            const row = t as unknown as {
              id: string; title: string; last_activity_at: string;
              category: { name: string } | null; author: { display_name: string } | null; replies: { count: number }[];
            };
            const n = row.replies?.[0]?.count ?? 0;
            return (
              <Link key={row.id} href={`/forum/${row.id}`} className="event" style={{ display: "block" }}>
                <div className="event-title" style={{ fontSize: 20 }}>{row.title}</div>
                <div className="post-meta" style={{ fontSize: 13, marginTop: 4 }}>
                  {row.category?.name}, di {row.author?.display_name}, {n === 1 ? "1 risposta" : `${n} risposte`}, {timeAgo(row.last_activity_at)}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
