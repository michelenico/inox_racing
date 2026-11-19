import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { IconBell, IconSearch } from "@/components/Icons";
import { loadFeed } from "@/lib/feed";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function Home({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const { vista } = await searchParams;
  const followingOnly = vista === "seguiti";
  const { supabase, user } = await getCurrentUser();
  const posts = await loadFeed(supabase, user?.id ?? null, { followingOnly });

  return (
    <main className="screen">
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Inox Racing Puglia" />
          <div>
            <div className="brand-label">INOX COMMUNITY</div>
            <h1 className="title">Il tuo feed</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/cerca" className="icon-btn" aria-label="Cerca"><IconSearch /></Link>
          <Link href="/notifiche" className="icon-btn" aria-label="Notifiche"><IconBell /></Link>
        </div>
      </header>

      <nav className="chips" aria-label="Filtra il feed">
        <Link href="/" className="chip" aria-current={!followingOnly ? "page" : undefined}>Per te</Link>
        <Link href="/?vista=seguiti" className="chip" aria-current={followingOnly ? "page" : undefined}>Seguiti</Link>
        <Link href="/raduni" className="chip">Raduni</Link>
        <Link href="/contest" className="chip">Contest</Link>
      </nav>

      {posts.length === 0 ? (
        <div className="empty">
          <h2>{followingOnly ? "Ancora nessun post dai tuoi seguiti" : "Il feed è vuoto"}</h2>
          <p>{followingOnly ? "Segui altri appassionati per vedere qui le loro auto." : "Pubblica la prima foto della tua auto."}</p>
          <Link href="/pubblica" className="btn btn-primary" style={{ marginTop: 12 }}>Pubblica</Link>
        </div>
      ) : (
        <div className="stack">
          {posts.map((p) => <PostCard key={p.id} post={p} viewerId={user?.id ?? null} />)}
        </div>
      )}
    </main>
  );
}
