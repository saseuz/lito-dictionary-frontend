import { z } from "zod";
import { AccountError, privateRequest } from "./transport";

export function supportsPasskeys(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && typeof PublicKeyCredential !== "undefined" &&
    typeof PublicKeyCredential.parseRequestOptionsFromJSON === "function" && typeof PublicKeyCredential.parseCreationOptionsFromJSON === "function" &&
    typeof PublicKeyCredential.prototype.toJSON === "function";
}
export async function passkeyCeremony(kind: "login" | "confirm" | "create", name?: string, remember = false): Promise<void> {
  if (!supportsPasskeys()) throw new AccountError({ status: 0, message: "Passkeys need a recent browser on HTTPS or localhost. You can use your password here." });
  const path = kind === "create" ? "/me/passkeys" : kind === "confirm" ? "/auth/reauthenticate/passkey" : "/auth/passkeys/login";
  const options = z.object({ data: z.record(z.string(), z.unknown()) }).parse(await privateRequest(`${path}/options`, "POST"));
  let credential: Credential | null;
  try {
    credential = kind === "create"
      ? await navigator.credentials.create({ publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(options.data as unknown as PublicKeyCredentialCreationOptionsJSON) })
      : await navigator.credentials.get({ publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options.data as unknown as PublicKeyCredentialRequestOptionsJSON) });
  } catch {
    throw new AccountError({ status: 0, message: "The passkey step wasn’t completed. Try again, or use your password." });
  }
  if (!(credential instanceof PublicKeyCredential)) throw new AccountError({ status: 0, message: "No passkey was selected. Try again." });
  await privateRequest(path, "POST", { credential: credential.toJSON(), ...(kind === "create" ? { name } : kind === "login" ? { remember } : {}) });
}
