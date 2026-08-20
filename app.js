// =========================================================
// المحرك البرمجي وحصن الأمان لمنصة هي كيميا !
// مزامنة لحظية في الوقت الفعلي + نوافذ مخصصة
// =========================================================

function sanitizeText(str) {
  if (!str) return "";
  var temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

// 1. نافذة تأكيد مخصصة للموقع (Custom Confirmation Modal)
function customConfirm(message, title, confirmText, cancelText) {
  title = title || "تأكيد الإجراء";
  confirmText = confirmText || "تأكيد";
  cancelText = cancelText || "إلغاء";

  return new Promise(function(resolve) {
    var existing = document.getElementById("hkCustomConfirmModal");
    if (existing) existing.remove();

    var modal = document.createElement("div");
    modal.id = "hkCustomConfirmModal";
    modal.style.cssText = "position:fixed; inset:0; background:rgba(8,10,33,0.78); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:999999; padding:16px; animation:fadeInModal 0.2s ease;";
    modal.innerHTML = 
      '<div style="background:#ffffff; color:#191b26; border-radius:18px; padding:24px; max-width:420px; width:100%; box-shadow:0 20px 45px rgba(0,0,0,0.35); text-align:center; border:1px solid rgba(0,210,255,0.2);">' +
        '<div style="width:48px; height:48px; background:rgba(0,210,255,0.12); color:#0284C7; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; font-size:22px;">❓</div>' +
        '<h3 style="font-size:17px; font-weight:900; color:#0E1338; margin-bottom:8px;">' + sanitizeText(title) + '</h3>' +
        '<p style="font-size:13.5px; color:#64748B; margin-bottom:22px; line-height:1.6;">' + sanitizeText(message) + '</p>' +
        '<div style="display:flex; gap:10px; justify-content:center;">' +
          '<button id="hkModalBtnConfirm" style="flex:1; padding:11px 18px; background:linear-gradient(135deg, #0E1338, #1D255E); color:#fff; border:none; border-radius:10px; font-weight:800; font-size:13.5px; cursor:pointer;">' + sanitizeText(confirmText) + '</button>' +
          '<button id="hkModalBtnCancel" style="flex:1; padding:11px 18px; background:#F1F5F9; color:#475569; border:1px solid #CBD5E1; border-radius:10px; font-weight:800; font-size:13.5px; cursor:pointer;">' + sanitizeText(cancelText) + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    document.getElementById("hkModalBtnConfirm").onclick = function() {
      modal.remove();
      resolve(true);
    };

    document.getElementById("hkModalBtnCancel").onclick = function() {
      modal.remove();
      resolve(false);
    };
  });
}
window.customConfirm = customConfirm;

// 2. نظام الإشعارات
var swRegistration = null;
function registerDeviceServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(function(reg) { swRegistration = reg; })
      .catch(function(err) { console.log("Service Worker: ", err); });
  }
}

function requestNotificationPermission(callback) {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      if (callback) callback(true);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function(p) {
        if (callback) callback(p === "granted");
      });
    } else {
      if (callback) callback(false);
    }
  } else {
    if (callback) callback(false);
  }
}

function sendSystemPushNotification(title, body, targetEmail, targetUrl) {
  var notifications = JSON.parse(localStorage.getItem("edu_system_notifications")) || [];
  notifications.unshift({
    id: "NOTIF_" + Date.now(),
    title: title,
    body: body,
    targetEmail: targetEmail || "ALL",
    targetUrl: targetUrl || "dashboard.html",
    timestamp: new Date().toLocaleString("ar-EG")
  });
  localStorage.setItem("edu_system_notifications", JSON.stringify(notifications));

  var currentUser = getCurrentUser();
  if (currentUser && (targetEmail === "ALL" || targetEmail === currentUser.email)) {
    triggerDeviceNativeNotification(title, body, targetUrl);
    showToast(body, "info", title);
  }
}

