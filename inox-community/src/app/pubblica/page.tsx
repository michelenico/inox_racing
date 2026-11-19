import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { PublishForm } from "./PublishForm";

export default async function PubblicaPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/login?next=/pubblica");
  const { data: vehicles } = await supabase.from("vehicles").select("id, make, model").eq("owner_id", user.id).order("created_at");

  return (
    <main className="screen">
      <header className="topbar"><h1 className="title">Pubblica</h1></header>
      <PublishForm vehicles={vehicles ?? []} />
    </main>
  );
}
