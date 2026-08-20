// =========================================================
// المحرك البرمجي وحصن الأمان لمنصة هي كيميا !
// يجمع بين الحماية المحلية، Firebase المحدث، ونظام إشعارات الجهاز
// =========================================================

// =========================================
// أولاً: تهيئةFirebase Analytics (بقيت كما هي)
// =========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// إعدادات Firebase الخاصة بك (بقيت كما هي، apiKey محمي الآن عبر App Check في firebase-config)
const firebaseConfig = {
apiKey: "AIzaSyDwUdbxMJmGlQctBuZWgxFbJqdHwqYUzzs",
authDomain: "hey-kemia-a8f6c.firebaseapp.com",
projectId: "hey-kemia-a8f6c",
storageBucket: "hey-kemia-a8f6c.firebasestorage.app",
messagingSenderId: "206028495913",
appId: "1:206028495913:web:b858b8ac1701ad5a62d038",
measurementId: "G-CGPJHC9BD6"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.log("✓ تم تهيئة Firebase Analytics.");


// =========================================
// ثانياً: نظام الإشعارات للجهاز (Native Device Notifications) - الجديد كلياً
// =========================================

var swRegistration = null; // متغير عالمي لحفظ إعدادات Service Worker

// 1. تسجيل وتفعيل Service Worker على جهاز الطالب
function registerDeviceServiceWorker() {
if ("serviceWorker" in navigator) {
  // تسجيل الملف sw.js (تأكد من وجوده بجوار index.html)
  navigator.serviceWorker.register("sw.js")
    .then(function(reg) {
      swRegistration = reg;
      console.log("✓ تم تسجيل الـ Service Worker بنجاح، جهاز الطالب جاهز لاستقبال الإشعارات.");
    })
    .catch(function(err) {
      console.log("✗ فشل تسجيل الـ Service Worker (الإشعارات على الجهاز لن تعمل): ", err);
    });
} else {
  console.log("✗ المتصفح لا يدعم الـ Service Worker (الإشعارات على الجهاز لن تعمل).");
}
}

// 2. طلب إذن إشعارات النظام من جهاز الطالب
//callback(true) إذا وافق، callback(false) إذا رفض
function requestNotificationPermission(callback) {
if ("Notification" in window) {
  if (Notification.permission === "granted") {
    if (callback) callback(true);
  } else if (Notification.permission !== "denied") {
    // طلب الإذن من نظام التشغيل
    Notification.requestPermission().then(function(permission) {
      var granted = permission === "granted";
      if (callback) callback(granted);
    });
  } else {
    // الإذن مرفوض مسبقاً
    if (callback) callback(false);
  }
} else {
  // المتصفح لا يدعم الإشعارات
  if (callback) callback(false);
}
}

// 3. إرسال الإشعار الحقيقي إلى نظام تشغيل جهاز الطالب (موبايل / كمبيوتر)
//title: عنوان الإشعار، body: نص الإشعار، targetEmail: إرسال لطالب محدد أو "ALL"، targetUrl: الرابط الذي يفتح عند النقر
function sendSystemPushNotification(title, body, targetEmail, targetUrl) {
// (اختياري) حفظ الإشعار محلياً لسجل الإشعارات في الموقع
var notifications = JSON.parse(localStorage.getItem("edu_system_notifications")) || [];
var notifPayload = {
  id: "NOTIF_" + Date.now(),
  title: title,
  body: body,
  targetEmail: targetEmail || "ALL",
  targetUrl: targetUrl || "dashboard.html",
  timestamp: new Date().toLocaleString("ar-EG")
};
notifications.unshift(notifPayload);
localStorage.setItem("edu_system_notifications", JSON.stringify(notifications));

var currentUser = getCurrentUser();
// التحقق مما إذا كان الإشعار موجهاً للمستخدم الحالي (أو للجميع)
if (currentUser && (targetEmail === "ALL" || targetEmail === currentUser.email)) {
  // استدعاء دالة إظهار الإشعار على الجهاز
  triggerDeviceNativeNotification(title, body, targetUrl);
  // إظهار Toast داخل الموقع أيضاً
  showToast(body, "info", title);
}
}

// 4. الدالة الداخلية التي تتحدث مع الـ Service Worker لإظهار الإشعار على الجهاز
function triggerDeviceNativeNotification(title, body, targetUrl) {
// التحقق من وجود دعم الإشعارات وموافقة الطالب
if (!("Notification" in window) || Notification.permission !== "granted") {
  return;
}

// محاولة الإرسال عبر Service Worker (الطريقة الأفضل والأكثر توافقاً، تعمل في الخلفية)
if (navigator.serviceWorker && navigator.serviceWorker.controller) {
  // إرسال رسالة لملف sw.js ليقوم بإظهار الإشعار
  navigator.serviceWorker.controller.postMessage({
    type: "TRIGGER_NATIVE_NOTIFICATION",
    title: title,
    body: body,
    url: targetUrl || "dashboard.html"
  });
} else if (swRegistration && swRegistration.showNotification) {
  // Fallback: استخدام الـ registration المباشر إذا لم يكن الـ controller جاهزاً
  swRegistration.showNotification(title, {
    body: body,
    icon: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=192&q=80",
    vibrate: [200, 100, 200],
    data: { url: targetUrl || "dashboard.html" }
  });
} else {
  // Fallback الأخير: استخدام الـ Notification API المباشرة (تعمل فقط إذا كان المتصفح مفتوحاً ومرئياً)
  try {
    var n = new Notification(title, {
      body: body,
      icon: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=192&q=80"
    });
    n.onclick = function() {
      window.focus(); // التركيز على النافذة
      window.location.href = targetUrl || "dashboard.html"; // الانتقال للرابط
    };
  } catch (e) {
    console.log("✗ فشل إظهار الإشعار بأي طريقة: ", e);
  }
}
}

// 5. (اختياري) الاستماع الفوري لتحديثات الإشعارات عبر النوافذ المفتوحة
// لمنع تكرار الإشعارات إذا فتح الطالب الموقع في أكثر من علامة تبويب
window.addEventListener("storage", function(e) {
if (e.key === "edu_system_notifications") {
  var notifications = JSON.parse(e.newValue || "[]");
  if (notifications.length > 0) {
    var latest = notifications[0];
    var currentUser = getCurrentUser();
    // إذا كان الإشعار جديداً وموجهاً للمستخدم، أظهره
    if (currentUser && (latest.targetEmail === "ALL" || latest.targetEmail === currentUser.email)) {
      triggerDeviceNativeNotification(latest.title, latest.body, latest.targetUrl);
      showToast(latest.body, "info", latest.title);
    }
  }
}
});


// =========================================
// ثالثاً: وظائف الحماية الأصلية القديمة - لم تتغير
// =========================================

function sanitizeText(str) {
if (!str) return "";
var temp = document.createElement("div");
temp.textContent = str;
return temp.innerHTML;
}

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

function verifySessionIntegrity() {
var user = getCurrentUser();
if (!user) return;

var users = JSON.parse(localStorage.getItem("edu_users")) || [];
var dbUser = users.find(function(u) { return u.email === user.email; });

if (dbUser && user.role !== dbUser.role) {
  recordSecurityBreach("محاولة رفع صلاحيات", "محاولة تعديل رتبة الحساب محلياً إلى: " + user.role, "CRITICAL");
  user.role = dbUser.role;
  localStorage.setItem("current_user", JSON.stringify(user));
}
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
      recordSecurityBreach("فحص العناصر أو محاولة تسجيل شاشة", "تم استخدام الاختصار: " + e.key, "MEDIUM");
      showToast("محتوى المنصة محمي بأنظمة الأمان", "error", "تنبيه أمان");
    }
  }
});
}