function triggerDeviceNativeNotification(title, body, targetUrl) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "TRIGGER_NATIVE_NOTIFICATION",
      title: title,
      body: body,
      url: targetUrl || "dashboard.html"
    });
  } else {
    try {
      var n = new Notification(title, {
        body: body,
        icon: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=192&q=80"
      });
      n.onclick = function() {
        window.focus();
        window.location.href = targetUrl || "dashboard.html";
      };
    } catch (e) {}
  }
}

// 3. مراقبة أمان وحماية الصفحة
function recordSecurityBreach(attackType, details, severity) {
  severity = severity || "HIGH";
  var currentUser = getCurrentUser() || { fullName: "غير مسجل", email: "guest@threat.net" };
  var breaches = JSON.parse(localStorage.getItem("edu_hacker_logs")) || [];
  breaches.unshift({
    id: "HCK_" + Date.now(),
    timestamp: new Date().toLocaleString("ar-EG"),
    userName: sanitizeText(currentUser.fullName),
    userEmail: sanitizeText(currentUser.email),
    attackType: sanitizeText(attackType),
    details: sanitizeText(details),
    severity: severity,
    userAgent: navigator.userAgent
  });
  localStorage.setItem("edu_hacker_logs", JSON.stringify(breaches));
}

function initSecurityGuards() {
  document.addEventListener("keydown", function(e) {
    if (
      e.key === "F12" || 
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
      (e.ctrlKey && (e.key === "u" || e.key === "U" || e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P"))
    ) {
      if (!window.location.pathname.includes("admin.html")) {
        e.preventDefault();
        recordSecurityBreach("محاولة فتح أدوات المطور", "الاختصار: " + e.key, "MEDIUM");
        showToast("محتوى المنصة محمي بأنظمة الأمان", "error", "تنبيه أمان");
      }
    }
  });
}

// 4. مراقبة وجود الحساب وتسجيل الخروج اللحظي إذا تم حذفه من قاعدة البيانات
function monitorCurrentUserStatus() {
  var user = getCurrentUser();
  if (!user || !user.uid) return;

  var interval = setInterval(function() {
    if (window.firebase && firebase.firestore) {
      clearInterval(interval);
      firebase.firestore().collection("users").doc(user.uid).onSnapshot(function(docSnap) {
        if (!docSnap.exists) {
          localStorage.removeItem("current_user");
          showToast("تم تعطيل أو حذف هذا الحساب من قِبل الإدارة.", "error", "تنبيه الحساب");
          setTimeout(function() {
            window.location.href = "login.html";
          }, 1500);
        } else {
          var updated = docSnap.data();
          if (updated.role !== user.role || JSON.stringify(updated.enrolledCourses) !== JSON.stringify(user.enrolledCourses)) {
            localStorage.setItem("current_user", JSON.stringify(updated));
            updateNavbarAndAuthGuards();
          }
        }
      }, function(err) {
        console.warn("مراقبة الحساب:", err.message);
      });
    }
  }, 300);
}

function showToast(message, type, title) {
  type = type || "info";
  title = title || (type === "success" ? "تم بنجاح" : type === "error" ? "تنبيه" : "إشعار");

  var container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);
  }

  var toast = document.createElement("div");
  toast.className = "toast-notification " + type;
  toast.innerHTML = 
    '<div class="toast-content">' +
      '<span class="toast-title">' + sanitizeText(title) + '</span>' +
      '<span class="toast-message">' + sanitizeText(message) + '</span>' +
    '</div>' +
    '<button class="toast-close" onclick="this.parentElement.remove()">✕</button>';

  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-30px)";
    setTimeout(function() { toast.remove(); }, 300);
  }, 4500);
}

function logAdminAction(actionType, details) {
  var user = getCurrentUser() || { fullName: "غير مسجل", role: "GUEST" };
  var logs = JSON.parse(localStorage.getItem("edu_activity_logs")) || [];
  logs.unshift({
    id: Date.now(),
    actorName: sanitizeText(user.fullName),
    actorRole: sanitizeText(user.role),
    actionType: sanitizeText(actionType),
    details: sanitizeText(details),
    timestamp: new Date().toLocaleString("ar-EG")
  });
  localStorage.setItem("edu_activity_logs", JSON.stringify(logs));
}

