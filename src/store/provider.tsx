"use client";
import { useEffect, useRef, useState } from "react";
import { Provider, useDispatch } from "react-redux";
import { makeStore } from "./store";
import { useMeQuery } from "@/features/account/api/session-api";
import { privateApi } from "@/features/account/api/private-api";
import { sessionSender } from "@/features/account/api/transport";

function SessionBoundary() {
  const { data, refetch } = useMeQuery();
  const dispatch = useDispatch();
  const identity = data ? `${data.id}:${data.email}:${data.email_verified_at}` : null;
  const previous = useRef(identity);
  useEffect(() => {
    if (previous.current !== identity) dispatch(privateApi.util.resetApiState());
    previous.current = identity;
  }, [identity, dispatch]);
  useEffect(() => {
    const check = () => { dispatch(privateApi.util.resetApiState()); void refetch(); };
    const visible = () => { if (document.visibilityState === "visible") check(); };
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("lito-session") : null;
    if (channel) channel.onmessage = (event: MessageEvent) => { if (event.data?.type === "changed" && event.data.sender !== sessionSender) window.location.reload(); };
    window.addEventListener("lito-session-check", check);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", visible);
    return () => { channel?.close(); window.removeEventListener("lito-session-check", check); window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", visible); };
  }, [dispatch, refetch]);
  return null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  return <Provider store={store}><SessionBoundary />{children}</Provider>;
}
