import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export default function RegistrazionePage() {
  return (
    <main className="screen">
      <header className="topbar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Inox Racing Puglia" />
          <div>
            <div className="brand-label">INOX COMMUNITY</div>
            <h1 className="title">Crea account</h1>
          </div>
        </div>
      </header>
      <div className="auth-card stack">
        <RegisterForm />
        <p className="notice">Hai già un account? <Link href="/login" style={{ color: "var(--accent-text)", fontWeight: 600 }}>Accedi</Link></p>
        <p className="hint">Sei cliente Inox Racing Puglia? Dopo la registrazione potrai richiedere il badge di cliente verificato.</p>
      </div>
    </main>
  );
}
