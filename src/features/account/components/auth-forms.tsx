"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { privateRequest, safeReturnPath, sessionChanged, verifyEmail } from "../api/transport";
import { passkeyCeremony } from "../api/passkeys";
import { AccountShell, Field, Protected, TaskFeedback, formValues, useTask } from "./shared";

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot-password" | "reset-password" }) {
  const task = useTask();
  const search = useSearchParams();
  const destination = safeReturnPath(search.get("next"));
  const title = { login: "Welcome back, word explorer.", register: "A place for your words.", "forgot-password": "Let’s get you back in.", "reset-password": "Choose a fresh password." }[mode];
  const signingIn = mode === "login" || mode === "register";
  return <AccountShell title={title} intro={mode === "register" ? "Save the words you love and give them meaning with your own examples." : "A little curiosity goes a long way."}>
    <div className="auth-card account-card">
      <form onSubmit={(event) => {
        const form = event.currentTarget;
        const values = formValues(event);
        const payload = { ...values, ...(mode === "login" ? { remember: new FormData(form).get("remember") === "on" } : {}), ...(mode === "reset-password" ? { token: search.get("token") || "" } : {}) };
        void task.run(async () => {
          await privateRequest(`/auth/${mode}`, "POST", payload);
          form.reset();
          if (signingIn) sessionChanged(mode === "register" ? "/verify-email" : destination);
        }, mode === "forgot-password" ? "If that address has an account, a reset link is on its way. Check your inbox." : mode === "reset-password" ? "Your password was changed. Sign in with your new password." : "");
      }} className="account-form">
        {mode === "register" && <Field label="Name" name="name" autoComplete="name" required maxLength={255} />}
        <Field label="Email address" name="email" type="email" autoComplete="email" required maxLength={255} defaultValue={mode === "reset-password" ? search.get("email") || "" : ""} />
        {mode !== "forgot-password" && <Field label={mode === "reset-password" ? "New password (at least 12 characters)" : mode === "register" ? "Password (at least 12 characters)" : "Password"} name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? undefined : 12} />}
        {(mode === "register" || mode === "reset-password") && <Field label="Confirm password" name="password_confirmation" type="password" autoComplete="new-password" required minLength={12} />}
        {mode === "login" && <label className="check-label"><input type="checkbox" name="remember" /> Keep me signed in on this device</label>}
        <TaskFeedback task={task} />
        <Button disabled={task.busy || (mode === "reset-password" && !search.get("token"))} type="submit" className="h-12">{task.busy ? "One moment…" : { login: "Sign in", register: "Create account", "forgot-password": "Send reset link", "reset-password": "Change password" }[mode]}</Button>
        {mode === "reset-password" && !search.get("token") && <p role="alert">Open the full link in your reset email, or <Link className="text-link" href="/forgot-password">request a new link</Link>.</p>}
      </form>
      {mode === "login" && <><div className="form-divider">or</div><Button className="w-full h-12" variant="outline" disabled={task.busy} onClick={() => void task.run(async () => { await passkeyCeremony("login"); sessionChanged(destination); })}>Sign in with a passkey</Button><p className="mt-5"><Link className="text-link" href="/forgot-password">Forgot your password?</Link></p></>}
      <p className="mt-6 text-sm">{mode === "login" ? <>New here? <Link className="text-link" href={`/register?next=${encodeURIComponent(destination)}`}>Create an account</Link></> : <Link className="text-link" href={`/login?next=${encodeURIComponent(destination)}`}>Back to sign in</Link>}</p>
    </div>
  </AccountShell>;
}

export function Verification() {
  const task = useTask();
  const search = useSearchParams();
  const url = search.get("verification");
  return <AccountShell title="One small step. All your words." intro="Verify your email to start your personal collection."><Protected>{(user) => <div className="account-card auth-card">
    {user.email_verified_at ? <><h2>Your email is verified.</h2><Link className="text-link" href="/vocabulary">Explore your saved words</Link></> : <>
      <p>Check the inbox for <strong>{user.email}</strong>. Links expire after one hour. Sign in to the same account before opening your link.</p>
      {url && <Button disabled={task.busy} onClick={() => void task.run(async () => { await verifyEmail(url); sessionChanged("/verify-email"); })}>Verify my email</Button>}
      <Button variant="outline" disabled={task.busy} onClick={() => void task.run(() => privateRequest("/auth/email/verification-notification", "POST"), "A new verification email is on its way.")}>Send a new verification email</Button>
      <p><Link className="text-link" href="/account">Correct your email address</Link></p>
    </>}
    <TaskFeedback task={task} />
  </div>}</Protected></AccountShell>;
}
