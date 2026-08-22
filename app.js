// =========================================================
// المحرك البرمجي وحصن الأمان لمنصة هي كيميا !
// مزامنة فورية كاملة + استماع للإشعارات السحابية + مشغل الفيديو
// =========================================================

function sanitizeText(str) {
  if (!str) return "";
  var temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

// 1. نافذة تأكيد مخصصة (Custom Modal)
function customConfirm(message, title, confirmText, cancelText) {
  title = title || "تأكيد الإجراء";
  confirmText = confirmText || "تأكيد";
  cancelText = cancelText || "إلغاء";

  return new Promise(function(resolve) {
    var existing = document.getElementById("hkCustomConfirmModal");
    if (existing) existing.remove();

    var modal = document.createElement("div");
    modal.id = "hkCustomConfirmModal";
    modal.style.cssText = "position:fixed; inset:0; background:rgba(8,10,33,0.78); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:999999; padding:16px;";
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

// 2. فحص وتنبيه تفعيل الإشعارات على الموبايل
function checkAndPromptNotifications() {
  if (localStorage.getItem("hk_notif_prompt_handled") === "true") return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    localStorage.setItem("hk_notif_prompt_handled", "true");
    return;
  }

  var existing = document.getElementById("hkMandatoryNotifModal");
  if (existing) return;

  var modal = document.createElement("div");
  modal.id = "hkMandatoryNotifModal";
  modal.style.cssText = "position:fixed; inset:0; background:rgba(8,10,33,0.85); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; z-index:999998; padding:16px;";
  modal.innerHTML = 
    '<div style="background:#ffffff; color:#191b26; border-radius:20px; padding:28px 24px; max-width:440px; width:100%; box-shadow:0 25px 50px rgba(0,0,0,0.4); text-align:center; border:2px solid #00D2FF;">' +
      '<div style="width:56px; height:56px; background:rgba(0,210,255,0.14); color:#0284C7; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; font-size:26px;">🔔</div>' +
      '<h3 style="font-size:18px; font-weight:900; color:#0E1338; margin-bottom:8px;">تفعيل إشعارات المنصة</h3>' +
      '<p style="font-size:13.5px; color:#64748B; margin-bottom:20px; line-height:1.6;">' +
        'لضمان استلام مواعيد المحاضرات الجديدة، نتائج الامتحانات، واعتمادات الدفع فوراً على هاتفك، يُرجى تفعيل الإشعارات.' +
      '</p>' +
      '<div style="display:flex; gap:10px;">' +
        '<button id="hkAllowNotifBtn" style="flex:2; padding:12px; background:linear-gradient(135deg, #00D2FF, #0284C7); color:#fff; border:none; border-radius:12px; font-weight:900; font-size:14px; cursor:pointer;">تفعيل الإشعارات الآن 🔔</button>' +
        '<button id="hkDismissNotifBtn" style="flex:1; padding:12px; background:#F1F5F9; color:#64748B; border:1px solid #CBD5E1; border-radius:12px; font-weight:800; font-size:13px; cursor:pointer;">لاحقاً</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);

  document.getElementById("hkAllowNotifBtn").onclick = function() {
    modal.remove();
    localStorage.setItem("hk_notif_prompt_handled", "true");
    Notification.requestPermission().then(function(permission) {
      if (permission === "granted") {
        showToast("تم تفعيل إشعارات المنصة بنجاح على جهازك", "success");
        updateNavbarAndAuthGuards();
      }
    });
  };

  document.getElementById("hkDismissNotifBtn").onclick = function() {
    modal.remove();
    localStorage.setItem("hk_notif_prompt_handled", "true");
  };
}
window.checkAndPromptNotifications = checkAndPromptNotifications;

var swRegistration = null;
function registerDeviceServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(function(reg) { swRegistration = reg; })
      .catch(function(err) { console.log("SW Error:", err); });
  }
}

async function sendSystemPushNotification(title, body, targetEmail, targetUrl) {
  var user = getCurrentUser() || {};
  if (window.FirebaseService) {
    try {
      await window.FirebaseService.pushNotificationToCloud(title, body, targetEmail, targetUrl, user.email);
    } catch(e) {}
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
  } else if (swRegistration && swRegistration.showNotification) {
    swRegistration.showNotification(title, {
      body: body,
      icon: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=192&q=80",
      data: { url: targetUrl || "dashboard.html" }
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

// 3. المراقبة اللحظية الصارمة لطرد الحساب المحذوف فوراً
function monitorCurrentUserStatus() {
  var user = getCurrentUser();
  if (!user || !user.email) return;

  var interval = setInterval(function() {
    if (window.firebase && firebase.firestore) {
      clearInterval(interval);
      
      var docRef = user.uid ? firebase.firestore().collection("users").doc(user.uid) : null;
      if (docRef) {
        docRef.onSnapshot(function(docSnap) {
          if (!docSnap.exists) {
            forceLogoutUser();
          } else {
            var updated = docSnap.data();
            if (updated.role !== user.role || JSON.stringify(updated.enrolledCourses) !== JSON.stringify(user.enrolledCourses)) {
              localStorage.setItem("current_user", JSON.stringify(updated));
              updateNavbarAndAuthGuards();
            }
          }
        }, function() {
          forceLogoutUser();
        });
      }
    }
  }, 200);
}

function forceLogoutUser() {
  localStorage.removeItem("current_user");
  if (window.firebase && firebase.auth) {
    try { firebase.auth().signOut(); } catch(e) {}
  }
  showToast("تم حذف هذا الحساب من قِبل الإدارة.", "error", "تنبيه أمني");
  setTimeout(function() {
    window.location.replace("login.html");
  }, 500);
}

// 4. استماع لحظي للإشعارات السحابية وبثها على أجهزة الطلاب فقط دون الأدمن المرسل
function initRealtimeNotificationsReceiver() {
  var lastKnownNotifId = localStorage.getItem("hk_last_received_notif_id") || "";
  var isFirstLoad = true;

  var interval = setInterval(function() {
    if (window.FirebaseService && window.firebase && firebase.firestore) {
      clearInterval(interval);
      window.FirebaseService.subscribeNotifications(function(notifs) {
        if (!notifs || notifs.length === 0) return;
        var user = getCurrentUser();

        if (isFirstLoad) {
          isFirstLoad = false;
          if (notifs[0]) localStorage.setItem("hk_last_received_notif_id", notifs[0].id);
          return;
        }

        var latest = notifs[0];
        if (latest && latest.id !== lastKnownNotifId) {
          lastKnownNotifId = latest.id;
          localStorage.setItem("hk_last_received_notif_id", latest.id);

          // عدم إرسال إشعار للمرسل (الأدمن) نفسه
          if (user && latest.senderEmail && user.email.toLowerCase() === latest.senderEmail) {
            return;
          }

          if (!user && latest.targetEmail !== "ALL") return;
          if (user && (latest.targetEmail === "ALL" || latest.targetEmail === user.email)) {
            triggerDeviceNativeNotification(latest.title, latest.body, latest.targetUrl);
            showToast(latest.body, "info", latest.title);
          }
        }
      });
    }
  }, 250);
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
    setTimeout(function() { toast.remove(); }, 300);
  }, 4000);
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
        var isNotifActive = ("Notification" in window) && Notification.permission === "granted";
        var notifBtn = isNotifActive ? "" : '<button onclick="checkAndPromptNotifications()" class="notif-bell-btn" title="تفعيل الإشعارات">🔔</button>';
        authBox.innerHTML = notifBtn + '<a href="dashboard.html" class="nav-btn-primary">لوحة الطالب (' + sanitizeText(user.fullName.split(" ")[0]) + ')</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
      }
    } else {
      authBox.innerHTML = '<a href="login.html" class="nav-btn-link">تسجيل الدخول</a><a href="register.html" class="nav-btn-primary">حساب جديد</a>';
    }
  }
}

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

// 5. شاشة اللودينج الكيميائية
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
  var duration = 1400;
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
      }, 60);
    }
  }, 25);
}

// 6. استماع لحظي عام للكورسات والامتحانات
function initGlobalRealtimeSync() {
  var interval = setInterval(function() {
    if (window.FirebaseService && window.firebase && firebase.firestore) {
      clearInterval(interval);
      window.FirebaseService.subscribeCourses(function(courses) {
        if (typeof renderCoursesSection === "function") renderCoursesSection(courses);
      });
      window.FirebaseService.subscribeExams(function(exams) {
        if (typeof renderGeneralExams === "function") renderGeneralExams(exams);
      });
    }
  }, 250);
}

document.addEventListener("DOMContentLoaded", function() {
  injectChemicalPreloader();
  registerDeviceServiceWorker();
  updateNavbarAndAuthGuards();
  monitorCurrentUserStatus();
  initGlobalRealtimeSync();
  initRealtimeNotificationsReceiver();

  var currentUser = getCurrentUser();
  if (currentUser && currentUser.role === "STUDENT") {
    if (localStorage.getItem("hk_notif_prompt_handled") !== "true") {
      setTimeout(checkAndPromptNotifications, 1200);
    }
  }
});