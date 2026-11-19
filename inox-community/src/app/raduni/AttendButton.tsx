"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAttendance } from "@/app/actions/social";

export function AttendButton(props: { eventId: string; attending: boolean; loggedIn: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [attending, set] = useOptimistic(props.attending);
  return (
    <button
      type="button"
      className={attending ? "btn btn-ghost" : "btn btn-primary"}
      style={{ flex: 1 }}
      aria-pressed={attending}
      onClick={() => {
        if (!props.loggedIn) return router.push("/login?next=/raduni");
        const next = !attending;
        start(async () => {
          set(next);
          await toggleAttendance(props.eventId, next);
        });
      }}
    >
      {attending ? "Partecipi" : "Partecipo"}
    </button>
  );
}
