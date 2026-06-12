// Kinship Push Notification Service Worker

self.addEventListener("push", (event) => {
  let data = { title: "Kinship", body: "You have a nudge due!", url: "/dashboard" };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error("Failed to parse push data:", e);
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/dashboard" },
    vibrate: [100, 50, 100],
    actions: [
      { action: "open", title: "Open Kinship" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
