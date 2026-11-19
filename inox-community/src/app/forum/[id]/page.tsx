import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/media";
import { IconBack, IconVerified } from "@/components/Icons";

async function reply(form: FormData) {
  "use server";
  const threadId = String(form.get("thread_id"));
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/forum/${threadId}`);
  await supabase.from("forum_replies").insert({ thread_id: threadId, author_id: data.user.id, body: String(form.get("body")).trim() });
  revalidatePath(`/forum/${threadId}`);
}

type Author = { username: string; display_name: string; is_verified_customer: boolean } | null;

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase, user } = await getCurrentUser();

  const { data: thread } = await supabase
    .from("forum_threads")
    .select("id, title, body, is_locked, created_at, author:profiles!forum_threads_author_id_fkey(username, display_name, is_verified_customer)")
    .eq("id", id)
    .maybeSingle();
  if (!thread) notFound();
  const { data: replies } = await supabase
    .from("forum_replies")
    .select("id, body, created_at, author:profiles!forum_replies_author_id_fkey(username, display_name, is_verified_customer)")
    .eq("thread_id", id)
    .is("deleted_at", null)
    .order("created_at");

  const name = (a: Author) => (
    <Link href={`/garage/${a?.username}`} style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
      {a?.display_name}{a?.is_verified_customer && <IconVerified />}
    </Link>
  );
  const threadAuthor = thread.author as unknown as Author;

  return (
    <main className="screen">
      <header className="topbar" style={{ justifyContent: "flex-start" }}>
        <Link href="/forum" className="icon-btn" aria-label="Torna al forum"><IconBack /></Link>
        <h1 className="title" style={{ fontSize: 28 }}>{thread.title}</h1>
      </header>
      <div className="stack">
        <article className="auth-card">
          <div className="post-meta" style={{ marginBottom: 8 }}>{name(threadAuthor)}, {timeAgo(thread.created_at)}</div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{thread.body}</p>
        </article>
        {replies?.map((r) => (
          <article key={r.id} className="event" style={{ display: "block" }}>
            <div className="post-meta" style={{ marginBottom: 6 }}>{name(r.author as unknown as Author)}, {timeAgo(r.created_at)}</div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.body}</p>
          </article>
        ))}
        {thread.is_locked ? (
          <p className="notice">Discussione chiusa: non si possono aggiungere risposte.</p>
        ) : user ? (
          <form action={reply} className="form">
            <input type="hidden" name="thread_id" value={thread.id} />
            <label htmlFor="body" className="hint">La tua risposta</label>
            <textarea id="body" name="body" className="textarea" required maxLength={5000} />
            <button className="btn btn-primary">Rispondi</button>
          </form>
        ) : (
          <Link href={`/login?next=/forum/${thread.id}`} className="btn btn-primary">Accedi per rispondere</Link>
        )}
      </div>
    </main>
  );
}