// =========================================
// رابعاً: تهيئة قاعدة البيانات الوهمية القديمة والتفاعلات - لم تتغير
// =========================================

function initPlatformDatabase() {
// تهيئة حساب Super Admin إذا لم يكن موجوداً
var users = JSON.parse(localStorage.getItem("edu_users")) || [];
if (!users.some(function(u) { return u.email.toLowerCase() === "superadmin@platform.com"; })) {
  users.unshift({
    fullName: "أ/ محمد السعيد (المشرف العام)",
    email: "superadmin@platform.com",
    password: "admin123",
    studentPhone: "01000000000",
    parentPhone: "01000000000",
    governorate: "كفر الشيخ",
    schoolName: "إدارة المنصة",
    educationType: "GENERAL",
    role: "SUPER_ADMIN",
    enrolledCourses: ["c1", "c2"],
    courseAccessCount: {}
  });
  localStorage.setItem("edu_users", JSON.stringify(users));
}

// تهيئة الكورسات الافتراضية
if (!localStorage.getItem("edu_courses")) {
  var defaultCourses = [
    {
      id: "c1",
      title: "كورس التأسيس ومدخل الكيمياء (مجاني)",
      desc: "محاضرات تأسيسية مجانية لشرح قواعد التوزيع الإلكتروني وأعداد التأكسد الهامة.",
      price: 0,
      isFree: true,
      maxViewsType: "unlimited",
      maxViews: 0,
      tag: "الصف الثالث الثانوي",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
      lessons: [
        { id: 1, title: "المحاضرة 1: مدخل السلسلة الانتقالية الأولى وحالات التأكسد", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "45 دقيقة", pdfs: [] },
        { id: 2, title: "المحاضرة 2: الخواص المغناطيسية والألوان والسبائك", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "50 دقيقة", pdfs: [] }
      ],
      attachments: [{ name: "مذكرة تفاعلات الحديد والأكاسيد (PDF)", size: "3.8 MB" }],
      examId: "e1"
    },
    {
      id: "c2",
      title: "كورس الكيمياء العضوية الشامل",
      desc: "تأسيس الهيدروكربونات، التسمية بنظام الأيوباك، وتفاعلات الكحولات والأحماض بأعلى نواتج التعلم مع أ/ محمد السعيد.",
      price: 300,
      isFree: false,
      maxViewsType: "limited",
      maxViews: 6,
      tag: "الصف الثالث الثانوي",
      image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80",
      lessons: [
        { id: 1, title: "المحاضرة 1: مقدمة التسمية ونظام الأيوباك", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "55 دقيقة", pdfs: [] },
        { id: 2, title: "المحاضرة 2: الألكانات والألكينات والتفاعلات الإضافية", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "65 دقيقة", pdfs: [] }
      ],
      attachments: [{ name: "مخطط التفاعلات العضوية الشامل", size: "6.2 MB" }],
      examId: "e2"
    }
  ];
  localStorage.setItem("edu_courses", JSON.stringify(defaultCourses));
}

// تهيئة الامتحانات واللوجات الأخرى
if (!localStorage.getItem("edu_exams")) {
  var defaultExams = [
    {
      id: "e1",
      courseId: "c1",
      isGeneral: false,
      title: "امتحان العناصر الانتقالية وتفاعلات الأكاسيد",
      subject: "كيمياء 3 ث",
      durationMinutes: 20,
      maxAttempts: 2,
      questions: [
        { q: "أي من الأيونات الآتية يعتبر دايامغناطيسي وغير ملون؟", options: ["Sc³⁺", "Fe²⁺", "Cu²⁺", "Cr³⁺"], correct: 0 },
        { q: "عند تسخين أوكسالات الحديد II بمعزل عن الهواء يتكون:", options: ["أكسيد الحديد III", "أكسيد الحديد II", "أكسيد الحديد المغناطيسي", "برادة الحديد"], correct: 1 }
      ]
    }
  ];
  localStorage.setItem("edu_exams", JSON.stringify(defaultExams));
}

if (!localStorage.getItem("edu_faqs")) {
  localStorage.setItem("edu_faqs", JSON.stringify([
    { q: "كيف يمكنني الاشتراك في الكورسات؟", a: "للكورسات المجانية: يتم التفعيل فورا. للكورسات المدفوعة: يتم تحويل الرسوم ورفع صورة الإيصال ليتم الاعتماد." },
    { q: "هل يمكنني مشاهدة المحاضرات أكثر من مرة؟", a: "نعم، الكورسات توفر إما مشاهدة مفتوحة أو عدد مرات دخول محدد وكاف للدراسة." },
    { q: "كيف أتواصل مع الدعم؟", a: "توفر المنصة محادثة مباشرة للمتابعة وطرح الأسئلة على مدار اليوم." }
  ]));
}

// تهيئة الجداول الفارغة إذا لم تكن موجودة
if (!localStorage.getItem("edu_payments")) localStorage.setItem("edu_payments", JSON.stringify([]));
if (!localStorage.getItem("edu_submissions")) localStorage.setItem("edu_submissions", JSON.stringify([]));
if (!localStorage.getItem("edu_live_chats")) localStorage.setItem("edu_live_chats", JSON.stringify([]));
if (!localStorage.getItem("edu_course_watch_logs")) localStorage.setItem("edu_course_watch_logs", JSON.stringify({}));
if (!localStorage.getItem("edu_hacker_logs")) localStorage.setItem("edu_hacker_logs", JSON.stringify([]));
if (!localStorage.getItem("edu_system_notifications")) localStorage.setItem("edu_system_notifications", JSON.stringify([]));

// سجل النشاطات الافتراضي
if (!localStorage.getItem("edu_activity_logs")) {
  localStorage.setItem("edu_activity_logs", JSON.stringify([
    { id: Date.now(), actorName: "أ/ محمد السعيد", actorRole: "SUPER_ADMIN", actionType: "تهيئة المنظومة", details: "تم تشغيل المنصة بنجاح.", timestamp: new Date().toLocaleString("ar-EG") }
  ]));
}
}
initPlatformDatabase(); // تشغيل تهيئة قاعدة البيانات فوراً