function getCurrentUser() {
  var data = localStorage.getItem("current_user");
  return data ? JSON.parse(data) : null;
}

function logout() {
  if (window.FirebaseService) {
    window.FirebaseService.logoutUser();
  } else {
    localStorage.removeItem("current_user");
    window.location.href = "login.html";
  }
}

function updateNavbarAndAuthGuards() {
  var user = getCurrentUser();
  var currentPath = window.location.pathname.toLowerCase();

  if (currentPath.includes("admin.html")) {
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      recordSecurityBreach("دخول غير مصرح للإدارة", "محاولة فتح لوحة الإدارة", "CRITICAL");
      window.location.replace("login.html");
      return;
    }
  }

  if (currentPath.includes("dashboard.html")) {
    if (!user) { window.location.replace("login.html"); return; }
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") { window.location.replace("admin.html"); return; }
    if (user.role === "SUPPORT") { window.location.replace("support.html"); return; }
  }

  if (currentPath.includes("course-view.html") || currentPath.includes("exam.html")) {
    if (!user) { window.location.replace("login.html"); return; }
  }

  if (user && (currentPath.includes("login.html") || currentPath.includes("register.html"))) {
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      window.location.replace("admin.html");
    } else if (user.role === "SUPPORT") {
      window.location.replace("support.html");
    } else {
      window.location.replace("dashboard.html");
    }
    return;
  }

  var authBox = document.getElementById("navAuthBox");
  if (authBox) {
    if (user) {
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        authBox.innerHTML = '<a href="admin.html" class="nav-btn-primary">لوحة الإدارة</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
      } else if (user.role === "SUPPORT") {
        authBox.innerHTML = '<a href="support.html" class="nav-btn-primary">شات الدعم</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
      } else {
        var notifStatus = (window.Notification && Notification.permission === "granted") ? "" : '<button onclick="enablePushNotifications()" class="notif-bell-btn" title="تفعيل الإشعارات">🔔</button>';
        authBox.innerHTML = notifStatus + '<a href="dashboard.html" class="nav-btn-primary">لوحة الطالب (' + sanitizeText(user.fullName.split(" ")[0]) + ')</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
      }
    } else {
      authBox.innerHTML = '<a href="login.html" class="nav-btn-link">تسجيل الدخول</a><a href="register.html" class="nav-btn-primary">حساب جديد</a>';
    }
  }
}

window.enablePushNotifications = function() {
  requestNotificationPermission(function(granted) {
    if (granted) {
      showToast("تم تفعيل إشعارات الجهاز بنجاح", "success");
      updateNavbarAndAuthGuards();
    } else {
      showToast("يرجى السماح بالإشعارات من إعدادات المتصفح", "error");
    }
  });
};

