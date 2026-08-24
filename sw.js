// =========================================================
// Service Worker - منصة هي كيميا ! للإشعارات في الخلفية
// =========================================================

self.addEventListener("install", function(event) {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "TRIGGER_NATIVE_NOTIFICATION") {
    var title = event.data.title || "منصة هي كيميا !";
    var options = {
      body: event.data.body || "لديك رد جديد من الدعم الأكاديمي.",
      icon: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=192&q=80",
      badge: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=96&q=80",
      dir: "rtl",
      lang: "ar",
      vibrate: [250, 100, 250],
      tag: "hk-support-chat-reply",
      renotify: true,
      requireInteraction: true,
      data: {
        url: event.data.url || "support.html"
      }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : "support.html";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes("support.html") && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});