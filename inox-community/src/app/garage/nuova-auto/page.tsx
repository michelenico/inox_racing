import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function addVehicle(form: FormData) {
  "use server";
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const year = Number(form.get("year")) || null;
  await supabase.from("vehicles").insert({
    owner_id: data.user.id,
    make: String(form.get("make")).trim(),
    model: String(form.get("model")).trim(),
    year,
    engine: String(form.get("engine") ?? "").trim() || null,
    mods: String(form.get("mods") ?? "").trim() || null,
  });
  const { data: me } = await supabase.from("profiles").select("username").eq("id", data.user.id).single();
  redirect(`/garage/${me?.username}`);
}

export default async function NewVehiclePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/garage/nuova-auto");

  return (
    <main className="screen">
      <header className="topbar"><h1 className="title">Aggiungi auto</h1></header>
      <form action={addVehicle} className="form auth-card">
        <div className="field"><label htmlFor="make">Marca</label><input id="make" name="make" className="input" required maxLength={40} /></div>
        <div className="field"><label htmlFor="model">Modello</label><input id="model" name="model" className="input" required maxLength={60} /></div>
        <div className="field"><label htmlFor="year">Anno</label><input id="year" name="year" type="number" min={1900} max={2100} className="input" /></div>
        <div className="field"><label htmlFor="engine">Motorizzazione</label><input id="engine" name="engine" className="input" maxLength={80} /></div>
        <div className="field">
          <label htmlFor="mods">Modifiche</label>
          <textarea id="mods" name="mods" className="textarea" maxLength={2000} />
          <span className="hint">Una modifica per riga.</span>
        </div>
        <button className="btn btn-primary">Salva auto</button>
      </form>
    </main>
  );
}
