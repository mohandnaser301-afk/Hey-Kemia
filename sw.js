// =========================================================
// Service Worker الخاص بنظام إشعارات أجهزة الطلاب - منصة هي كيميا !
// =========================================================

self.addEventListener("install", function(event) {
  // تفعيل الـ Service Worker فوراً بمجرد تثبيته
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  // السيطرة على كافة النوافذ المفتوحة فوراً
  event.waitUntil(self.clients.claim());
});

// استقبال أمر إظهار الإشعار السحابي وتحويله لإشعار جهاز (Native)
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "TRIGGER_NATIVE_NOTIFICATION") {
    const title = event.data.title || "منصة هي كيميا !";
    const options = {
      body: event.data.body || "لديك تحديث جديد من أ/ محمد السعيد",
      // رابط الأيقونة (يفضل تغييرها لأيقونة التطبيق الخاصة بك لاحقاً)
      icon: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=192&q=80",
      badge: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=96&q=80",
      vibrate: [200, 100, 200, 100, 200], // نمط الاهتزاز للموبايل
      tag: "he-kemia-notif-" + Date.now(), // لمنع تكرار الإشعارات المتطابقة
      renotify: true,
      requireInteraction: true, // يظل الإشعار ثابتاً في شريط الإشعارات حتى يتفاعل معه الطالب
      data: {
        // الرابط الذي سيفتح عند النقر على الإشعار
        url: event.data.url || "dashboard.html"
      }
    };

    // إظهار الإشعار على الجهاز
    self.registration.showNotification(title, options);
  }
});

// التعامل مع حدث النقر على الإشعار من قبل الطالب
self.addEventListener("notificationclick", function(event) {
  // إغلاق الإشعار فور النقر عليه
  event.notification.close();

  // جلب الرابط المستهدف من البيانات المرفقة بالإشعار
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : "dashboard.html";

  // محاولة فتح الرابط أو التركيز على نافذة مفتوحة بالفعل
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      // إذا كانت هناك نافذة مفتوحة لنفس الموقع، قم بالتركيز عليها وافتح الرابط
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(targetUrl) && "focus" in client) {
          client.navigate(targetUrl); // تحديث الرابط داخل النافذة المفتوحة
          return client.focus();
        }
      }
      // إذا لم تكن هناك نافذة مفتوحة، افتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});