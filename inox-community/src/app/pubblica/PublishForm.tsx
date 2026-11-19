"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "./actions";

type Prepared = { blob: Blob; width: number; height: number; preview: string };

/** Ridimensiona a max 2048 px e converte in JPEG. Così anche le foto HEIC degli iPhone diventano leggibili ovunque. */
async function prepareImage(file: File): Promise<Prepared> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob>((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error("Conversione fallita"))), "image/jpeg", 0.85));
  return { blob, width, height, preview: URL.createObjectURL(blob) };
}

export function PublishForm({ vehicles }: { vehicles: { id: string; make: string; model: string }[] }) {
  const router = useRouter();
  const [images, setImages] = useState<Prepared[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    try {
      const prepared = await Promise.all(Array.from(list).slice(0, 10 - images.length).map(prepareImage));
      setImages((cur) => [...cur, ...prepared]);
    } catch {
      setError("Non riesco a leggere una delle foto. Prova con un'altra immagine.");
    }
  }

  async function onSubmit(form: FormData) {
    if (images.length === 0) return setError("Aggiungi almeno una foto.");
    setBusy(true);
    setError(null);
    try {
      const media = [];
      for (const img of images) {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: "image/jpeg", size: img.blob.size }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Caricamento non riuscito");
        const { url, key } = await res.json();
        const put = await fetch(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: img.blob });
        if (!put.ok) throw new Error("Caricamento non riuscito");
        media.push({ key, width: img.width, height: img.height });
      }
      await createPost({
        caption: String(form.get("caption") ?? ""),
        city: String(form.get("city") ?? ""),
        vehicleId: (form.get("vehicle") as string) || null,
        media,
      });
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pubblicazione non riuscita");
      setBusy(false);
    }
  }

  return (
    <form action={onSubmit} className="form auth-card">
      <div className="field">
        <label htmlFor="photos">Foto</label>
        <input id="photos" type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} className="input" style={{ paddingTop: 12 }} />
        <span className="hint">Fino a 10 foto. Se si vede la targa, valuta se coprirla prima di pubblicare.</span>
      </div>
      {images.length > 0 && (
        <div className="grid-2">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.preview} src={img.preview} alt={`Foto ${i + 1}`} />
          ))}
        </div>
      )}
      {vehicles.length > 0 && (
        <div className="field">
          <label htmlFor="vehicle">Auto</label>
          <select id="vehicle" name="vehicle" className="select">
            <option value="">Nessuna</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.make} {v.model}</option>)}
          </select>
        </div>
      )}
      <div className="field"><label htmlFor="caption">Descrizione</label><textarea id="caption" name="caption" className="textarea" maxLength={1000} /></div>
      <div className="field"><label htmlFor="city">Città</label><input id="city" name="city" className="input" maxLength={60} /></div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Pubblicazione in corso" : "Pubblica"}</button>
    </form>
  );
}
