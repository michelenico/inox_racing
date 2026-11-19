"use client";

import { useActionState } from "react";
import { login, type AuthState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});
  return (
    <form action={action} className="form">
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Accesso in corso" : "Accedi"}</button>
    </form>
  );
}
