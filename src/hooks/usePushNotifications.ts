import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type PushState = "unsupported" | "denied" | "prompt" | "subscribed" | "loading";

export type SubscribeFailureReason =
  | "preview"
  | "permission-denied"
  | "permission-dismissed"
  | "no-vapid-key"
  | "sw-register-failed"
  | "subscribe-failed"
  | "db-failed"
  | "unsupported"
  | "not-authenticated";

export type SubscribeResult = {
  ok: boolean;
  reason?: SubscribeFailureReason;
  message?: string;
};


let vapidKeyCache: string | null = null;

async function getVapidKey(): Promise<string | null> {
  if (vapidKeyCache) return vapidKeyCache;
  try {
    const { data, error } = await supabase.functions.invoke("get-vapid-key");
    if (error || !data?.publicKey) return null;
    vapidKeyCache = data.publicKey;
    return vapidKeyCache;
  } catch {
    return null;
  }
}

export function isPreviewContext(): boolean {
  if (typeof window === "undefined") return false;
  const inIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.endsWith("lovableproject.com") ||
    host.endsWith("lovableproject-dev.com") ||
    host.endsWith("beta.lovable.dev");
  return inIframe || isPreviewHost;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushState>("loading");

  const checkState = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }

    const permission = Notification.permission;
    if (permission === "denied") {
      setState("denied");
      return;
    }

    if (!user) {
      setState("prompt");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setState("subscribed");
          return;
        }
      }
    } catch {
      // fall through
    }

    setState("prompt");
  }, [user]);

  useEffect(() => {
    checkState();
  }, [checkState]);

  const subscribe = useCallback(async (): Promise<SubscribeResult> => {
    if (!user) return { ok: false, reason: "not-authenticated" };

    setState("loading");

    if (isPreviewContext()) {
      console.warn("[push] blocked: running in Lovable preview/iframe");
      setState("prompt");
      return { ok: false, reason: "preview" };
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return { ok: false, reason: "unsupported" };
    }

    // Permission
    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch (err) {
      console.error("[push] requestPermission threw", err);
      setState("prompt");
      return { ok: false, reason: "permission-dismissed", message: (err as Error)?.message };
    }
    if (permission === "denied") {
      setState("denied");
      return { ok: false, reason: "permission-denied" };
    }
    if (permission !== "granted") {
      setState("prompt");
      return { ok: false, reason: "permission-dismissed" };
    }

    // VAPID key
    const vapidKey = await getVapidKey();
    if (!vapidKey) {
      console.error("[push] no VAPID key from get-vapid-key function");
      setState("prompt");
      return { ok: false, reason: "no-vapid-key" };
    }

    // Service worker registration
    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
    } catch (err) {
      console.error("[push] serviceWorker.register failed", err);
      setState("prompt");
      return { ok: false, reason: "sw-register-failed", message: (err as Error)?.message };
    }

    // Push subscription
    let subscription: PushSubscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    } catch (err) {
      console.error("[push] pushManager.subscribe failed", err);
      setState("prompt");
      return { ok: false, reason: "subscribe-failed", message: (err as Error)?.message };
    }

    // Persist
    try {
      const json = subscription.toJSON();
      const { error } = await supabase.from("push_subscriptions" as any).upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        },
        { onConflict: "user_id,endpoint" }
      );
      if (error) throw error;
    } catch (err) {
      console.error("[push] saving subscription failed", err);
      setState("prompt");
      return { ok: false, reason: "db-failed", message: (err as Error)?.message };
    }

    setState("subscribed");
    return { ok: true };
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      await supabase
        .from("push_subscriptions" as any)
        .delete()
        .eq("user_id", user.id);
      setState("prompt");
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
  }, [user]);

  return { state, subscribe, unsubscribe };
}
