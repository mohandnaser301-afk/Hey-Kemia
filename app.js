// =========================================================
// المنظومة البرمجية الموحدة لمنصة هي كيميا !
// =========================================================

// 1. دوال الأمان والنصوص العامة
function sanitizeText(str) {
  if (!str) return "";
  var temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}
window.sanitizeText = sanitizeText;

function formatYouTubeEmbedUrl(url) {
  if (!url) return "";
  var str = String(url).trim();
  if (str.includes("youtube.com/embed/")) return str;
  var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  var match = str.match(regExp);
  return (match && match[2].length === 11) 
    ? "https://www.youtube.com/embed/" + match[2] 
    : str;
}
window.formatYouTubeEmbedUrl = formatYouTubeEmbedUrl;

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
      modal.style.cssText = "position:fixed; inset:0; background:rgba(8,10,33,0.78); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:9999999; padding:16px;";
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

function showToast(message, type, title) {
  try {
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

// 2. إدارة المستخدم والجلسات
function getCurrentUser() {
  try {
    var data = localStorage.getItem("current_user") || localStorage.getItem("edu_currentUser");
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}
window.getCurrentUser = getCurrentUser;

function isStudentEnrolledInCourse(user, courseId) {
  if (!user || !user.enrolledCourses) return false;
  var targetId = String(courseId);
  return user.enrolledCourses.some(function(id) { return String(id) === targetId; });
}
window.isStudentEnrolledInCourse = isStudentEnrolledInCourse;

function logout() {
  try {
    localStorage.removeItem("current_user");
    localStorage.removeItem("edu_currentUser");
    if (window.FirebaseService && typeof window.FirebaseService.logoutUser === "function") {
      window.FirebaseService.logoutUser();
    } else if (typeof firebase !== "undefined" && firebase.auth) {
      try { firebase.auth().signOut(); } catch(e) {}
    }
  } catch(e) {}
  window.location.replace("login.html");
}
window.logout = logout;

function forceLogoutUser() {
  logout();
}
window.forceLogoutUser = forceLogoutUser;

// 3. منظومة تعدد الأجهزة والجلسات
function getOrCreateDeviceId() {
  try {
    var devId = localStorage.getItem("hk_device_id");
    if (!devId) {
      devId = "dev_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("hk_device_id", devId);
    }
    return devId;
  } catch (e) {
    return "dev_default_session";
  }
}
window.getOrCreateDeviceId = getOrCreateDeviceId;

function detectCurrentDeviceInfo() {
  var ua = navigator.userAgent || "";
  var browser = "Google Chrome";
  var os = "Windows";
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
window.detectCurrentDeviceInfo = detectCurrentDeviceInfo;

function registerCurrentDeviceSession() {
  try {
    var user = getCurrentUser();
    if (!user || !user.uid) return;

    var currentDev = detectCurrentDeviceInfo();
    var devices = Array.isArray(user.devices) ? user.devices : [];

    var existsIdx = devices.findIndex(function(d) { return d && d.deviceId === currentDev.deviceId; });
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
window.registerCurrentDeviceSession = registerCurrentDeviceSession;

async function revokeDeviceSession(targetUid, deviceIdToRevoke) {
  try {
    var user = getCurrentUser();
    var isSuper = user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN");

    if (!isSuper && (!user || user.uid !== targetUid)) {
      showToast("غير مصرح لك بتنفيذ هذا الإجراء", "error");
      return;
    }

    var confirmed = await customConfirm("هل تريد إنهاء جلسة هذا الجهاز؟", "تسجيل خروج الجهاز");
    if (!confirmed) return;

    var targetUser = user;
    var usersList = JSON.parse(localStorage.getItem("edu_users")) || [];
    if (isSuper) {
      var found = usersList.find(function(u) { return (u.uid && u.uid === targetUid) || (u.id && u.id === targetUid); });
      if (found) targetUser = found;
    }

    var updatedDevices = (targetUser.devices || []).filter(function(d) { return d && d.deviceId !== deviceIdToRevoke; });
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
      await firebase.firestore().collection("users").doc(targetUid).update({
        devices: updatedDevices
      }).catch(function(){});
    }

    showToast("تم إنهاء جلسة الجهاز بنجاح", "success");

    var thisDevId = getOrCreateDeviceId();
    if (deviceIdToRevoke === thisDevId && (!user || user.uid === targetUid)) {
      logout();
      return;
    }

    if (typeof renderStudentDevicesList === "function") renderStudentDevicesList();
    if (typeof renderAdminUserDevices === "function") renderAdminUserDevices(targetUid);
  } catch(e) {}
}
window.revokeDeviceSession = revokeDeviceSession;

function renderStudentDevicesList(containerId) {
  try {
    var targetId = containerId || "studentDevicesContainer";
    var container = document.getElementById(targetId);
    if (!container) return;

    var user = getCurrentUser();
    if (!user) {
      container.innerHTML = '<p style="font-size:13px; color:#64748B; text-align:center;">يرجى تسجيل الدخول لعرض أجهزتك</p>';
      return;
    }

    var currentDevId = getOrCreateDeviceId();
    var devices = Array.isArray(user.devices) && user.devices.length > 0 ? user.devices : [detectCurrentDeviceInfo()];

    var html = '<div style="display:flex; flex-direction:column; gap:10px;">';
    devices.forEach(function(dev) {
      if (!dev) return;
      var isCurrent = dev.deviceId === currentDevId;
      var icon = dev.deviceType === "هاتف محمول" ? "📱" : (dev.deviceType === "تابلت / لوحي" ? "📟" : "💻");

      html += '<div style="display:flex; align-items:center; justify-content:space-between; background:#F8FAFC; border:1px solid ' + (isCurrent ? 'rgba(0, 210, 255, 0.4)' : '#E2E8F0') + '; border-radius:10px; padding:10px 14px;">' +
        '<div style="display:flex; align-items:center; gap:10px;">' +
          '<span style="font-size:20px;">' + icon + '</span>' +
          '<div>' +
            '<div style="font-size:13px; font-weight:800; color:#0E1338; display:flex; align-items:center; gap:6px;">' +
              sanitizeText(dev.platformName || dev.os) +
              (isCurrent ? '<span style="font-size:10px; background:#00D2FF; color:#0E1338; font-weight:900; padding:1px 6px; border-radius:4px;">الجهاز الحالي</span>' : '') +
            '</div>' +
            '<div style="font-size:11.5px; color:#64748B;">النوع: ' + sanitizeText(dev.deviceType) + ' | آخر ظهور: ' + sanitizeText(dev.lastLogin || "الآن") + '</div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          (!isCurrent ? '<button onclick="revokeDeviceSession(\'' + user.uid + '\', \'' + dev.deviceId + '\')" style="background:#FEE2E2; color:#DC2626; border:1px solid #FCA5A5; padding:5px 10px; border-radius:6px; font-size:11.5px; font-weight:800; cursor:pointer;">إنهاء الجلسة</button>' : '') +
        '</div>' +
      '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
  } catch (e) {}
}
window.renderStudentDevicesList = renderStudentDevicesList;

function renderAdminUserDevices(targetUid, containerId) {
  try {
    var targetId = containerId || "adminUserDevicesContainer";
    var container = document.getElementById(targetId);
    if (!container) return;

    var users = JSON.parse(localStorage.getItem("edu_users")) || [];
    var targetUser = users.find(function(u) { return (u.uid && u.uid === targetUid) || (u.id && u.id === targetUid); });

    if (!targetUser) {
      container.innerHTML = '<p style="font-size:13px; color:#64748B; text-align:center;">لم يتم العثور على الحساب</p>';
      return;
    }

    var devices = Array.isArray(targetUser.devices) ? targetUser.devices : [];
    if (devices.length === 0) {
      container.innerHTML = '<p style="font-size:13px; color:#94A3B8; text-align:center; padding:10px;">لا توجد أجهزة مسجلة لهذا الحساب حالياً.</p>';
      return;
    }

    var html = '<div style="display:flex; flex-direction:column; gap:10px;">';
    devices.forEach(function(dev) {
      if (!dev) return;
      var icon = dev.deviceType === "هاتف محمول" ? "📱" : "💻";
      html += '<div style="display:flex; align-items:center; justify-content:space-between; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px 14px;">' +
        '<div style="display:flex; align-items:center; gap:10px;">' +
          '<span style="font-size:20px;">' + icon + '</span>' +
          '<div>' +
            '<div style="font-size:13px; font-weight:800; color:#0E1338;">' + sanitizeText(dev.platformName || dev.os) + '</div>' +
            '<div style="font-size:11.5px; color:#64748B;">النوع: ' + sanitizeText(dev.deviceType) + ' | النشاط: ' + sanitizeText(dev.lastLogin || "غير محدد") + '</div>' +
          '</div>' +
        '</div>' +
        '<button onclick="revokeDeviceSession(\'' + (targetUser.uid || targetUser.id) + '\', \'' + dev.deviceId + '\')" style="background:#FEE2E2; color:#DC2626; border:1px solid #FCA5A5; padding:5px 10px; border-radius:6px; font-size:11.5px; font-weight:800; cursor:pointer;">إنهاء الجلسة</button>' +
      '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
  } catch (e) {}
}
window.renderAdminUserDevices = renderAdminUserDevices;

// 4. الحساب الأكاديمي الموحد للطلاب
function calculateStudentMetrics(userUid) {
  if (!userUid) return { enrolledCount: 0, completedExams: 0, avgScore: 0, totalHours: 0, enrolledList: [], submissionsList: [] };

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
    return { enrolledCount: 0, completedExams: 0, avgScore: 0, totalHours: 0, enrolledList: [], submissionsList: [] };
  }
}
window.calculateStudentMetrics = calculateStudentMetrics;

function monitorCurrentUserStatus() {
  try {
    var user = getCurrentUser();
    if (!user || !user.uid) return;

    if (typeof firebase !== "undefined" && firebase.firestore) {
      firebase.firestore().collection("users").doc(user.uid)
        .onSnapshot(function(docSnap) {
          if (!docSnap || !docSnap.exists) return;
          var liveDoc = docSnap.data();
          liveDoc.uid = docSnap.id;

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
            }

            if (typeof renderStudentDashboard === "function") renderStudentDashboard();
            if (typeof renderAdmin === "function") renderAdmin();
            updateNavbarAndAuthGuards();
          }
        }, function() {});
    }
  } catch(e) {}
}

function updateNavbarAndAuthGuards() {
  try {
    var user = getCurrentUser();
    var currentPath = (window.location.pathname || "").toLowerCase();

    if (currentPath.includes("login.html") || currentPath.includes("register.html")) {
      return;
    }

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
          authBox.innerHTML = '<a href="dashboard.html" class="nav-btn-primary">لوحة الطالب (' + sanitizeText((user.fullName || "طالب").split(" ")[0]) + ')</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
        }
      } else {
        authBox.innerHTML = '<a href="login.html" class="nav-btn-link">تسجيل الدخول</a><a href="register.html" class="nav-btn-primary">حساب جديد</a>';
      }
    }
  } catch (e) {}
}

async function handleEnrollClick(courseId) {
  try {
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
  } catch(e) {}
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

// 5. توقيع المطور
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

// 6. الإشعارات
var swRegistration = null;
function registerDeviceServiceWorker() {
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js")
        .then(function(reg) { swRegistration = reg; })
        .catch(function(err) {});
    }
  } catch(e) {}
}

function triggerDeviceNativeNotification(title, body, targetUrl) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "TRIGGER_NATIVE_NOTIFICATION",
        title: title,
        body: body,
        url: targetUrl || "dashboard.html"
      });
    } else {
      var n = new Notification(title, {
        body: body,
        icon: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=192&q=80"
      });
      n.onclick = function() {
        window.focus();
        window.location.href = targetUrl || "dashboard.html";
      };
    }
  } catch (e) {}
}

