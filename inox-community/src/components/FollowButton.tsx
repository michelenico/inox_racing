"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFollow } from "@/app/actions/social";

export function FollowButton(props: { profileId: string; following: boolean; loggedIn: boolean; large?: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [following, set] = useOptimistic(props.following);

  function onClick() {
    if (!props.loggedIn) return router.push("/login");
    const next = !following;
    start(async () => {
      set(next);
      await toggleFollow(props.profileId, next);
      router.refresh();
    });
  }

  if (props.large) {
    return (
      <button type="button" className={following ? "btn btn-ghost" : "btn btn-light"} style={{ flex: 1 }} onClick={onClick}>
        {following ? "Segui già" : "Segui"}
      </button>
    );
  }
  return (
    <button type="button" className="btn-soft" onClick={onClick}>
      {following ? "Segui già" : "Segui"}
    </button>
  );
}