async function handleEnrollClick(courseId) {
  var user = getCurrentUser();
  if (!user) {
    showToast("يرجى تسجيل الدخول أولاً للاشتراك في الكورس", "info");
    setTimeout(function() {
      window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.href);
    }, 1200);
    return;
  }

  if (user.role !== "STUDENT") {
    showToast("الحسابات الإدارية تستعرض المحتوى مباشرة", "info");
    setTimeout(function() { window.location.href = "course-view.html?id=" + courseId; }, 800);
    return;
  }

  if (user.enrolledCourses && user.enrolledCourses.includes(courseId)) {
    showToast("أنت مشترك بالفعل في هذا الكورس", "success");
    setTimeout(function() { window.location.href = "course-view.html?id=" + courseId; }, 800);
    return;
  }

  var courses = JSON.parse(localStorage.getItem("edu_courses")) || [];
  var course = courses.find(function(c) { return c.id == courseId; });

  if (course && (course.isFree || Number(course.price) === 0)) {
    var confirmed = await customConfirm("هل تؤكد رغبتك في الاشتراك بالكورس المجاني: " + course.title + "؟", "تأكيد الاشتراك");
    if (!confirmed) return;

    var users = JSON.parse(localStorage.getItem("edu_users")) || [];
    var uIdx = users.findIndex(function(u) { return u.email === user.email; });
    if (uIdx !== -1) {
      if (!users[uIdx].enrolledCourses) users[uIdx].enrolledCourses = [];
      users[uIdx].enrolledCourses.push(courseId);

      if (window.FirebaseService && users[uIdx].uid) {
        try {
          await window.FirebaseService.updateUserPermissions(users[uIdx].uid, users[uIdx].enrolledCourses, users[uIdx].customAllowedLessons);
        } catch (e) {}
      }

      localStorage.setItem("edu_users", JSON.stringify(users));
      user.enrolledCourses = users[uIdx].enrolledCourses;
      localStorage.setItem("current_user", JSON.stringify(user));

      showToast("تم تفعيل الكورس في حسابك بنجاح", "success");
      setTimeout(function() { window.location.href = "course-view.html?id=" + courseId; }, 1000);
      return;
    }
  }

  var proceed = await customConfirm("هل تريد الانتقال لصفحة تأكيد ودفع رسوم الكورس: " + (course ? course.title : "") + "؟", "الاشتراك بالكورس");
  if (proceed) {
    window.location.href = "checkout.html?course=" + courseId;
  }
}

window.handleHeroEnroll = function() {
  var user = getCurrentUser();
  if (user) {
    if (user.role === "STUDENT") window.location.href = "#courses";
    else window.location.href = "admin.html";
  } else {
    window.location.href = "register.html";
  }
};

window.handleEnrollClick = handleEnrollClick;
window.logout = logout;

// اللودر الكيميائي
function injectChemicalPreloader() {
  if (document.getElementById("chemicalPreloader")) return;
  var preloader = document.createElement("div");
  preloader.id = "chemicalPreloader";
  preloader.innerHTML = 
    '<div class="lab-stage-container">' +
      '<div class="atomic-ring-1"><div class="electron-dot"></div></div>' +
      '<div class="atomic-ring-2"><div class="electron-dot"></div></div>' +
      '<div class="test-tube left-tube"><div class="tube-liquid"></div></div>' +
      '<div class="test-tube right-tube"><div class="tube-liquid"></div></div>' +
      '<div class="flask-steam"></div>' +
      '<div class="main-flask-neck"></div>' +
      '<div class="main-flask-box">' +
        '<div class="flask-liquid-core"></div>' +
        '<div class="lab-bubble"></div>' +
        '<div class="lab-bubble"></div>' +
      '</div>' +
    '</div>' +
    '<div class="loader-brand-title">منصة هي كيميا<span>!</span></div>' +
    '<div class="loader-dynamic-phrase" id="loaderDynamicPhrase">جاري تحميل المنصة...</div>' +
    '<div class="loader-counter-num" id="loaderCounterNum">0%</div>' +
    '<div class="loader-bar-outer"><div class="loader-bar-inner" id="loaderBarFill"></div></div>';

  document.body.prepend(preloader);

  var startTime = Date.now();
  var duration = 1500;
  var barFill = document.getElementById("loaderBarFill");
  var counterNum = document.getElementById("loaderCounterNum");

  var timer = setInterval(function() {
    var elapsed = Date.now() - startTime;
    var progress = Math.min(100, Math.round((elapsed / duration) * 100));

    if (barFill) barFill.style.width = progress + "%";
    if (counterNum) counterNum.innerText = progress + "%";

    if (progress >= 100) {
      clearInterval(timer);
      setTimeout(function() {
        preloader.classList.add("hide-preloader");
        setTimeout(function() { preloader.remove(); }, 350);
      }, 80);
    }
  }, 25);
}

document.addEventListener("DOMContentLoaded", function() {
  registerDeviceServiceWorker();
  initSecurityGuards();
  injectChemicalPreloader();
  updateNavbarAndAuthGuards();
  monitorCurrentUserStatus();
});