function initRealtimeNotificationsReceiver() {
  try {
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
      } else if (attempts > 15) {
        clearInterval(interval);
      }
    }, 1000);
  } catch(e) {}
}

// 7. محرك المزامنة الحية لربط واجهات الـ HTML
function initGlobalRealtimeSync() {
  if (window.FirebaseService) {
    try {
      if (typeof window.FirebaseService.subscribeCourses === "function") {
        window.FirebaseService.subscribeCourses(function(courses) {
          if (typeof renderCoursesSection === "function") renderCoursesSection(courses);
          if (typeof renderStudentDashboard === "function") renderStudentDashboard();
          if (typeof renderAdmin === "function") renderAdmin();
        });
      }
      if (typeof window.FirebaseService.subscribeExams === "function") {
        window.FirebaseService.subscribeExams(function(exams) {
          if (typeof renderGeneralExams === "function") renderGeneralExams(exams);
          if (typeof renderAdmin === "function") renderAdmin();
        });
      }
      if (typeof window.FirebaseService.subscribeUsers === "function") {
        window.FirebaseService.subscribeUsers(function(users) {
          if (typeof renderAdmin === "function") renderAdmin();
        });
      }
      if (typeof window.FirebaseService.subscribeSubmissions === "function") {
        window.FirebaseService.subscribeSubmissions(function(subs) {
          if (typeof renderStudentDashboard === "function") renderStudentDashboard();
          if (typeof renderAdmin === "function") renderAdmin();
        });
      }
      if (typeof window.FirebaseService.subscribePayments === "function") {
        window.FirebaseService.subscribePayments(function(pays) {
          if (typeof renderAdmin === "function") renderAdmin();
        });
      }
    } catch (e) {}
  }
}

// تشغيل الواجهات فوراً عند جهوزية الـ DOM
document.addEventListener("DOMContentLoaded", function() {
  // إزالة أي preloader قديم معلق فوراً
  var oldLoader = document.getElementById("chemicalPreloader");
  if (oldLoader) oldLoader.remove();

  injectDeveloperFooter();
  registerDeviceServiceWorker();
  updateNavbarAndAuthGuards();
  
  // تشغيل المزامنة وقراءة الحساب
  setTimeout(function() {
    registerCurrentDeviceSession();
    monitorCurrentUserStatus();
    initGlobalRealtimeSync();
    initRealtimeNotificationsReceiver();

    // تشغيل دوال الصفحة الحالية إن وجدت
    if (typeof renderStudentDashboard === "function") renderStudentDashboard();
    if (typeof renderAdmin === "function") renderAdmin();
    if (typeof renderStudentDevicesList === "function") renderStudentDevicesList();
  }, 100);
});