// =========================================
// خامساً: واجهة المستخدم والتفاعلات العامة - لم تتغير القديمة
// =========================================

var preloaderActive = false;
function injectChemicalPreloader() {
if (document.getElementById("chemicalPreloader") || preloaderActive) return;
preloaderActive = true;

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
      '<div class="lab-bubble"></div>' +
      '<div class="lab-bubble"></div>' +
    '</div>' +
  '</div>' +
  '<div class="loader-brand-title">منصة هي كيميا<span>!</span></div>' +
  '<div class="loader-dynamic-phrase" id="loaderDynamicPhrase">جاري تحميل المنصة...</div>' +
  '<div class="loader-counter-num" id="loaderCounterNum">0%</div>' +
  '<div class="loader-counter-phrase" id="loaderDynamicPhrase">جاري تحميل المنصة...</div>' +
  '<div class="loader-bar-outer"><div class="loader-bar-inner" id="loaderBarFill"></div></div>';

document.body.prepend(preloader);

var startTime = Date.now();
var duration = 3000;
var barFill = document.getElementById("loaderBarFill");
var counterNum = document.getElementById("loaderCounterNum");
var phraseElem = document.getElementById("loaderDynamicPhrase");

var phrases = [
  { at: 0, text: "جاري تحضير المحتوى التعليمي..." },
  { at: 35, text: "تجهيز الاختبارات ونواتج التعلم..." },
  { at: 75, text: "اكتمل التجهيز.. أهلاً بك في المنظومة" }
];

var timer = setInterval(function() {
  var elapsed = Date.now() - startTime;
  var progress = Math.min(100, Math.round((elapsed / duration) * 100));

  if (barFill) barFill.style.width = progress + "%";
  if (counterNum) counterNum.innerText = progress + "%";

  if (phraseElem) {
    if (progress >= 75) phraseElem.innerText = phrases[2].text;
    else if (progress >= 35) phraseElem.innerText = phrases[1].text;
    else phraseElem.innerText = phrases[0].text;
  }

  if (progress >= 100) {
    clearInterval(timer);
    setTimeout(function() {
      preloader.classList.add("hide-preloader");
      setTimeout(function() { preloader.remove(); }, 600);
    }, 150);
  }
}, 30);
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
localStorage.removeItem("current_user");
window.location.href = "login.html";
}

