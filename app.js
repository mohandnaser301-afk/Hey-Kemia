// =========================================================
// المنظومة البرمجية الموحدة لمنصة هي كيميا !
// =========================================================

function sanitizeText(str) {
  if (!str) return "";
  var temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}
window.sanitizeText = sanitizeText;

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
        '<div style="width:48px; height:48px; background:rgba(0,210,255,0.12); color:#0284C7; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; font-size:22px;">🧪</div>' +
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

function isStudentEnrolledInCourse(user, courseId) {
  if (!user || !user.enrolledCourses) return false;
  var targetId = String(courseId);
  return user.enrolledCourses.some(function(id) { return String(id) === targetId; });
}
window.isStudentEnrolledInCourse = isStudentEnrolledInCourse;

function getCurrentUser() {
  try {
    var data = localStorage.getItem("current_user") || localStorage.getItem("edu_currentUser");
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}
window.getCurrentUser = getCurrentUser;

function calculateStudentMetrics(userUid) {
  if (!userUid) return { enrolledCount: 0, completedExams: 0, avgScore: 0, totalHours: 0, enrolledList: [] };

  var users = JSON.parse(localStorage.getItem("edu_users")) || [];
  var targetUser = users.find(u => (u.uid && u.uid === userUid) || (u.id && u.id === userUid));

  var allCourses = JSON.parse(localStorage.getItem("edu_courses")) || [];
  var enrolledIds = (targetUser && targetUser.enrolledCourses) ? targetUser.enrolledCourses.map(String) : [];
  var enrolledCoursesList = allCourses.filter(c => enrolledIds.includes(String(c.id)));

  var submissions = JSON.parse(localStorage.getItem("edu_submissions")) || [];
  var userSubs = submissions.filter(s => (s.userUid && s.userUid === userUid) || (s.userEmail && targetUser && s.userEmail.toLowerCase() === targetUser.email.toLowerCase()));

  var avgScore = 0;
  if (userSubs.length > 0) {
    var totalPct = userSubs.reduce((acc, cur) => acc + (Number(cur.percentage) || 0), 0);
    avgScore = Math.round(totalPct / userSubs.length);
  }

  var tracking = JSON.parse(localStorage.getItem("edu_course_watch_logs")) || {};
  var totalSec = 0;
  Object.keys(tracking).forEach(cId => {
    if (tracking[cId] && tracking[cId][userUid]) {
      totalSec += tracking[cId][userUid].totalSeconds || 0;
    } else if (targetUser && tracking[cId] && tracking[cId][targetUser.email]) {
      totalSec += tracking[cId][targetUser.email].totalSeconds || 0;
    }
  });

  return {
    enrolledCount: enrolledCoursesList.length,
    enrolledList: enrolledCoursesList,
    completedExams: userSubs.length,
    submissionsList: userSubs,
    avgScore: avgScore,
    totalHours: Math.round(totalSec / 3600),
    totalSeconds: totalSec
  };
}
window.calculateStudentMetrics = calculateStudentMetrics;

function monitorCurrentUserStatus() {
  var user = getCurrentUser();
  if (!user || !user.uid) return;

  var interval = setInterval(function() {
    if (window.firebase && firebase.firestore) {
      clearInterval(interval);

      firebase.firestore().collection("users").doc(user.uid)
        .onSnapshot(function(docSnap) {
          if (!docSnap.exists) {
            forceLogoutUser();
          } else {
            var liveDoc = docSnap.data();
            liveDoc.uid = docSnap.id;

            var roleChanged = liveDoc.role !== user.role;
            var coursesChanged = JSON.stringify((liveDoc.enrolledCourses || []).map(String)) !== JSON.stringify((user.enrolledCourses || []).map(String));

            if (roleChanged || coursesChanged) {
              localStorage.setItem("current_user", JSON.stringify(liveDoc));
              localStorage.setItem("edu_currentUser", JSON.stringify(liveDoc));
              user = liveDoc;

              if (roleChanged) {
                showToast("تم تحديث رتبتك الإدارية إلى: " + liveDoc.role, "info", "تحديث الصلاحيات");
                setTimeout(function() { window.location.reload(); }, 600);
              } else if (coursesChanged) {
                showToast("تم تفعيل الكورس بنجاح في حسابك!", "success", "تفعيل المحتوى");
                if (typeof renderStudentDashboard === "function") renderStudentDashboard();
                if (typeof renderCoursesSection === "function") {
                  var allCourses = JSON.parse(localStorage.getItem("edu_courses")) || [];
                  renderCoursesSection(allCourses);
                }
              }
              updateNavbarAndAuthGuards();
            }
          }
        }, function() {
          forceLogoutUser();
        });
    }
  }, 200);
}

function forceLogoutUser() {
  localStorage.removeItem("current_user");
  localStorage.removeItem("edu_currentUser");
  if (window.firebase && firebase.auth) {
    try { firebase.auth().signOut(); } catch(e) {}
  }
  showToast("تم إنهاء الجلسة أو حذف الحساب.", "error", "تنبيه");
  setTimeout(function() { window.location.replace("login.html"); }, 400);
}

// -------------------------------------------------------------
// إدارة الإشعارات السحابية الموثوقة للمتصفح والموبايل
// -------------------------------------------------------------
var swRegistration = null;

function registerDeviceServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(function(reg) {
        swRegistration = reg;
      })
      .catch(function(err) {
        console.log("SW Register Error:", err);
      });
  }
}
window.registerDeviceServiceWorker = registerDeviceServiceWorker;

