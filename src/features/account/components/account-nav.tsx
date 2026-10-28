"use client";
import Link from "next/link";
import { useMeQuery } from "../api/session-api";

export function AccountNav() {
  const me = useMeQuery();
  return <Link href={me.data ? "/vocabulary" : "/login"} className="account-nav">{me.isLoading ? "Account" : me.data ? "My words" : "Sign in"}</Link>;
}
