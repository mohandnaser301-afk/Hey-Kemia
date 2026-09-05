// =========================================================
// المنظومة البرمجية الموحدة لمنصة هي كيميا !
// =========================================================

function sanitizeText(str) {
  if (!str) return "";
  var temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

function customConfirm(message, title, confirmText, cancelText) {
  title = title || "تأكيد الإجراء";
  confirmText = confirmText || "تأكيد";
  cancelText = cancelText || "إلغاء";

  return new Promise(function(resolve) {
    try {
      var existing = document.getElementById("hkCustomConfirmModal");
      if (existing) existing.remove();

      var modal = document.createElement("div");
      modal.id = "hkCustomConfirmModal";
      modal.style.cssText = "position:fixed; inset:0; background:rgba(8,10,33,0.78); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:999999; padding:16px;";
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
    } catch (e) {
      resolve(confirm(message));
    }
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

// =========================================================
// منظومة إدارة وحماية الأجهزة والجلسات المسجلة
// =========================================================

function getOrCreateDeviceId() {
  var devId = localStorage.getItem("hk_device_id");
  if (!devId) {
    devId = "dev_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("hk_device_id", devId);
  }
  return devId;
}

function detectCurrentDeviceInfo() {
  var ua = navigator.userAgent;
  var browser = "متصفح غير معروف";
  var os = "نظام غير معروف";
  var type = "كمبيوتر";

  if (/Mobi|Android|iPhone/i.test(ua)) {
    type = "هاتف محمول";
  } else if (/iPad|Tablet/i.test(ua)) {
    type = "تابلت / لوحي";
  }

  if (ua.indexOf("Win") !== -1) os = "Windows";
  else if (ua.indexOf("Mac") !== -1) os = "MacOS / iOS";
  else if (ua.indexOf("Linux") !== -1) os = "Linux / Android";

  if (ua.indexOf("Chrome") !== -1 && ua.indexOf("Edg") === -1) browser = "Google Chrome";
  else if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) browser = "Apple Safari";
  else if (ua.indexOf("Firefox") !== -1) browser = "Mozilla Firefox";
  else if (ua.indexOf("Edg") !== -1) browser = "Microsoft Edge";

  return {
    deviceId: getOrCreateDeviceId(),
    deviceType: type,
    os: os,
    browser: browser,
    platformName: os + " (" + browser + ")",
    lastLogin: new Date().toLocaleString("ar-EG")
  };
}

function registerCurrentDeviceSession() {
  try {
    var user = getCurrentUser();
    if (!user || !user.uid) return;

    var currentDev = detectCurrentDeviceInfo();
    var devices = user.devices || [];

    var existsIdx = devices.findIndex(function(d) { return d.deviceId === currentDev.deviceId; });
    if (existsIdx > -1) {
      devices[existsIdx].os = currentDev.os;
      devices[existsIdx].browser = currentDev.browser;
      devices[existsIdx].deviceType = currentDev.deviceType;
      devices[existsIdx].lastLogin = currentDev.lastLogin;
    } else {
      devices.push(currentDev);
    }

    user.devices = devices;
    localStorage.setItem("current_user", JSON.stringify(user));
    localStorage.setItem("edu_currentUser", JSON.stringify(user));

    if (typeof firebase !== "undefined" && firebase.firestore) {
      firebase.firestore().collection("users").doc(user.uid).set({
        devices: devices
      }, { merge: true }).catch(function(){});
    }
  } catch (e) {}
}

async function revokeDeviceSession(targetUid, deviceIdToRevoke) {
  var user = getCurrentUser();
  var isSuper = user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN");

  if (!isSuper && (!user || user.uid !== targetUid)) {
    showToast("غير مصرح لك بتنفيذ هذا الإجراء", "error");
    return;
  }

  var confirmed = await customConfirm("هل تريد تسجيل الخروج من هذا الجهاز وإنهاء جلسته؟", "تسجيل خروج الجهاز");
  if (!confirmed) return;

  var targetUser = user;
  var usersList = JSON.parse(localStorage.getItem("edu_users")) || [];
  if (isSuper) {
    var found = usersList.find(function(u) { return (u.uid && u.uid === targetUid) || (u.id && u.id === targetUid); });
    if (found) targetUser = found;
  }

  var updatedDevices = (targetUser.devices || []).filter(function(d) { return d.deviceId !== deviceIdToRevoke; });
  targetUser.devices = updatedDevices;

  if (user && user.uid === targetUid) {
    user.devices = updatedDevices;
    localStorage.setItem("current_user", JSON.stringify(user));
    localStorage.setItem("edu_currentUser", JSON.stringify(user));
  }

  var userIdx = usersList.findIndex(function(u) { return (u.uid && u.uid === targetUid) || (u.id && u.id === targetUid); });
  if (userIdx > -1) {
    usersList[userIdx].devices = updatedDevices;
    localStorage.setItem("edu_users", JSON.stringify(usersList));
  }

  if (typeof firebase !== "undefined" && firebase.firestore) {
    try {
      await firebase.firestore().collection("users").doc(targetUid).update({
        devices: updatedDevices
      });
    } catch (e) {}
  }

  showToast("تم تسجيل خروج الجهاز بنجاح", "success");

  var thisDevId = getOrCreateDeviceId();
  if (deviceIdToRevoke === thisDevId && (!user || user.uid === targetUid)) {
    forceLogoutUser();
    return;
  }

  if (typeof renderStudentDevicesList === "function") renderStudentDevicesList();
  if (typeof renderAdminUserDevices === "function") renderAdminUserDevices(targetUid);
}
window.revokeDeviceSession = revokeDeviceSession;

function renderStudentDevicesList(containerId) {
  var targetId = containerId || "studentDevicesContainer";
  var container = document.getElementById(targetId);
  if (!container) return;

  var user = getCurrentUser();
  if (!user) {
    container.innerHTML = '<p style="font-size:13px; color:#64748B; text-align:center;">يرجى تسجيل الدخول لعرض أجهزتك</p>';
    return;
  }

  var currentDevId = getOrCreateDeviceId();
  var devices = user.devices || [];

  if (devices.length === 0) {
    devices = [detectCurrentDeviceInfo()];
  }

  var html = '<div style="display:flex; flex-direction:column; gap:12px;">';
  devices.forEach(function(dev) {
    var isCurrent = dev.deviceId === currentDevId;
    var icon = dev.deviceType === "هاتف محمول" ? "📱" : (dev.deviceType === "تابلت / لوحي" ? "📟" : "💻");

    html += `
      <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.04); border:1px solid ${isCurrent ? 'rgba(0, 210, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)'}; border-radius:12px; padding:12px 16px; transition:0.2s;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-size:24px; background:rgba(0,210,255,0.1); width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center;">${icon}</div>
          <div>
            <div style="font-size:14px; font-weight:800; color:#fff; display:flex; align-items:center; gap:8px;">
              ${sanitizeText(dev.platformName || dev.os)}
              ${isCurrent ? '<span style="font-size:11px; background:#00D2FF; color:#0E1338; font-weight:900; padding:2px 8px; border-radius:6px;">هذا الجهاز</span>' : ''}
            </div>
            <div style="font-size:12px; color:#94A3B8; margin-top:2px;">النوع: ${sanitizeText(dev.deviceType)} | آخر ظهور: ${sanitizeText(dev.lastLogin || "الآن")}</div>
          </div>
        </div>
        <div>
          ${!isCurrent ? `<button onclick="revokeDeviceSession('${user.uid}', '${dev.deviceId}')" style="background:#EF4444; color:#fff; border:none; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;">تسجيل خروج</button>` : ''}
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}
window.renderStudentDevicesList = renderStudentDevicesList;

function renderAdminUserDevices(targetUid, containerId) {
  var targetId = containerId || "adminUserDevicesContainer";
  var container = document.getElementById(targetId);
  if (!container) return;

  var users = JSON.parse(localStorage.getItem("edu_users")) || [];
  var targetUser = users.find(function(u) { return (u.uid && u.uid === targetUid) || (u.id && u.id === targetUid); });

  if (!targetUser) {
    container.innerHTML = '<p style="font-size:13px; color:#64748B; text-align:center;">لم يتم العثور على الحساب</p>';
    return;
  }

  var devices = targetUser.devices || [];
  if (devices.length === 0) {
    container.innerHTML = '<p style="font-size:13px; color:#94A3B8; text-align:center; padding:10px;">لا توجد أجهزة مسجلة لهذا الحساب حالياً.</p>';
    return;
  }

  var html = '<div style="display:flex; flex-direction:column; gap:10px;">';
  devices.forEach(function(dev) {
    var icon = dev.deviceType === "هاتف محمول" ? "📱" : "💻";
    html += `
      <div style="display:flex; align-items:center; justify-content:space-between; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px 14px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:20px;">${icon}</span>
          <div>
            <div style="font-size:13px; font-weight:800; color:#0E1338;">${sanitizeText(dev.platformName || dev.os)}</div>
            <div style="font-size:11.5px; color:#64748B;">النوع: ${sanitizeText(dev.deviceType)} | النشاط: ${sanitizeText(dev.lastLogin || "غير محدد")}</div>
          </div>
        </div>
        <button onclick="revokeDeviceSession('${targetUser.uid || targetUser.id}', '${dev.deviceId}')" style="background:#FEE2E2; color:#DC2626; border:1px solid #FCA5A5; padding:5px 10px; border-radius:6px; font-size:11.5px; font-weight:800; cursor:pointer;">إنهاء الجلسة</button>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}
window.renderAdminUserDevices = renderAdminUserDevices;

function calculateStudentMetrics(userUid) {
  if (!userUid) return { enrolledCount: 0, completedExams: 0, avgScore: 0, totalHours: 0, enrolledList: [] };

  try {
    var users = JSON.parse(localStorage.getItem("edu_users")) || [];
    var targetUser = users.find(function(u) { return (u.uid && u.uid === userUid) || (u.id && u.id === userUid); });

    var allCourses = JSON.parse(localStorage.getItem("edu_courses")) || [];
    var enrolledIds = (targetUser && targetUser.enrolledCourses) ? targetUser.enrolledCourses.map(String) : [];
    var enrolledCoursesList = allCourses.filter(function(c) { return enrolledIds.includes(String(c.id)); });

    var submissions = JSON.parse(localStorage.getItem("edu_submissions")) || [];
    var userSubs = submissions.filter(function(s) { 
      return (s.userUid && s.userUid === userUid) || 
             (s.userEmail && targetUser && s.userEmail.toLowerCase() === targetUser.email.toLowerCase()); 
    });

    var avgScore = 0;
    if (userSubs.length > 0) {
      var totalPct = userSubs.reduce(function(acc, cur) { return acc + (Number(cur.percentage) || 0); }, 0);
      avgScore = Math.round(totalPct / userSubs.length);
    }

    var tracking = JSON.parse(localStorage.getItem("edu_course_watch_logs")) || {};
    var totalSec = 0;
    Object.keys(tracking).forEach(function(cId) {
      if (tracking[cId] && tracking[cId][userUid]) {
        totalSec += tracking[cId][userUid].totalSeconds || 0;
      } else if (targetUser && tracking[cId][targetUser.email]) {
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
  } catch (err) {
    return { enrolledCount: 0, completedExams: 0, avgScore: 0, totalHours: 0, enrolledList: [] };
  }
}
window.calculateStudentMetrics = calculateStudentMetrics;

function monitorCurrentUserStatus() {
  var user = getCurrentUser();
  if (!user || !user.uid) return;

  var currentDeviceId = getOrCreateDeviceId();
  var attempts = 0;
  var interval = setInterval(function() {
    attempts++;
    if (typeof firebase !== "undefined" && firebase.firestore) {
      clearInterval(interval);

      try {
        firebase.firestore().collection("users").doc(user.uid)
          .onSnapshot(function(docSnap) {
            if (!docSnap.exists) {
              return;
            } else {
              var liveDoc = docSnap.data();
              liveDoc.uid = docSnap.id;

              // إلغاء طرد الدخول المفاجئ، لا يطرد إلا إذا كان الجهاز قد تسجل بنجاح ثم أزيل عمداً من الإدارة
              if (liveDoc.devices && Array.isArray(liveDoc.devices) && liveDoc.devices.length > 0) {
                var isThisDeviceAllowed = liveDoc.devices.some(function(d) { return d.deviceId === currentDeviceId; });
                var hadRegistered = user.devices && user.devices.some(function(d) { return d.deviceId === currentDeviceId; });
                
                if (hadRegistered && !isThisDeviceAllowed) {
                  showToast("تم إنهاء جلستك من هذا الجهاز عن بُعد.", "error", "إنهاء الجلسة");
                  forceLogoutUser();
                  return;
                }
              }

              var roleChanged = liveDoc.role && (liveDoc.role !== user.role);
              var coursesChanged = JSON.stringify((liveDoc.enrolledCourses || []).map(String)) !== JSON.stringify((user.enrolledCourses || []).map(String));

              if (roleChanged || coursesChanged) {
                localStorage.setItem("current_user", JSON.stringify(liveDoc));
                localStorage.setItem("edu_currentUser", JSON.stringify(liveDoc));
                user = liveDoc;

                if (roleChanged) {
                  showToast("تم تحديث رتبتك الإدارية إلى: " + liveDoc.role, "info", "تحديث الصلاحيات");
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
          }, function() {});
      } catch (e) {}
    } else if (attempts > 30) {
      clearInterval(interval);
    }
  }, 600);
}

function forceLogoutUser() {
  localStorage.removeItem("current_user");
  localStorage.removeItem("edu_currentUser");
  if (typeof firebase !== "undefined" && firebase.auth) {
    try { firebase.auth().signOut(); } catch(e) {}
  }
  showToast("تم إنهاء الجلسة.", "error", "تنبيه");
  setTimeout(function() { window.location.replace("login.html"); }, 400);
}

var swRegistration = null;
function registerDeviceServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(function(reg) { swRegistration = reg; })
      .catch(function(err) {});
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

function initRealtimeNotificationsReceiver() {
  var lastKnownNotifId = localStorage.getItem("hk_last_received_notif_id") || "";
  var isFirstLoad = true;

  var attempts = 0;
  var interval = setInterval(function() {
    attempts++;
    if (window.FirebaseService && typeof window.FirebaseService.subscribeNotifications === "function") {
      clearInterval(interval);
      try {
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

            if (user && latest.senderEmail && user.email && user.email.toLowerCase() === latest.senderEmail.toLowerCase()) return;

            if (!user && latest.targetUid !== "ALL") return;
            if (user && (latest.targetUid === "ALL" || latest.targetUid === user.uid)) {
              triggerDeviceNativeNotification(latest.title, latest.body, latest.targetUrl);
              showToast(latest.body, "info", latest.title);
            }
          }
        });
      } catch (e) {}
    } else if (attempts > 25) {
      clearInterval(interval);
    }
  }, 300);
}

function showToast(message, type, title) {
  type = type || "info";
  title = title || (type === "success" ? "تم بنجاح" : type === "error" ? "تنبيه" : "إشعار");

  try {
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
  } catch (e) {}
}
window.showToast = showToast;

function logAdminAction(actionType, details) {
  try {
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
  } catch (e) {}
}
window.logAdminAction = logAdminAction;

function logout() {
  if (window.FirebaseService && typeof window.FirebaseService.logoutUser === "function") {
    window.FirebaseService.logoutUser();
  } else {
    localStorage.removeItem("current_user");
    localStorage.removeItem("edu_currentUser");
    window.location.href = "login.html";
  }
}
window.logout = logout;

function updateNavbarAndAuthGuards() {
  try {
    var user = getCurrentUser();
    var currentPath = window.location.pathname.toLowerCase();

    // حماية صفحات الإدارة والدخول العكسي
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

    var authBox = document.getElementById("navAuthBox");
    if (authBox) {
      if (user) {
        if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
          authBox.innerHTML = '<a href="admin.html" class="nav-btn-primary">لوحة الإدارة</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
        } else if (user.role === "SUPPORT") {
          authBox.innerHTML = '<a href="support.html" class="nav-btn-primary">شات الدعم</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
        } else {
          authBox.innerHTML = '<a href="dashboard.html" class="nav-btn-primary">لوحة الطالب (' + sanitizeText(user.fullName.split(" ")[0]) + ')</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
        }
      } else {
        authBox.innerHTML = '<a href="login.html" class="nav-btn-link">تسجيل الدخول</a><a href="register.html" class="nav-btn-primary">حساب جديد</a>';
      }
    }
  } catch (e) {}
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
    var confirmed = await customConfirm("هل تؤكد رغبتك في الاشتراك بالكورس المجاني: " + course.title + "؟", "تأكيد الاشتراك");
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

  var proceed = await customConfirm("هل تريد الانتقال لصفحة تأكيد ودفع رسوم الكورس: " + (course ? course.title : "") + "؟", "الاشتراك بالكورس");
  if (proceed) {
    window.location.href = "checkout.html?course=" + courseId;
  }
}
window.handleEnrollClick = handleEnrollClick;

window.handleHeroEnroll = function() {
  var user = getCurrentUser();
  if (user) {
    if (user.role === "STUDENT") window.location.href = "#courses";
    else window.location.href = "admin.html";
  } else {
    window.location.href = "register.html";
  }
};

// حقن توقيع المطور أسفل كل صفحة
function injectDeveloperFooter() {
  try {
    if (document.getElementById("hkDeveloperFooter")) return;

    var footer = document.createElement("div");
    footer.id = "hkDeveloperFooter";
    footer.style.cssText = "width:100%; text-align:center; padding:14px 10px; font-size:12.5px; color:#64748B; background:rgba(255,255,255,0.7); backdrop-filter:blur(6px); border-top:1px solid #E2E8F0; margin-top:auto; font-weight:700; z-index:99; box-sizing:border-box;";
    
    footer.innerHTML = 'تم تطوير المنصة بواسطة <a href="https://www.instagram.com/omar_samehh._/" target="_blank" rel="noopener noreferrer" style="color:#0284C7; text-decoration:none; font-weight:900; transition:color 0.2s;">Omar Sameh ↗</a>';

    document.body.appendChild(footer);
  } catch (e) {}
}

// شاشة التحميل الكيميائية
function injectChemicalPreloader() {
  try {
    if (document.getElementById("chemicalPreloader")) return;

    var currentPath = window.location.pathname.toLowerCase();
    // عدم تفعيل شاشة التحميل المعقدة داخل صفحة تسجيل الدخول حتى لا تؤثر على سرعة إدخال البيانات
    if (currentPath.includes("login.html") || currentPath.includes("register.html")) return;

    if (!document.getElementById("chemicalPreloaderClassicStyles")) {
      var style = document.createElement("style");
      style.id = "chemicalPreloaderClassicStyles";
      style.innerHTML = `
        #chemicalPreloader {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          width: 100dvw !important;
          height: 100vh !important;
          height: 100dvh !important;
          background: radial-gradient(circle at 50% 40%, #0D1435 0%, #060919 100%) !important;
          z-index: 2147483647 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 20px !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s ease, visibility 0.4s ease !important;
          pointer-events: all !important;
        }
        #chemicalPreloader.hide-preloader {
          opacity: 0 !important;
          transform: scale(1.03) !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        .hk-stage-glow {
          position: absolute;
          width: min(280px, 70vw);
          height: min(280px, 70vw);
          background: radial-gradient(circle, rgba(0, 210, 255, 0.15) 0%, rgba(2, 132, 199, 0) 70%);
          border-radius: 50%;
          filter: blur(20px);
          animation: hkGlowPulse 2.4s ease-in-out infinite alternate;
          pointer-events: none;
        }
        @keyframes hkGlowPulse {
          0% { transform: scale(0.85); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 0.9; }
        }

        .lab-stage-container {
          position: relative;
          width: min(150px, 38vw);
          height: min(140px, 35vw);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: clamp(14px, 3vh, 22px);
          z-index: 2;
        }

        .atomic-ring-1, .atomic-ring-2 {
          position: absolute;
          border-radius: 50%;
          border: 1.5px dashed rgba(0, 210, 255, 0.5);
        }
        .atomic-ring-1 {
          width: 100%;
          height: 100%;
          animation: spinAtomic 3.4s linear infinite;
        }
        .atomic-ring-2 {
          width: 78%;
          height: 78%;
          border-color: rgba(2, 132, 199, 0.65);
          animation: spinAtomicRev 2.6s linear infinite;
        }
        .electron-dot {
          position: absolute;
          top: -4px;
          left: 50%;
          width: 8px;
          height: 8px;
          background: #00D2FF;
          border-radius: 50%;
          box-shadow: 0 0 12px #00D2FF, 0 0 4px #fff;
        }
        @keyframes spinAtomic { 100% { transform: rotate(360deg); } }
        @keyframes spinAtomicRev { 100% { transform: rotate(-360deg); } }

        .test-tube {
          position: absolute;
          width: 13px;
          height: 48px;
          border: 2px solid rgba(255, 255, 255, 0.85);
          border-radius: 0 0 8px 8px;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(4px);
          overflow: hidden;
          box-shadow: 0 0 12px rgba(0, 210, 255, 0.2);
        }
        .left-tube {
          left: 6px;
          top: 36px;
          transform: rotate(-18deg);
        }
        .right-tube {
          right: 6px;
          top: 36px;
          transform: rotate(18deg);
        }
        .tube-liquid {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 68%;
          background: linear-gradient(180deg, #00D2FF 0%, #0284C7 100%);
          box-shadow: 0 0 10px #00D2FF;
        }

        .main-flask-box {
          position: relative;
          width: 56px;
          height: 64px;
          border: 2.5px solid rgba(255, 255, 255, 0.95);
          border-top: none;
          clip-path: polygon(30% 0%, 70% 0%, 100% 84%, 85% 100%, 15% 100%, 0% 84%);
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(5px);
          box-shadow: 0 0 25px rgba(0, 210, 255, 0.4), inset 0 0 12px rgba(0, 210, 255, 0.2);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          overflow: hidden;
          z-index: 5;
        }
        .main-flask-neck {
          position: absolute;
          top: 29px;
          width: 18px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          border-bottom: none;
          border-radius: 4px 4px 0 0;
          background: rgba(255, 255, 255, 0.08);
          z-index: 4;
        }
        .flask-liquid-core {
          width: 100%;
          height: 74%;
          background: linear-gradient(0deg, #00D2FF 0%, #0284C7 55%, #38BDF8 100%);
          box-shadow: 0 0 20px #00D2FF;
          animation: liquidWave 1.6s ease-in-out infinite alternate;
        }
        @keyframes liquidWave {
          0% { transform: scaleY(0.94); filter: brightness(0.95); }
          100% { transform: scaleY(1.06); filter: brightness(1.15); }
        }

        .flask-steam {
          position: absolute;
          top: 10px;
          width: 8px;
          height: 8px;
          background: rgba(0, 210, 255, 0.75);
          border-radius: 50%;
          filter: blur(2px);
          animation: steamAscend 1.3s ease-out infinite;
          z-index: 3;
        }
        @keyframes steamAscend {
          0% { transform: translateY(0) scale(0.8); opacity: 0.9; }
          100% { transform: translateY(-26px) scale(2.3); opacity: 0; }
        }
        .lab-bubble {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          bottom: 8px;
          animation: bubbleFloat 1.1s ease-in infinite;
        }
        .lab-bubble:nth-child(2) { left: 30%; animation-delay: 0.25s; }
        .lab-bubble:nth-child(3) { left: 64%; animation-delay: 0.65s; }
        @keyframes bubbleFloat {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-36px) scale(1.2); opacity: 0; }
        }

        .loader-brand-title {
          font-size: clamp(21px, 5vw, 25px);
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 0.6px;
          margin-bottom: 6px;
          text-align: center;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.6);
          z-index: 2;
        }
        .loader-brand-title span {
          color: #00D2FF;
          text-shadow: 0 0 16px rgba(0, 210, 255, 0.9);
        }
        .loader-dynamic-phrase {
          font-size: clamp(12px, 3.5vw, 13.5px);
          font-weight: 700;
          color: #94A3B8;
          margin-bottom: clamp(14px, 3vh, 18px);
          text-align: center;
          padding: 0 16px;
          min-height: 20px;
          max-width: 90vw;
          z-index: 2;
        }
        .loader-counter-num {
          font-size: clamp(13px, 3.8vw, 15px);
          font-weight: 900;
          color: #00D2FF;
          margin-bottom: 8px;
          font-family: monospace;
          letter-spacing: 1px;
          z-index: 2;
          text-shadow: 0 0 10px rgba(0, 210, 255, 0.6);
        }
        .loader-bar-outer {
          width: min(230px, 75vw);
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 20px;
          overflow: hidden;
          z-index: 2;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
        }
        .loader-bar-inner {
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, #00D2FF 0%, #0284C7 50%, #38BDF8 100%);
          border-radius: 20px;
          box-shadow: 0 0 12px rgba(0, 210, 255, 0.9);
          transition: width 0.08s linear;
        }
      `;
      document.head.appendChild(style);
    }

    var preloader = document.createElement("div");
    preloader.id = "chemicalPreloader";
    preloader.innerHTML = `
      <div class="hk-stage-glow"></div>
      <div class="lab-stage-container">
        <div class="atomic-ring-1"><div class="electron-dot"></div></div>
        <div class="atomic-ring-2"><div class="electron-dot"></div></div>
        <div class="test-tube left-tube"><div class="tube-liquid"></div></div>
        <div class="test-tube right-tube"><div class="tube-liquid"></div></div>
        <div class="flask-steam"></div>
        <div class="main-flask-neck"></div>
        <div class="main-flask-box">
          <div class="flask-liquid-core"></div>
          <div class="lab-bubble"></div>
          <div class="lab-bubble"></div>
        </div>
      </div>
      <div class="loader-brand-title">منصة هي كيميا<span>!</span></div>
      <div class="loader-dynamic-phrase" id="loaderDynamicPhrase">جاري تحضير المحاليل والتأسيس...</div>
      <div class="loader-counter-num" id="loaderCounterNum">0%</div>
      <div class="loader-bar-outer"><div class="loader-bar-inner" id="loaderBarFill"></div></div>
    `;

    document.body.prepend(preloader);

    var phrases = [
      "جاري إعداد بيئة التعلم التفاعلية...",
      "جاري مراجعة بنك الأسئلة والتدريبات...",
      "جاري الاتصال بالسيرفر الأكاديمي...",
      "جاهز للانطلاق والتفوق مع أ/ محمد السعيد 🧪"
    ];

    var startTime = Date.now();
    var duration = 1000;
    var barFill = document.getElementById("loaderBarFill");
    var counterNum = document.getElementById("loaderCounterNum");
    var phraseEl = document.getElementById("loaderDynamicPhrase");

    var timer = setInterval(function() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(100, Math.round((elapsed / duration) * 100));

      if (barFill) barFill.style.width = progress + "%";
      if (counterNum) counterNum.innerText = progress + "%";

      if (phraseEl) {
        if (progress < 28) phraseEl.innerText = phrases[0];
        else if (progress < 60) phraseEl.innerText = phrases[1];
        else if (progress < 88) phraseEl.innerText = phrases[2];
        else phraseEl.innerText = phrases[3];
      }

      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(function() {
          preloader.classList.add("hide-preloader");
          setTimeout(function() {
            try { preloader.remove(); } catch (e) {}
          }, 350);
        }, 50);
      }
    }, 25);
  } catch (e) {}
}

function initGlobalRealtimeSync() {
  if (window.FirebaseService) {
    try {
      if (typeof window.FirebaseService.subscribeCourses === "function") {
        window.FirebaseService.subscribeCourses(function(courses) {
          if (typeof renderCoursesSection === "function") renderCoursesSection(courses);
        });
      }
      if (typeof window.FirebaseService.subscribeExams === "function") {
        window.FirebaseService.subscribeExams(function(exams) {
          if (typeof renderGeneralExams === "function") renderGeneralExams(exams);
        });
      }
      if (typeof window.FirebaseService.subscribeUsers === "function") window.FirebaseService.subscribeUsers();
      if (typeof window.FirebaseService.subscribeSubmissions === "function") window.FirebaseService.subscribeSubmissions();
      if (typeof window.FirebaseService.subscribePayments === "function") window.FirebaseService.subscribePayments();
    } catch (e) {}
  }
}

document.addEventListener("DOMContentLoaded", function() {
  injectChemicalPreloader();
  registerCurrentDeviceSession();
  injectDeveloperFooter();
  registerDeviceServiceWorker();
  updateNavbarAndAuthGuards();
  monitorCurrentUserStatus();
  initGlobalRealtimeSync();
  initRealtimeNotificationsReceiver();
});