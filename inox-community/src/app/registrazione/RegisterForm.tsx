"use client";

import { useActionState } from "react";
import { register, type AuthState } from "../login/actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, {});
  if (state.notice) return <p className="notice" role="status">{state.notice}</p>;
  return (
    <form action={action} className="form">
      <div className="field">
        <label htmlFor="username">Username</label>
        <input id="username" name="username" className="input" autoComplete="username" required minLength={3} maxLength={24} pattern="[a-z0-9_.]{3,24}" />
        <span className="hint">Sarà l'indirizzo del tuo garage, per esempio /garage/marco_r</span>
      </div>
      <div className="field">
        <label htmlFor="display_name">Nome visibile</label>
        <input id="display_name" name="display_name" className="input" maxLength={60} />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Creazione account" : "Crea account"}</button>
    </form>
  );
}
