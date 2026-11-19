import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function createThread(form: FormData) {
  "use server";
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/forum/nuova");
  const { data: thread, error } = await supabase
    .from("forum_threads")
    .insert({
      author_id: data.user.id,
      category_id: Number(form.get("category")),
      title: String(form.get("title")).trim(),
      body: String(form.get("body")).trim(),
    })
    .select("id")
    .single();
  if (error || !thread) redirect("/forum");
  redirect(`/forum/${thread.id}`);
}

export default async function NewThreadPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login?next=/forum/nuova");
  const { data: categories } = await supabase.from("forum_categories").select("id, slug, name").order("position");

  return (
    <main className="screen">
      <header className="topbar"><h1 className="title">Nuova discussione</h1></header>
      <form action={createThread} className="form auth-card">
        <div className="field">
          <label htmlFor="category">Categoria</label>
          <select id="category" name="category" className="select" defaultValue={categories?.find((c) => c.slug === categoria)?.id}>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="title">Titolo</label><input id="title" name="title" className="input" required minLength={3} maxLength={140} /></div>
        <div className="field"><label htmlFor="body">Testo</label><textarea id="body" name="body" className="textarea" required maxLength={10000} /></div>
        <button className="btn btn-primary">Pubblica discussione</button>
      </form>
    </main>
  );
}
