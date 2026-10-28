"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/account";
import { privateRequest, sessionChanged } from "../api/transport";
import { passkeyCeremony } from "../api/passkeys";
import { usePasskeysQuery } from "../api/private-api";
import { AccountShell, AccountLinks, ConfirmButton, Failure, Field, Protected, TaskFeedback, formValues, useTask } from "./shared";

function IdentityConfirmation() {
  const task = useTask();
  return <section className="account-card" id="confirm-identity"><h2>Confirm it’s you</h2><p>Before changing your email, password or passkeys, confirm your identity. Confirmation lasts ten minutes.</p>
    <form className="account-form" onSubmit={(event) => { const form = event.currentTarget; const values = formValues(event); void task.run(async () => { await privateRequest("/auth/reauthenticate/password", "POST", values); form.reset(); }, "Identity confirmed. You can now make your changes."); }}>
      <Field label="Current password" name="password" type="password" autoComplete="current-password" required /><Button disabled={task.busy}>Confirm with password</Button>
    </form><Button className="mt-3" variant="outline" disabled={task.busy} onClick={() => void task.run(() => passkeyCeremony("confirm"), "Identity confirmed. You can now make your changes.")}>Confirm with passkey</Button><TaskFeedback task={task} />
  </section>;
}
function Profile({ user }: { user: User }) {
  const task = useTask();
  return <section className="account-card"><h2>Your profile</h2>{!user.email_verified_at && <p className="verification-note">Your email is not verified. <Link className="text-link" href="/verify-email">Verify email</Link></p>}
    <form className="account-form" onSubmit={(event) => { const values = formValues(event); void task.run(async () => { await privateRequest("/me", "PATCH", values); sessionChanged("/account"); }); }}>
      <Field label="Name" name="name" defaultValue={user.name} required maxLength={255} autoComplete="name" />
      <Field label="Email address" name="email" type="email" defaultValue={user.email} required maxLength={255} autoComplete="email" />
      <p className="form-hint">Changing your email requires confirmation below. You’ll verify the new address, and your other sessions will end.</p>
      <TaskFeedback task={task} /><Button disabled={task.busy}>{task.busy ? "Saving…" : "Save profile"}</Button>
    </form></section>;
}
function Password() {
  const task = useTask();
  return <section className="account-card"><h2>Change password</h2><p>Confirm your identity first. Changing your password signs you out everywhere.</p><form className="account-form" onSubmit={(event) => { const values = formValues(event); void task.run(async () => { await privateRequest("/me/password", "PUT", values); sessionChanged("/"); }); }}>
    <Field label="New password (at least 12 characters)" name="password" type="password" autoComplete="new-password" minLength={12} required />
    <Field label="Confirm new password" name="password_confirmation" type="password" autoComplete="new-password" minLength={12} required />
    <TaskFeedback task={task} /><Button disabled={task.busy}>Change password & sign out</Button>
  </form></section>;
}
function Passkeys() {
  const query = usePasskeysQuery();
  const task = useTask();
  return <section className="account-card"><h2>Your passkeys</h2><p>Use your device’s fingerprint, face recognition or screen lock. A recent browser and HTTPS or localhost are required.</p>
    {query.isFetching ? <p role="status">Loading passkeys…</p> : query.error ? <><Failure error={"message" in query.error ? query.error : undefined} /><Button variant="outline" onClick={() => query.refetch()}>Retry</Button></> : <ul className="private-list">{!query.data?.data.length && <li>No passkeys yet. Your password still works.</li>}{query.data?.data.map((key) => <li key={key.id}><form className="account-form" onSubmit={(event) => { const values = formValues(event); void task.run(async () => { await privateRequest(`/me/passkeys/${key.id}`, "PATCH", values); await query.refetch(); }, "Passkey renamed."); }}><Field label="Passkey name" name="name" defaultValue={key.name} required maxLength={255} /><p className="form-hint">{key.last_used_at ? `Last used ${new Date(key.last_used_at).toLocaleDateString()}` : "Not used yet"}</p><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={task.busy}>Rename</Button><ConfirmButton explanation="Remove this passkey? You can still use your password." onConfirm={async () => { await privateRequest(`/me/passkeys/${key.id}`, "DELETE"); await query.refetch(); }}>Remove</ConfirmButton></div></form></li>)}</ul>}
    <form className="account-form mt-6" onSubmit={(event) => { const form = event.currentTarget; const values = formValues(event); void task.run(async () => { await passkeyCeremony("create", String(values.name)); form.reset(); await query.refetch(); }, "Passkey added."); }}><Field label="Name for your new passkey" name="name" placeholder="For example, my laptop" required maxLength={255} /><Button disabled={task.busy}>Add passkey</Button></form><TaskFeedback task={task} />
  </section>;
}
function Settings({ user }: { user: User }) {
  const task = useTask();
  return <><AccountLinks /><div className="settings-grid"><div className="settings-column"><Profile user={user} /><IdentityConfirmation /><Password /></div><div className="settings-column">
    {user.email_verified_at && <Passkeys />}
    <section className="account-card"><h2>Sessions</h2><p>Sign out on this device, or confirm your identity to end every session.</p><div className="flex flex-wrap gap-3"><Button disabled={task.busy} variant="outline" onClick={() => void task.run(async () => { await privateRequest("/auth/logout", "POST"); sessionChanged("/"); })}>Sign out</Button><ConfirmButton explanation="End all sessions and revoke connected device tokens? This signs you out here too." onConfirm={async () => { await privateRequest("/auth/logout-all", "POST"); sessionChanged("/"); }}>Sign out everywhere</ConfirmButton></div><TaskFeedback task={task} /></section>
    <section className="account-card danger-card"><h2>Delete account</h2><p>This permanently removes your account, saved words, personal examples, history and passkeys. Confirm your identity first.</p><ConfirmButton explanation="Permanently delete your account and all personal dictionary data? This cannot be undone." onConfirm={async () => { await privateRequest("/me", "DELETE"); sessionChanged("/"); }}>Delete my account</ConfirmButton></section>
  </div></div></>;
}
export function AccountSettings() { return <AccountShell title="Make yourself at home." intro="Your profile, your devices, your peace of mind."><Protected>{(user) => <Settings user={user} />}</Protected></AccountShell>; }