// حماية المسارات والفصل بين الطالب والإدارة
// تم تحديث هذه الدالة لإضافة زر تفعيل الإشعارات للطالب
function updateNavbarAndAuthGuards() {
verifySessionIntegrity();
var user = getCurrentUser();
var currentPath = window.location.pathname.toLowerCase();

// منع دخول لوحة الإدارة لغير المسؤولين
if (currentPath.includes("admin.html")) {
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    recordSecurityBreach("دخول غير مصرح للإدارة", "محاولة فتح لوحة الإدارة بدون رتبة مسؤولة", "CRITICAL");
    window.location.replace("login.html");
    return;
  }
}

// منع دخول أصحاب الرتب الإدارية لبروفايل الطالب (لوحة الطالب)
if (currentPath.includes("dashboard.html")) {
  if (!user) {
    window.location.replace("login.html");
    return;
  }
  // فصل الرتب: الإدمن يذهب للوحة الإدارة
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    window.location.replace("admin.html");
    return;
  }
  // الدعم يذهب لشات الدعم
  if (user.role === "SUPPORT") {
    window.location.replace("support.html");
    return;
  }
  // الطالب يكمل عادي
}

// حماية صفحات المشاهدة والامتحانات لغير المسجلين
if (currentPath.includes("course-view.html") || currentPath.includes("exam.html")) {
  if (!user) {
    window.location.replace("login.html");
    return;
  }
}

// توجيه المستخدم إذا كان مسجلاً ودخل صفحة الدخول أو التسجيل
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

