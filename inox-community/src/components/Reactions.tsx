"use client";

import dynamic from "next/dynamic";
import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReaction, toggleSave } from "@/app/actions/social";
import { QUICK_REACTIONS } from "@/lib/media";
import { IconBookmark, IconPlus, IconSmile } from "./Icons";

// Il selettore completo pesa: si scarica solo quando qualcuno tocca "+".
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type Count = { emoji: string; total: number };
type State = { mine: string | null; counts: Count[]; saved: boolean };

function applyReaction(state: State, next: string | null): State {
  const counts = state.counts.map((c) => ({ ...c }));
  const bump = (emoji: string, delta: number) => {
    const row = counts.find((c) => c.emoji === emoji);
    if (row) row.total += delta;
    else if (delta > 0) counts.push({ emoji, total: delta });
  };
  if (state.mine) bump(state.mine, -1);
  if (next) bump(next, 1);
  return { ...state, mine: next, counts: counts.filter((c) => c.total > 0).sort((a, b) => b.total - a.total) };
}

export function Reactions(props: { postId: string; myReaction: string | null; counts: Count[]; saved: boolean; loggedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullPicker, setFullPicker] = useState(false);
  const [, startTransition] = useTransition();
  const [state, update] = useOptimistic<State, { type: "react"; emoji: string | null } | { type: "save"; value: boolean }>(
    { mine: props.myReaction, counts: props.counts, saved: props.saved },
    (s, action) => (action.type === "react" ? applyReaction(s, action.emoji) : { ...s, saved: action.value }),
  );

  const total = state.counts.reduce((n, c) => n + c.total, 0);
  const top = state.counts.slice(0, 3).map((c) => c.emoji).join("");

  function requireLogin() {
    if (!props.loggedIn) {
      router.push("/login");
      return true;
    }
    return false;
  }

  function react(emoji: string) {
    if (requireLogin()) return;
    // Toccare di nuovo la stessa emoji toglie la reazione, come su Instagram.
    const next = state.mine === emoji ? null : emoji;
    setOpen(false);
    setFullPicker(false);
    startTransition(async () => {
      update({ type: "react", emoji: next });
      await setReaction(props.postId, next);
      router.refresh();
    });
  }

  function save() {
    if (requireLogin()) return;
    const value = !state.saved;
    startTransition(async () => {
      update({ type: "save", value });
      await toggleSave(props.postId, value);
      router.refresh();
    });
  }

  return (
    <>
      {open && (
        <div className="react-picker glass" role="group" aria-label="Reagisci con una emoji">
          {QUICK_REACTIONS.map((e) => (
            <button key={e} type="button" onClick={() => react(e)} aria-pressed={state.mine === e} aria-label={`Reagisci con ${e}`}>
              {e}
            </button>
          ))}
          <button type="button" className="more" onClick={() => setFullPicker(true)} aria-label="Tutte le emoji">
            <IconPlus size={20} />
          </button>
        </div>
      )}

      <div className="react-bar glass">
        <button
          type="button"
          className="react-btn"
          aria-expanded={open}
          aria-pressed={!!state.mine}
          onClick={() => (requireLogin() ? null : setOpen((o) => !o))}
        >
          {state.mine ? <span className="mine" aria-hidden="true">{state.mine}</span> : <IconSmile />}
          {state.mine ? "La tua reazione" : "Reagisci"}
        </button>
        {total > 0 ? (
          <button type="button" className="react-summary" aria-label={`${total} reazioni`}>
            <span className="emojis" aria-hidden="true">{top}</span>
            <span className="count">{total}</span>
          </button>
        ) : (
          <span style={{ marginRight: "auto" }} />
        )}
        <button type="button" className="save-btn" aria-label={state.saved ? "Rimuovi dai salvati" : "Salva"} aria-pressed={state.saved} onClick={save}>
          <IconBookmark />
        </button>
      </div>

      {fullPicker && (
        <>
          <button type="button" className="emoji-backdrop" aria-label="Chiudi" onClick={() => setFullPicker(false)} />
          <div className="emoji-sheet">
            <EmojiPicker
              theme={"dark" as never}
              width="100%"
              height={420}
              searchPlaceHolder="Cerca emoji"
              previewConfig={{ showPreview: false }}
              onEmojiClick={(data) => react(data.emoji)}
            />
          </div>
        </>
      )}
    </>
  );
}
