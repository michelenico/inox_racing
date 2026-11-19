"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconForum, IconHome, IconPlus, IconTrophy, IconUser } from "./Icons";

export function BottomNav({ username }: { username: string | null }) {
  const path = usePathname();
  const profileHref = username ? `/garage/${username}` : "/login";
  const current = (href: string) => (path === href || (href !== "/" && path.startsWith(href)) ? "page" : undefined);

  return (
    <nav className="bottom-nav glass" aria-label="Navigazione principale">
      <Link href="/" className="nav-item" aria-label="Home" aria-current={current("/")}><IconHome /></Link>
      <Link href="/forum" className="nav-item" aria-label="Forum" aria-current={current("/forum")}><IconForum /></Link>
      <Link href="/pubblica" className="nav-publish" aria-label="Pubblica"><IconPlus /></Link>
      <Link href="/contest" className="nav-item" aria-label="Contest" aria-current={current("/contest")}><IconTrophy /></Link>
      <Link href={profileHref} className="nav-item" aria-label="Profilo" aria-current={username ? current(profileHref) : undefined}><IconUser /></Link>
    </nav>
  );
}
