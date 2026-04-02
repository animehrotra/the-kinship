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

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushState>("loading");

  const checkState = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    const key = await getVapidKey();
    if (!key) {
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

  const subscribe = useCallback(async () => {
    if (!user) return false;

    try {
      setState("loading");

      const isInIframe = (() => {
        try { return window.self !== window.top; } catch { return true; }
      })();
      const isPreviewHost =
        window.location.hostname.includes("id-preview--") ||
        window.location.hostname.includes("lovableproject.com");

      if (isInIframe || isPreviewHost) {
        console.warn("Push notifications are only available in the published app");
        setState("unsupported");
        return false;
      }

      const vapidKey = await getVapidKey();
      if (!vapidKey) {
        setState("unsupported");
        return false;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

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

      setState("subscribed");
      return true;
    } catch (err) {
      console.error("Push subscription failed:", err);
      setState("prompt");
      return false;
    }
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