// دالة طلب إذن الإشعارات بنقرة المستخدم الصريحة
function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast("متصفحك لا يدعم الإشعارات المباشرة", "info");
    return Promise.resolve(false);
  }

  return Notification.requestPermission().then(function(perm) {
    if (perm === "granted") {
      showToast("تم تفعيل إشعارات الردود الفورية بنجاح 🔔", "success");
      return true;
    } else {
      showToast("تم رفض إذن الإشعارات من إعدادات المتصفح", "error");
      return false;
    }
  });
}
window.requestNotificationPermission = requestNotificationPermission;

function triggerDeviceNativeNotification(title, body, targetUrl) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  var url = targetUrl || "support.html";

  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "TRIGGER_NATIVE_NOTIFICATION",
      title: title,
      body: body,
      url: url
    });
  } else if (swRegistration && swRegistration.showNotification) {
    swRegistration.showNotification(title, {
      body: body,
      icon: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=192&q=80",
      data: { url: url }
    });
  } else {
    try {
      var n = new Notification(title, {
        body: body,
        icon: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=192&q=80"
      });
      n.onclick = function() {
        window.focus();
        window.location.href = url;
      };
    } catch (e) {}
  }
}
window.triggerDeviceNativeNotification = triggerDeviceNativeNotification;

