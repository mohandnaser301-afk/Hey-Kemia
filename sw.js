// Service Worker الخاص بنظام إشعارات أجهزة الطلاب - منصة هي كيميا !

self.addEventListener("install", function(event) {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

// استقبال أمر إظهار الإشعار في نظام تشغيل جهاز الطالب
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "TRIGGER_NATIVE_NOTIFICATION") {
    var title = event.data.title || "منصة هي كيميا !";
    var options = {
      body: event.data.body || "إشعار جديد من المنصة",
      icon: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=192&q=80",
      badge: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=96&q=80",
      vibrate: [200, 100, 200, 100, 200], // اهتزاز لجهاز الموبايل
      tag: "he-kemia-notif-" + Date.now(),
      renotify: true,
      requireInteraction: true, // يظل الإشعار ثابتاً في جهاز الطالب حتى يفتحه
      data: {
        url: event.data.url || "dashboard.html"
      }
    };

    self.registration.showNotification(title, options);
  }
});

// عند نقر الطالب على الإشعار من شريط إشعارات الهاتف أو الويندوز
self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : "dashboard.html";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});