import { getCurrentUser } from "@/lib/supabase/server";
import { AttendButton } from "./AttendButton";
import { IconPin } from "@/components/Icons";

export default async function RaduniPage() {
  const { supabase, user } = await getCurrentUser();
  const { data: events } = await supabase
    .from("events")
    .select("id, slug, title, starts_at, venue, city, lat, lng, is_official")
    .gte("starts_at", new Date(Date.now() - 6 * 3600 * 1000).toISOString())
    .order("starts_at")
    .limit(50);

  let mine: string[] = [];
  if (user && events?.length) {
    const { data } = await supabase.from("event_attendees").select("event_id").eq("user_id", user.id).in("event_id", events.map((e) => e.id));
    mine = (data ?? []).map((r) => r.event_id as string);
  }

  return (
    <main className="screen">
      <header className="topbar">
        <div>
          <h1 className="title">Raduni</h1>
          <p className="subtitle">I prossimi eventi in Puglia</p>
        </div>
      </header>

      {!events?.length ? (
        <div className="empty">
          <h2>Nessun raduno in programma</h2>
          <p>I nuovi eventi compariranno qui appena pubblicati.</p>
        </div>
      ) : (
        <div className="stack">
          {events.map((e) => {
            const d = new Date(e.starts_at);
            const maps = e.lat && e.lng
              ? `https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue}, ${e.city}`)}`;
            return (
              <article key={e.id} className="event" style={{ flexWrap: "wrap" }}>
                <div className="event-date">
                  <b>{d.toLocaleDateString("it-IT", { day: "2-digit", timeZone: "Europe/Rome" })}</b>
                  <span>{d.toLocaleDateString("it-IT", { month: "short", timeZone: "Europe/Rome" })}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="event-title">{e.title}</div>
                  <div className="post-meta" style={{ fontSize: 13 }}>
                    {e.venue}, {e.city}, ore {d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" })}
                  </div>
                  {e.is_official && <div className="official">Raduno ufficiale Inox</div>}
                </div>
                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  <AttendButton eventId={e.id} attending={mine.includes(e.id)} loggedIn={!!user} />
                  <a href={maps} target="_blank" rel="noopener" className="icon-btn" aria-label="Indicazioni stradali" style={{ width: 46, height: 46 }}>
                    <IconPin />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