function initRealtimeNotificationsReceiver() {
  var lastKnownNotifId = localStorage.getItem("hk_last_received_notif_id") || "";
  var isFirstLoad = true;

  var interval = setInterval(function() {
    if (window.FirebaseService && typeof window.FirebaseService.subscribeNotifications === "function") {
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

          if (user && latest.senderEmail && user.email && user.email.toLowerCase() === latest.senderEmail) return;

          var userUid = user ? String(user.uid || user.id || "") : "";
          var isStaff = user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "SUPPORT");

          if ((latest.targetUid === "ALL" && isStaff) || (userUid && String(latest.targetUid) === userUid)) {
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
window.showToast = showToast;

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

function logout() {
  if (window.FirebaseService) {
    window.FirebaseService.logoutUser();
  } else {
    localStorage.removeItem("current_user");
    localStorage.removeItem("edu_currentUser");
    window.location.href = "login.html";
  }
}
window.logout = logout;

function updateNavbarAndAuthGuards() {
  var user = getCurrentUser();
  var authBox = document.getElementById("navAuthBox");
  if (authBox) {
    if (user) {
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        authBox.innerHTML = '<a href="admin.html" class="nav-btn-primary">لوحة الإدارة</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
      } else if (user.role === "SUPPORT") {
        authBox.innerHTML = '<a href="support.html" class="nav-btn-primary">شات الدعم</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
      } else {
        authBox.innerHTML = '<a href="dashboard.html" class="nav-btn-primary">لوحة الطالب (' + sanitizeText(user.fullName ? user.fullName.split(" ")[0] : "") + ')</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
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
    setTimeout(function() { window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.href); }, 1200);
    return;
  }

  if (user.role !== "STUDENT") {
    showToast("الحسابات الإدارية تستعرض المحتوى مباشرة", "info");
    setTimeout(function() { window.location.href = "course-view.html?id=" + courseId; }, 600);
    return;
  }

  if (isStudentEnrolledInCourse(user, courseId)) {
    showToast("أنت مشترك بالفعل في هذا الكورس، جاري فتح المحاضرات...", "success");
    setTimeout(function() { window.location.href = "course-view.html?id=" + courseId; }, 600);
    return;
  }

  var courses = JSON.parse(localStorage.getItem("edu_courses")) || [];
  var course = courses.find(function(c) { return String(c.id) === String(courseId); });

  if (course && (course.isFree || Number(course.price) === 0)) {
    var confirmed = await customConfirm("هل تؤكد رغبتك في الاشتراك بالكورس المجاني: " + course.title + "؟", "تأكيد الاشتراك")[cite: 3];
    if (!confirmed) return;

    var newEnrolled = (user.enrolledCourses || []).map(String);
    if (!newEnrolled.includes(String(courseId))) newEnrolled.push(String(courseId));

    if (window.FirebaseService && user.uid) {
      await window.FirebaseService.updateUserEnrollmentsByUid(user.uid, newEnrolled, user.customAllowedLessons);
    }

    user.enrolledCourses = newEnrolled;
    localStorage.setItem("current_user", JSON.stringify(user));
    localStorage.setItem("edu_currentUser", JSON.stringify(user));
    showToast("تم تفعيل الكورس في حسابك بنجاح", "success");
    setTimeout(function() { window.location.href = "course-view.html?id=" + courseId; }, 800);
    return;
  }

  var proceed = await customConfirm("هل تريد الانتقال لصفحة تأكيد ودفع رسوم الكورس: " + (course ? course.title : "") + "؟", "الاشتراك بالكورس")[cite: 3];
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
    '<div class="loader-dynamic-phrase" id="loaderDynamicPhrase">جاري تحضير المحاليل والتأسيس...</div>' +
    '<div class="loader-counter-num" id="loaderCounterNum">0%</div>' +
    '<div class="loader-bar-outer"><div class="loader-bar-inner" id="loaderBarFill"></div></div>';

  document.body.prepend(preloader);

  var phrases = [
    "جاري إعداد بيئة التعلم التفاعلية...",
    "جاري مراجعة بنك الأسئلة والتدريبات...",
    "جاري الاتصال بالسيرفر الأكاديمي...",
    "جاهز للانطلاق مع أ/ محمد السعيد 🧪"
  ];

  var startTime = Date.now();
  var duration = 2600;
  var barFill = document.getElementById("loaderBarFill");
  var counterNum = document.getElementById("loaderCounterNum");
  var phraseEl = document.getElementById("loaderDynamicPhrase");

  var timer = setInterval(function() {
    var elapsed = Date.now() - startTime;
    var progress = Math.min(100, Math.round((elapsed / duration) * 100));

    if (barFill) barFill.style.width = progress + "%";
    if (counterNum) counterNum.innerText = progress + "%";

    if (phraseEl) {
      if (progress < 25) phraseEl.innerText = phrases[0];
      else if (progress < 60) phraseEl.innerText = phrases[1];
      else if (progress < 90) phraseEl.innerText = phrases[2];
      else phraseEl.innerText = phrases[3];
    }

    if (progress >= 100) {
      clearInterval(timer);
      setTimeout(function() {
        preloader.classList.add("hide-preloader");
        setTimeout(function() { preloader.remove(); }, 500);
      }, 120);
    }
  }, 30);
}

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
      window.FirebaseService.subscribeUsers();
      window.FirebaseService.subscribeSubmissions();
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
});