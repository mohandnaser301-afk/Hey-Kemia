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

// محول روابط يوتيوب الاحترافي لكافة الصيغ
function formatYouTubeEmbedUrl(url) {
  if (!url) return "";
  var cleanUrl = String(url).trim();
  if (cleanUrl.includes("youtube-nocookie.com/embed/")) return cleanUrl;

  var videoId = "";
  if (cleanUrl.includes("youtu.be/")) {
    videoId = cleanUrl.split("youtu.be/")[1].split("?")[0].split("&")[0];
  } else if (cleanUrl.includes("youtube.com/watch")) {
    var urlParams = new URLSearchParams(cleanUrl.split("?")[1] || "");
    videoId = urlParams.get("v") || "";
  } else if (cleanUrl.includes("youtube.com/shorts/")) {
    videoId = cleanUrl.split("youtube.com/shorts/")[1].split("?")[0].split("&")[0];
  } else if (cleanUrl.includes("youtube.com/embed/")) {
    videoId = cleanUrl.split("youtube.com/embed/")[1].split("?")[0].split("&")[0];
  }

  return videoId 
    ? "https://www.youtube-nocookie.com/embed/" + videoId + "?rel=0&modestbranding=1&enablejsapi=1" 
    : cleanUrl;
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
    var role = (user && user.role ? user.role : "").toUpperCase();
    var isSuper = role === "SUPER_ADMIN" || role === "ADMIN";

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
    if (typeof renderAdminOwnDevicesList === "function") renderAdminOwnDevicesList();
    if (typeof renderAdminUserDevices === "function") renderAdminUserDevices(targetUid);
  } catch(e) {}
}
window.revokeDeviceSession = revokeDeviceSession;

// عرض الأجهزة المسجلة للطالب
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

