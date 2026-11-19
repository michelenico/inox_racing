import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="screen">
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Inox Racing Puglia" />
          <div>
            <div className="brand-label">INOX COMMUNITY</div>
            <h1 className="title">Accedi</h1>
          </div>
        </div>
      </header>
      <div className="auth-card stack">
        <LoginForm next={next ?? "/"} />
        <p className="notice">Non hai un account? <Link href="/registrazione" style={{ color: "var(--accent-text)", fontWeight: 600 }}>Registrati</Link></p>
      </div>
    </main>
  );
}