// تحديث أزرار التنقل (Navbar)
var authBox = document.getElementById("navAuthBox");
if (authBox) {
  if (user) {
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      authBox.innerHTML = '<a href="admin.html" class="nav-btn-primary">لوحة الإدارة</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
    } else if (user.role === "SUPPORT") {
      authBox.innerHTML = '<a href="support.html" class="nav-btn-primary">شات الدعم</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
    } else {
      // إضافة إشعار بسيط بقبول الإشعارات على الجهاز في الترويسة للطالب إذا لم يكن قد وافق بعد
      // ملاحظة: قد تحتاج لتنسيق CSS لزر .notif-bell-btn
      var notifStatus = (Notification.permission === "granted") ? "" : '<button onclick="enablePushNotifications()" class="notif-bell-btn" title="تفعيل إشعارات الجهاز">🔔</button>';
      
      authBox.innerHTML = notifStatus + '<a href="dashboard.html" class="nav-btn-primary">لوحة الطالب (' + sanitizeText(user.fullName.split(" ")[0]) + ')</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
    }
  } else {
    authBox.innerHTML = '<a href="login.html" class="nav-btn-link">تسجيل الدخول</a><a href="register.html" class="nav-btn-primary">حساب جديد</a>';
  }
}

// إخفاء روابط التسجيل من الفوتر إذا كان مسجلاً
if (user) {
  document.querySelectorAll(".footer-links-list a").forEach(function(link) {
    if (link.getAttribute("href") === "login.html" || link.getAttribute("href") === "register.html") {
      link.parentElement.style.display = "none";
    }
  });
}
}

// دالة مساعدة لتفعيل الإشعارات من الـ Navbar (للطالب)
window.enablePushNotifications = function() {
requestNotificationPermission(function(granted) {
  if (granted) {
    showToast("تم تفعيل إشعارات الجهاز بنجاح. ستصلك تحديثات أ/ محمد السعيد فوراً.", "success");
    // تحديث البار لإخفاء الجرس
    updateNavbarAndAuthGuards();
  } else {
    showToast("لم يتم تفعيل الإشعارات. يرجى السماح بها من إعدادات المتصفح لاستلام التحديثات.", "error");
  }
});
}

function handleEnrollClick(courseId) {
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
  setTimeout(function() {
    window.location.href = "course-view.html?id=" + courseId;
  }, 800);
  return;
}

if (user.enrolledCourses && user.enrolledCourses.includes(courseId)) {
  showToast("أنت مشترك بالفعل في هذا الكورس", "success");
  setTimeout(function() {
    window.location.href = "course-view.html?id=" + courseId;
  }, 800);
  return;
}

var courses = JSON.parse(localStorage.getItem("edu_courses")) || [];
var course = courses.find(function(c) { return c.id == courseId; });

if (course && (course.isFree || Number(course.price) === 0)) {
  if (!confirm("هل تؤكد رغبتك في الاشتراك بالكورس المجاني: " + course.title + "؟")) {
    return;
  }

  var users = JSON.parse(localStorage.getItem("edu_users")) || [];
  var uIdx = users.findIndex(function(u) { return u.email === user.email; });
  if (uIdx !== -1) {
    if (!users[uIdx].enrolledCourses) users[uIdx].enrolledCourses = [];
    users[uIdx].enrolledCourses.push(courseId);
    localStorage.setItem("edu_users", JSON.stringify(users));

    user.enrolledCourses = users[uIdx].enrolledCourses;
    localStorage.setItem("current_user", JSON.stringify(user));

    logAdminAction("اشتراك كورس مجاني", "اشترك الطالب " + user.fullName + " في الكورس: " + course.title);
    showToast("تم تفعيل الكورس في حسابك بنجاح", "success");
    setTimeout(function() {
      window.location.href = "course-view.html?id=" + courseId;
    }, 1000);
    return;
  }
}

// للكورسات المدفوعة
if (confirm("هل تريد الانتقال لصفحة تأكيد ودفع رسوم الكورس: " + (course ? course.title : "") + "؟")) {
  window.location.href = "checkout.html?course=" + courseId;
}
}

// دالة مخصصة لأزرار الاشتراك في الـ Hero (توافق قديم)
window.handleHeroEnroll = function() {
var user = getCurrentUser();
if (user) {
  if (user.role === "STUDENT") window.location.href = "#courses";
  else window.location.href = "admin.html";
} else {
  window.location.href = "register.html";
}
}

// دالة عالمية لاستدعاء الدفع من الـ HTML (توافق قديم)
window.handleEnrollClick = handleEnrollClick;
window.logout = logout;


// =========================================
// سادساً: التنفيذ عند تحميل الصفحة
// =========================================

document.addEventListener("DOMContentLoaded", function() {
// 1. تسجيل نظام إشعارات الجهاز (الجديد)
registerDeviceServiceWorker();

// 2. تشغيل أنظمة الأمان المحلية
initSecurityGuards();

// 3. إظهار التحميل الكيميائي
injectChemicalPreloader();

// 4. تحديث الواجهة والتحقق من المسارات
updateNavbarAndAuthGuards();
});