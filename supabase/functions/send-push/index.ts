import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

// Web Push utilities using the Web Crypto API (no npm:web-push needed in Deno)
const base64UrlToUint8Array = (base64url: string): Uint8Array => {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const uint8ArrayToBase64Url = (arr: Uint8Array): string => {
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// ECDH + HKDF encryption for Web Push (RFC 8291)
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
) {
  const clientPublicKeyBytes = base64UrlToUint8Array(p256dhKey);
  const authSecretBytes = base64UrlToUint8Array(authSecret);

  // Import client public key
  const clientPublicKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Generate ephemeral server key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientPublicKey },
      serverKeyPair.privateKey,
      256
    )
  );

  const serverPublicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeyPair.publicKey)
  );

  // HKDF helper
  async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
    const key = await crypto.subtle.importKey("raw", ikm, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, salt.length ? salt : new Uint8Array(32)));
    const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const infoLen = new Uint8Array([...info, 1]);
    const okm = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, infoLen));
    return okm.slice(0, length);
  }

  const encoder = new TextEncoder();

  // Auth info
  const authInfo = encoder.encode("Content-Encoding: auth\0");
  const prkCombine = await hkdf(authSecretBytes, sharedSecret, authInfo, 32);

  // Key info
  const keyInfoBuf = new Uint8Array([
    ...encoder.encode("Content-Encoding: aesgcm\0P-256\0"),
    0, 65, ...clientPublicKeyBytes,
    0, 65, ...serverPublicKeyBytes,
  ]);
  const contentKey = await hkdf(new Uint8Array(0), prkCombine, keyInfoBuf, 16);

  // Nonce info
  const nonceInfoBuf = new Uint8Array([
    ...encoder.encode("Content-Encoding: nonce\0P-256\0"),
    0, 65, ...clientPublicKeyBytes,
    0, 65, ...serverPublicKeyBytes,
  ]);
  const nonce = await hkdf(new Uint8Array(0), prkCombine, nonceInfoBuf, 12);

  // Encrypt with AES-128-GCM
  const payloadBytes = encoder.encode(payload);
  const paddedPayload = new Uint8Array([0, 0, ...payloadBytes]); // 2-byte padding

  const aesKey = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPayload)
  );

  return { encrypted, serverPublicKeyBytes };
}

// VAPID JWT signing
async function createVapidJwt(audience: string, vapidPrivateKey: string, vapidPublicKey: string) {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: "mailto:noreply@kinship.app",
  };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import VAPID private key
  const privKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  const pubKeyBytes = base64UrlToUint8Array(vapidPublicKey);

  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: uint8ArrayToBase64Url(privKeyBytes),
    x: uint8ArrayToBase64Url(pubKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64Url(pubKeyBytes.slice(33, 65)),
  };

  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsignedToken)));

  // Convert DER signature to raw r||s
  const sigB64 = uint8ArrayToBase64Url(sig);
  return `${unsignedToken}.${sigB64}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, url } = await req.json();

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id and title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch subscriptions for this user
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body: body || "", url: url || "/dashboard" });
    let sent = 0;
    const staleIds: string[] = [];

    for (const sub of subs) {
      try {
        const { encrypted, serverPublicKeyBytes } = await encryptPayload(payload, sub.p256dh, sub.auth);
        const endpointUrl = new URL(sub.endpoint);
        const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

        const jwt = await createVapidJwt(audience, vapidPrivateKey, vapidPublicKey);

        const resp = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aesgcm",
            "Crypto-Key": `dh=${uint8ArrayToBase64Url(serverPublicKeyBytes)};p256ecdsa=${vapidPublicKey}`,
            Authorization: `WebPush ${jwt}`,
            TTL: "86400",
          },
          body: encrypted,
        });

        if (resp.status === 201 || resp.status === 200) {
          sent++;
        } else if (resp.status === 404 || resp.status === 410) {
          staleIds.push(sub.id);
        }
      } catch (e) {
        console.error(`Failed to push to ${sub.endpoint}:`, e);
      }
    }

    // Clean up stale subscriptions
    if (staleIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", staleIds);
    }

    return new Response(JSON.stringify({ sent, cleaned: staleIds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
