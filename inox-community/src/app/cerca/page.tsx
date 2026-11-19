import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { IconVerified } from "@/components/Icons";

export default async function CercaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim().replace(/[%_,()]/g, "");
  const { supabase } = await getCurrentUser();
  const { data: people } = term.length >= 2
    ? await supabase.from("profiles").select("username, display_name, city, is_verified_customer").or(`username.ilike.%${term}%,display_name.ilike.%${term}%`).limit(20)
    : { data: [] };

  return (
    <main className="screen">
      <header className="topbar"><h1 className="title">Cerca</h1></header>
      <form className="form" role="search">
        <label htmlFor="q" className="hint">Cerca un appassionato per nome o username</label>
        <input id="q" name="q" defaultValue={q} className="input" autoFocus />
      </form>
      <div className="stack" style={{ marginTop: 16 }}>
        {people?.map((p) => (
          <Link key={p.username} href={`/garage/${p.username}`} className="vehicle">
            <span className="avatar" />
            <span>
              <strong style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>{p.display_name}{p.is_verified_customer && <IconVerified />}</strong>
              <span className="post-meta" style={{ display: "block" }}>@{p.username}{p.city ? `, ${p.city}` : ""}</span>
            </span>
          </Link>
        ))}
        {term.length >= 2 && !people?.length && <p className="notice">Nessun risultato per «{term}».</p>}
      </div>
    </main>
  );
}
