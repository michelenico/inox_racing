import { notFound } from "next/navigation";
import Link from "next/link";
import { FollowButton } from "@/components/FollowButton";
import { IconBack } from "@/components/Icons";
import { loadFeed } from "@/lib/feed";
import { mediaUrl } from "@/lib/media";
import { getCurrentUser } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

export default async function GaragePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { supabase, user } = await getCurrentUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, city, bio, avatar_key, cover_key, is_verified_customer")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();

  const [followers, followingCount, vehicles, posts, amIFollowing, attended] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    supabase.from("vehicles").select("id, make, model, year, engine, mods, cover_key").eq("owner_id", profile.id).order("created_at"),
    loadFeed(supabase, user?.id ?? null, { authorId: profile.id, limit: 30 }),
    user ? supabase.from("follows").select("follower_id").match({ follower_id: user.id, following_id: profile.id }).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("event_attendees").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
  ]);

  const isMe = user?.id === profile.id;
  const avatar = mediaUrl(profile.avatar_key);
  const cover = mediaUrl(profile.cover_key);
  const photos = posts.flatMap((p) => p.media.filter((m) => m.kind === "image")).slice(0, 12);

  return (
    <main className="screen">
      <div className="cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {cover && <img src={cover} alt="" />}
        <Link href="/" className="icon-btn glass" aria-label="Indietro" style={{ position: "absolute", top: 20, left: 16, zIndex: 2 }}>
          <IconBack />
        </Link>
        <div className="cover-info">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={`cover-avatar ${profile.is_verified_customer ? "verified" : ""}`} src={avatar} alt="" />
            ) : (
              <span className={`cover-avatar ${profile.is_verified_customer ? "verified" : ""}`} />
            )}
            <div>
              <h1 className="title" style={{ fontSize: 34 }}>{profile.display_name}</h1>
              <span className="post-meta" style={{ fontSize: 13 }}>
                @{profile.username}{profile.city ? `, ${profile.city}` : ""}
              </span>
            </div>
          </div>
          <div className="badges">
            {profile.is_verified_customer && <span className="badge badge-accent">Cliente verificato</span>}
            {(attended.count ?? 0) > 0 && <span className="badge glass">{attended.count} raduni</span>}
          </div>
        </div>
      </div>

      <div className="stack">
        <div className="stats">
          <div className="stat"><b>{followers.count ?? 0}</b><span>Follower</span></div>
          <div className="stat"><b>{followingCount.count ?? 0}</b><span>Seguiti</span></div>
          <div className="stat"><b>{vehicles.data?.length ?? 0}</b><span>Auto</span></div>
        </div>

        {isMe ? (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/garage/nuova-auto" className="btn btn-light" style={{ flex: 1 }}>Aggiungi auto</Link>
            <form action={logout} style={{ flex: 1, display: "flex" }}>
              <button className="btn btn-ghost" style={{ flex: 1 }}>Esci</button>
            </form>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <FollowButton profileId={profile.id} following={!!amIFollowing.data} loggedIn={!!user} large />
          </div>
        )}

        {profile.bio && <p className="notice">{profile.bio}</p>}

        <h2 className="title" style={{ fontSize: 26 }}>Auto</h2>
        {vehicles.data?.length ? (
          vehicles.data.map((v) => (
            <div key={v.id} className="vehicle">
              {v.cover_key ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="vehicle-img" src={mediaUrl(v.cover_key)!} alt="" />
              ) : (
                <span className="vehicle-img" />
              )}
              <div style={{ minWidth: 0 }}>
                <div className="vehicle-name">{v.make} {v.model}</div>
                <div className="post-meta" style={{ fontSize: 13 }}>{[v.year, v.engine].filter(Boolean).join(", ")}</div>
                {v.mods && <div className="official">Modifiche: {v.mods.split("\n").length}</div>}
              </div>
            </div>
          ))
        ) : (
          <p className="notice">{isMe ? "Il tuo garage è vuoto: aggiungi la tua prima auto." : "Nessuna auto nel garage."}</p>
        )}

        {photos.length > 0 && (
          <>
            <h2 className="title" style={{ fontSize: 26 }}>Foto</h2>
            <div className="grid-2">
              {photos.map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={m.storage_key} src={mediaUrl(m.storage_key)!} alt="" loading="lazy" />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
