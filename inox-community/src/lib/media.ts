export function mediaUrl(key: string | null | undefined) {
  if (!key) return null;
  return `${process.env.NEXT_PUBLIC_MEDIA_URL}/${key}`;
}

export const QUICK_REACTIONS = ["🔥", "💨", "✈️", "😍", "👏", "😂"] as const;

export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "adesso";
  if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h fa`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} g fa`;
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}
