import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { presignUpload } from "@/lib/r2";

const IMAGE_TYPES = ["image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // il client comprime a ~2048 px, quindi ne avanza

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Accedi per caricare file" }, { status: 401 });

  const { contentType, size } = (await request.json()) as { contentType?: string; size?: number };
  if (!contentType || !IMAGE_TYPES.includes(contentType))
    return NextResponse.json({ error: "Formato non supportato" }, { status: 400 });
  if (!size || size > MAX_IMAGE_BYTES)
    return NextResponse.json({ error: "Il file è troppo pesante" }, { status: 400 });

  const ext = contentType === "image/webp" ? "webp" : "jpg";
  const key = `posts/${data.user.id}/${crypto.randomUUID()}.${ext}`;
  const url = await presignUpload(key, contentType, size);
  return NextResponse.json({ url, key });
}