// عرض الأجهزة المسجلة لحساب الإداري نفسه داخل لوحة التحكم
function renderAdminOwnDevicesList(containerId) {
  try {
    var targetId = containerId || "adminOwnDevicesContainer";
    var container = document.getElementById(targetId);
    if (!container) return;

    var user = getCurrentUser();
    if (!user) {
      container.innerHTML = '<p style="font-size:13px; color:#64748B; text-align:center;">يرجى تسجيل الدخول لعرض الأجهزة</p>';
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
            '<div style="font-size:11.5px; color:#64748B;">النوع: ' + sanitizeText(dev.deviceType) + ' | آخر نشاط: ' + sanitizeText(dev.lastLogin || "الآن") + '</div>' +
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
window.renderAdminOwnDevicesList = renderAdminOwnDevicesList;

// عرض الأجهزة لأي طالب بواسطة الإدارة
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

// =========================================================
// شاشة التحميل المعملية الاحترافية (بدون دخان وبانتقال ناعم)
// =========================================================
function injectChemicalPreloader() {
  try {
    if (document.getElementById("chemicalPreloader")) return;

    var currentPath = (window.location.pathname || "").toLowerCase();
    if (currentPath.includes("login.html") || currentPath.includes("register.html")) return;

    if (!document.getElementById("chemApparatusCleanStyles")) {
      var style = document.createElement("style");
      style.id = "chemApparatusCleanStyles";
      style.innerHTML = `
        #chemicalPreloader {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: radial-gradient(circle at 50% 40%, #0F1738 0%, #060818 100%) !important;
          z-index: 99999999 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          transition: opacity 0.5s ease;
        }

        .chem-lab-apparatus {
          position: relative;
          width: 190px;
          height: 170px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
          z-index: 10;
        }

        .chem-main-beaker {
          position: absolute;
          bottom: 4px;
          left: 55px;
          width: 80px;
          height: 95px;
          border: 2.5px solid rgba(255, 255, 255, 0.9);
          border-top: none;
          clip-path: polygon(32% 0%, 68% 0%, 100% 84%, 86% 100%, 14% 100%, 0% 84%);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 25px rgba(0, 210, 255, 0.25);
          overflow: hidden;
        }

        .chem-beaker-fluid {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 38%;
          background: linear-gradient(0deg, #FF1744 0%, #FF5252 100%);
          box-shadow: 0 0 16px #FF1744;
          transition: height 1.2s ease, background 0.4s ease;
        }

        .chem-main-beaker.mixing .chem-beaker-fluid {
          height: 80%;
          background: linear-gradient(0deg, #00E5FF 0%, #00B0FF 50%, #7C4DFF 100%);
          box-shadow: 0 0 28px #00E5FF;
        }

        .beaker-bubble {
          position: absolute;
          width: 5px;
          height: 5px;
          background: rgba(255, 255, 255, 0.85);
          border-radius: 50%;
          bottom: 8px;
          opacity: 0;
          animation: bubbleBoil 0.9s ease-out infinite;
        }
        .bubble-1 { left: 24%; animation-delay: 0.1s; }
        .bubble-2 { left: 50%; animation-delay: 0.45s; }
        .bubble-3 { left: 74%; animation-delay: 0.25s; }

        @keyframes bubbleBoil {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          50% { opacity: 0.9; }
          100% { transform: translateY(-46px) scale(1.3); opacity: 0; }
        }

        .chem-test-tube {
          position: absolute;
          top: 2px;
          left: 42px;
          width: 18px;
          height: 72px;
          border: 2px solid rgba(0, 210, 255, 0.9);
          border-radius: 0 0 12px 12px;
          background: rgba(0, 210, 255, 0.08);
          box-shadow: 0 0 18px rgba(0, 210, 255, 0.45);
          transform-origin: top right;
          transform: rotate(50deg);
          animation: tubeTiltAndPour 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
          overflow: hidden;
        }

        .chem-tube-fluid {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 80%;
          background: linear-gradient(180deg, #00D2FF 0%, #0284C7 100%);
          box-shadow: 0 0 10px #00D2FF;
        }

        @keyframes tubeTiltAndPour {
          0% { transform: rotate(35deg); }
          100% { transform: rotate(58deg); }
        }

        .chem-liquid-stream {
          position: absolute;
          left: 93px;
          top: 48px;
          width: 3.5px;
          height: 52px;
          background: linear-gradient(180deg, #00D2FF 0%, rgba(0, 210, 255, 0.8) 80%, transparent 100%);
          box-shadow: 0 0 8px #00D2FF;
          animation: streamFlow 0.8s linear infinite;
        }

        @keyframes streamFlow {
          0% { opacity: 0.6; transform: scaleY(0.9); }
          50% { opacity: 1; transform: scaleY(1.05); }
          100% { opacity: 0.6; transform: scaleY(0.9); }
        }

        .chem-stream-droplet {
          position: absolute;
          width: 5px;
          height: 8px;
          background: #00D2FF;
          border-radius: 50%;
          left: 92px;
          top: 46px;
          opacity: 0;
          box-shadow: 0 0 8px #00D2FF;
          animation: dropCascade 0.7s ease-in infinite;
        }
        .drop-cascade-2 { animation-delay: 0.35s; }

        @keyframes dropCascade {
          0% { transform: translateY(0); opacity: 0; }
          25% { opacity: 1; }
          90% { transform: translateY(48px) scale(0.9); opacity: 1; }
          100% { transform: translateY(52px) scale(0.2); opacity: 0; }
        }

        .chem-flash-wave {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, rgba(0,229,255,0.7) 30%, transparent 70%);
          opacity: 0;
          pointer-events: none;
          z-index: 50;
          transition: opacity 0.25s ease-out;
        }

        #chemicalPreloader.evaporate-up {
          animation: wipeBottomToTop 0.65s cubic-bezier(0.7, 0, 0.2, 1) forwards !important;
        }

        @keyframes wipeBottomToTop {
          0% { clip-path: inset(0 0 0 0); opacity: 1; }
          100% { clip-path: inset(0 0 100% 0); opacity: 0; }
        }

        .loader-brand-title {
          font-size: 24px;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 6px;
          text-shadow: 0 2px 14px rgba(0,0,0,0.6);
          z-index: 10;
        }
        .loader-brand-title span { color: #00D2FF; text-shadow: 0 0 16px rgba(0,210,255,0.85); }

        .loader-dynamic-phrase {
          font-size: 13.5px;
          font-weight: 700;
          color: #94A3B8;
          margin-bottom: 18px;
          text-align: center;
          padding: 0 16px;
          z-index: 10;
        }

        .loader-counter-num {
          font-size: 15px;
          font-weight: 900;
          color: #00D2FF;
          margin-bottom: 10px;
          font-family: monospace;
          z-index: 10;
        }

        .loader-bar-outer {
          width: 230px;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          z-index: 10;
        }

        .loader-bar-inner {
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, #FF1744 0%, #00D2FF 100%);
          border-radius: 20px;
          transition: width 0.08s linear;
        }
      `;
      document.head.appendChild(style);
    }

    var preloader = document.createElement("div");
    preloader.id = "chemicalPreloader";
    preloader.innerHTML = `
      <div class="chem-flash-wave" id="chemFlashWave"></div>

      <div class="chem-lab-apparatus" id="chemApparatusStage">
        <div class="chem-test-tube">
          <div class="chem-tube-fluid"></div>
        </div>
        <div class="chem-liquid-stream"></div>
        <div class="chem-stream-droplet drop-cascade-1"></div>
        <div class="chem-stream-droplet drop-cascade-2"></div>

        <div class="chem-main-beaker" id="chemMainBeaker">
          <div class="chem-beaker-fluid">
            <div class="beaker-bubble bubble-1"></div>
            <div class="beaker-bubble bubble-2"></div>
            <div class="beaker-bubble bubble-3"></div>
          </div>
        </div>
      </div>

      <div class="loader-brand-title" id="preloaderBrandTitle">منصة هي كيميا<span>!</span></div>
      <div class="loader-dynamic-phrase" id="loaderDynamicPhrase">جاري سكب المحلول وبدء التفاعل...</div>
      <div class="loader-counter-num" id="loaderCounterNum">0%</div>
      <div class="loader-bar-outer" id="preloaderBarContainer"><div class="loader-bar-inner" id="loaderBarFill"></div></div>
    `;

    document.body.prepend(preloader);

    var phrases = [
      "جاري إضافة المركبات وبدء التفاعل الكيميائي...",
      "جاري معايرة المحاليل والتدريبات التفاعلية...",
      "اقتراب نقطة التكافؤ وانطلاق التفاعل...",
      "تفاعل كيميائي كامل مع أ/ محمد السعيد 💥"
    ];

    var startTime = Date.now();
    var duration = 1400;
    var barFill = document.getElementById("loaderBarFill");
    var counterNum = document.getElementById("loaderCounterNum");
    var phraseEl = document.getElementById("loaderDynamicPhrase");
    var mainBeaker = document.getElementById("chemMainBeaker");
    var flashWave = document.getElementById("chemFlashWave");

    var timer = setInterval(function() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(100, Math.round((elapsed / duration) * 100));

      if (barFill) barFill.style.width = progress + "%";
      if (counterNum) counterNum.innerText = progress + "%";

      if (progress > 35 && mainBeaker) {
        mainBeaker.classList.add("mixing");
      }

      if (phraseEl) {
        if (progress < 28) phraseEl.innerText = phrases[0];
        else if (progress < 60) phraseEl.innerText = phrases[1];
        else if (progress < 88) phraseEl.innerText = phrases[2];
        else phraseEl.innerText = phrases[3];
      }

      if (progress >= 100) {
        clearInterval(timer);

        if (flashWave) flashWave.style.opacity = "1";

        setTimeout(function() {
          if (preloader) {
            preloader.classList.add("evaporate-up");
            setTimeout(function() {
              try { preloader.remove(); } catch (e) {}
            }, 650);
          }
        }, 220);
      }
    }, 25);
  } catch (e) {}
}

// =========================================================
// حقن الزخارف الكيميائية (بدون مربعات عبر نصوص SVG وخطوط قياسية)
// =========================================================
function injectChemicalDecorations() {
  try {
    if (document.getElementById("hkChemicalBackgroundDecorations")) return;

    var container = document.createElement("div");
    container.id = "hkChemicalBackgroundDecorations";
    container.style.cssText = "position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; opacity:0.18; font-family:system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;";

    // أيقونات SVG كيميائية متوافقة بنسبة 100% مع كافة المتصفحات دون الاعتماد على خط الإيموجي
    var flaskSvg = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00D2FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31L4.67 19.46A2 2 0 0 0 6.4 22h11.2a2 2 0 0 0 1.73-2.54L14 9.31V2h-4z"></path><line x1="8.5" y1="2" x2="15.5" y2="2"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>';
    var atomSvg = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00D2FF" stroke-width="2"><circle cx="12" cy="12" r="2"></circle><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"></ellipse><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(90 12 12)"></ellipse><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(150 12 12)"></ellipse></svg>';
    var hexRingSvg = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00D2FF" stroke-width="2"><polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2"></polygon><circle cx="12" cy="12" r="4.5"></circle></svg>';

    var chemicalItems = [
      flaskSvg,
      atomSvg,
      hexRingSvg,
      '<span style="font-weight:900; font-size:16px; color:#00D2FF;">H₂O</span>',
      '<span style="font-weight:900; font-size:16px; color:#00D2FF;">CO₂</span>',
      '<span style="font-weight:900; font-size:16px; color:#00D2FF;">H₂SO₄</span>',
      '<span style="font-weight:900; font-size:16px; color:#00D2FF;">NaCl</span>',
      '<span style="font-weight:900; font-size:15px; color:#00D2FF;">C₆H₁₂O₆</span>',
      '<span style="font-weight:800; font-size:14px; color:#00D2FF;">2H₂ + O₂ → 2H₂O</span>'
    ];

    var html = "";
    for (var i = 0; i < 16; i++) {
      var top = Math.floor(Math.random() * 92) + "%";
      var left = Math.floor(Math.random() * 92) + "%";
      var rot = Math.floor(Math.random() * 60 - 30) + "deg";
      var item = chemicalItems[i % chemicalItems.length];
      html += '<div style="position:absolute; top:' + top + '; left:' + left + '; transform:rotate(' + rot + '); user-select:none; filter:drop-shadow(0 0 6px rgba(0,210,255,0.45)); display:inline-flex; align-items:center; justify-content:center;">' + item + '</div>';
    }
    container.innerHTML = html;
    document.body.prepend(container);
  } catch (e) {}
}

// =========================================================
// شات الدعم الفني وتحديث المحادثات
// =========================================================
function initSupportChatWidget() {
  try {
    var user = getCurrentUser();
    if (!user || !user.uid) return;

    if (window.FirebaseService && typeof window.FirebaseService.subscribeStudentChat === "function") {
      window.FirebaseService.subscribeStudentChat(user.uid, function(messages) {
        if (typeof renderChatMessages === "function") {
          renderChatMessages(messages);
        }
      });
    }

    var role = (user.role || "STUDENT").toUpperCase();
    if ((role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPPORT") && typeof window.FirebaseService.subscribeAllSupportThreads === "function") {
      window.FirebaseService.subscribeAllSupportThreads(function(threads) {
        if (typeof renderSupportThreads === "function") {
          renderSupportThreads(threads);
        }
      });
    }
  } catch (e) {}
}

// =========================================================
// المراقبة المحصنة ضد تكرار التحديث والـ undefined والـ Loop
// =========================================================
var lastHandledRole = null;

function monitorCurrentUserStatus() {
  try {
    var user = getCurrentUser();
    if (!user || !user.uid) return;

    if (typeof firebase !== "undefined" && firebase.firestore) {
      firebase.firestore().collection("users").doc(user.uid)
        .onSnapshot(function(docSnap) {
          if (!docSnap || !docSnap.exists) return;
          var liveDoc = docSnap.data();
          if (!liveDoc) return;
          liveDoc.uid = docSnap.id;

          // إذا كانت الرتبة القادمة غير صالحة أو undefined، تجاهلها تماماً
          if (!liveDoc.role) return;

          var newRole = String(liveDoc.role).toUpperCase();

          // منع التكرار اللانهائي إذا لم تتغير الرتبة الحقيقية
          if (lastHandledRole === newRole) return;
          lastHandledRole = newRole;

          // حفظ البيانات بثبات
          localStorage.setItem("current_user", JSON.stringify(liveDoc));
          localStorage.setItem("edu_currentUser", JSON.stringify(liveDoc));

          renderNavbarOnly();
        }, function() {});
    }
  } catch(e) {}
}

function renderNavbarOnly() {
  try {
    var user = getCurrentUser();
    var role = (user && user.role ? String(user.role) : "STUDENT").toUpperCase();
    var isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPERADMIN" || role === "MANAGER";
    var isSupport = role === "SUPPORT";

    var authBox = document.getElementById("navAuthBox");
    if (authBox) {
      if (user) {
        if (isAdmin) {
          authBox.innerHTML = '<a href="admin.html" class="nav-btn-primary">لوحة الإدارة</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
        } else if (isSupport) {
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

// حارس التوجيه: بدون أي Redirect تلقائي عشوائي
function updateNavbarAndAuthGuards() {
  try {
    var user = getCurrentUser();
    var currentPath = (window.location.pathname || "").toLowerCase();

    // حماية لوحة الإدارة فقط لغير المسجلين
    if (currentPath.includes("admin.html")) {
      if (!user) {
        window.location.replace("login.html");
        return;
      }
    }

    renderNavbarOnly();
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

    var role = (user && user.role ? String(user.role) : "STUDENT").toUpperCase();
    if (role !== "STUDENT") {
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

function initGlobalRealtimeSync() {
  if (window.FirebaseService) {
    try {
      if (typeof window.FirebaseService.subscribeCourses === "function") {
        window.FirebaseService.subscribeCourses(function(courses) {
          if (Array.isArray(courses)) {
            courses.forEach(function(c) {
              if (c.lessons && Array.isArray(c.lessons)) {
                c.lessons.forEach(function(l) {
                  l.videoUrl = formatYouTubeEmbedUrl(l.videoUrl);
                });
              }
            });
          }
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

document.addEventListener("DOMContentLoaded", function() {
  injectChemicalPreloader();
  injectChemicalDecorations();
  injectDeveloperFooter();
  updateNavbarAndAuthGuards();
  
  setTimeout(function() {
    registerCurrentDeviceSession();
    monitorCurrentUserStatus();
    initGlobalRealtimeSync();
    initSupportChatWidget();

    if (typeof renderStudentDashboard === "function") renderStudentDashboard();
    if (typeof renderAdmin === "function") renderAdmin();
    if (typeof renderStudentDevicesList === "function") renderStudentDevicesList();
    if (typeof renderAdminOwnDevicesList === "function") renderAdminOwnDevicesList();
  }, 100);
});