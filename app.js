// --- المحرك البرمجي وحصن الأمان لمنصة هي كيميا ! ---

// 1. نظام الحماية وسد ثغرات المتصفح وحقن الأكواد (Anti-XSS Sanitizer)
function sanitizeText(str) {
  if (!str) return "";
  var temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

// 2. تسجيل ورصد محاولات الاختراق في لوحة الإدارة (Hacker Log System)
function recordSecurityBreach(attackType, details, severity) {
  severity = severity || "HIGH";
  var currentUser = getCurrentUser() || { fullName: "مجهول / IP مشبوه", email: "guest@threat.net" };
  var breaches = JSON.parse(localStorage.getItem("edu_hacker_logs")) || [];
  
  breaches.unshift({
    id: "HCK_" + Date.now(),
    timestamp: new Date().toLocaleString('ar-EG'),
    userName: sanitizeText(currentUser.fullName),
    userEmail: sanitizeText(currentUser.email),
    attackType: sanitizeText(attackType),
    details: sanitizeText(details),
    severity: severity,
    userAgent: navigator.userAgent
  });
  
  localStorage.setItem("edu_hacker_logs", JSON.stringify(breaches));
}

// 3. التحقق الصارم من سلامة الجلسة ومنع تزوير الصلاحيات بالـ LocalStorage
function verifySessionIntegrity() {
  var user = getCurrentUser();
  if (!user) return;

  var users = JSON.parse(localStorage.getItem("edu_users")) || [];
  var dbUser = users.find(function(u) { return u.email === user.email; });

  if (dbUser && user.role !== dbUser.role) {
    recordSecurityBreach("تزوير صلاحيات (Privilege Escalation)", "حاول المستخدم تزوير رتبته محلياً إلى: " + user.role, "CRITICAL");
    user.role = dbUser.role;
    localStorage.setItem("current_user", JSON.stringify(user));
  }
}

// 4. كاشف فتح أدوات المطورين ومحاولات الفحص البرمجي
function initSecurityGuards() {
  document.addEventListener("keydown", function(e) {
    if (
      e.key === "F12" || 
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
      (e.ctrlKey && (e.key === "u" || e.key === "U" || e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P"))
    ) {
      if (!window.location.pathname.includes("admin.html")) {
        e.preventDefault();
        recordSecurityBreach("محاولة فتح DevTools أو تصوير", "تم الضغط على اختصار: " + e.key, "MEDIUM");
        showToast("محتوى المنصة محمي بأنظمة الأمان المشفرة", "error");
      }
    }
  });
}

function initPlatformDatabase() {
  var users = JSON.parse(localStorage.getItem("edu_users")) || [];
  if (!users.some(function(u) { return u.email.toLowerCase() === "superadmin@platform.com"; })) {
    users.unshift({
      fullName: "أ/ محمد السعيد (المشرف العام)",
      email: "superadmin@platform.com",
      password: "admin123",
      studentPhone: "01000000000",
      parentPhone: "01000000000",
      governorate: "كفر الشيخ",
      schoolName: "إدارة هي كيميا !",
      educationType: "GENERAL",
      role: "SUPER_ADMIN",
      enrolledCourses: ["c1", "c2"],
      courseAccessCount: {}
    });
    localStorage.setItem("edu_users", JSON.stringify(users));
  }

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
          { id: 1, title: "المحاضرة 1: مدخل السلسلة الانتقالية الأولى وحالات التأكسد", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "45 دقيقة" },
          { id: 2, title: "المحاضرة 2: الخواص المغناطيسية والألوان والسبائك", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "50 دقيقة" }
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
          { id: 1, title: "المحاضرة 1: مقدمة التسمية ونظام الأيوباك", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "55 دقيقة" },
          { id: 2, title: "المحاضرة 2: الألكانات والألكينات والتفاعلات الإضافية", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "65 دقيقة" }
        ],
        attachments: [{ name: "مخطط التفاعلات العضوية الشامل", size: "6.2 MB" }],
        examId: "e2"
      }
    ];
    localStorage.setItem("edu_courses", JSON.stringify(defaultCourses));
  }

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
      { q: "كيف يمكنني الاشتراك في كورسات أ/ محمد السعيد؟", a: "للكورسات المجانية: اضغط اشتراك ويتم تفعيلها فوراً بحسابك. للكورسات المدفوعة: اضغط على 'الاشتراك في الكورس'، وحول الرسوم عبر فودافون كاش أو فوري وارفع صورة الإيصال." },
      { q: "هل يمكنني مشاهدة المحاضرات أكثر من مرة؟", a: "نعم، الكورسات توفر إما مشاهدة مفتوحة غير محدودة أو عدد مرات دخول محدد وكافٍ جداً للمراجعة." },
      { q: "ماذا يحدث إذا واجهت مسألة صعبة أثناء المذاكرة؟", a: "توفر المنصة شات مباشر للتواصل مع أ/ محمد السعيد وفريق الدعم لطرح الأسئلة ومتابعة الإجابات خطوة بخطوة." }
    ]));
  }

  if (!localStorage.getItem("edu_payments")) localStorage.setItem("edu_payments", JSON.stringify([]));
  if (!localStorage.getItem("edu_submissions")) localStorage.setItem("edu_submissions", JSON.stringify([]));
  if (!localStorage.getItem("edu_live_chats")) localStorage.setItem("edu_live_chats", JSON.stringify([]));
  if (!localStorage.getItem("edu_course_watch_logs")) localStorage.setItem("edu_course_watch_logs", JSON.stringify({}));
  if (!localStorage.getItem("edu_hacker_logs")) localStorage.setItem("edu_hacker_logs", JSON.stringify([]));
  if (!localStorage.getItem("edu_activity_logs")) {
    localStorage.setItem("edu_activity_logs", JSON.stringify([
      { id: Date.now(), actorName: "أ/ محمد السعيد", actorRole: "SUPER_ADMIN", actionType: "تهيئة المنصة", details: "تم تشغيل منصة هي كيميا بنجاح مع تفعيل نظام الحماية المطور.", timestamp: new Date().toLocaleString('ar-EG') }
    ]));
  }
}
initPlatformDatabase();

// إعداد اللودينج وتشغيله لمرة واحدة فقط لمدة 3 ثوانٍ
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
    '<div class="loader-dynamic-phrase" id="loaderDynamicPhrase">جاري تحضير المحاليل والتفاعلات...</div>' +
    '<div class="loader-counter-num" id="loaderCounterNum">0%</div>' +
    '<div class="loader-bar-outer"><div class="loader-bar-inner" id="loaderBarFill"></div></div>';

  document.body.prepend(preloader);

  var startTime = Date.now();
  var duration = 3000;
  var barFill = document.getElementById("loaderBarFill");
  var counterNum = document.getElementById("loaderCounterNum");
  var phraseElem = document.getElementById("loaderDynamicPhrase");

  var phrases = [
    { at: 0, text: "جاري تحضير المحاليل والتفاعلات الكيميائية..." },
    { at: 35, text: "تجهيز نواتج التعلم وتدريبات أ/ محمد السعيد..." },
    { at: 75, text: "اكتمال التفاعل.. أهلاً بك في المنظومة!" }
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
  title = title || (type === "success" ? "تم بنجاح" : type === "error" ? "تنبيه" : "معلومات");

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
  }, 4000);
}

function logAdminAction(actionType, details) {
  var user = getCurrentUser() || { fullName: "زائر", role: "GUEST" };
  var logs = JSON.parse(localStorage.getItem("edu_activity_logs")) || [];
  logs.unshift({
    id: Date.now(),
    actorName: sanitizeText(user.fullName),
    actorRole: sanitizeText(user.role),
    actionType: sanitizeText(actionType),
    details: sanitizeText(details),
    timestamp: new Date().toLocaleString('ar-EG')
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

// حماية مسارات وقوائم المنصة
function updateNavbarAndAuthGuards() {
  verifySessionIntegrity();
  var user = getCurrentUser();
  var currentPath = window.location.pathname.toLowerCase();

  // منع الدخول لصفحات الإدارة لغير المسؤولين
  if (currentPath.includes("admin.html")) {
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      recordSecurityBreach("محاولة دخول غير مصرح للوحة الإدارة", "محاولة دخول بدون صلاحيات لصفحة admin.html", "CRITICAL");
      window.location.replace("login.html");
      return;
    }
  }

  // منع دخول لوحة الطالب لمن لم يسجل
  if (currentPath.includes("dashboard.html") || currentPath.includes("course-view.html") || currentPath.includes("exam.html")) {
    if (!user) {
      window.location.replace("login.html");
      return;
    }
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
        authBox.innerHTML = '<a href="admin.html" class="nav-btn-primary">لوحة الإدارة</a><button onclick="logout()" class="nav-btn-link">خروج</button>';
      } else if (user.role === "SUPPORT") {
        authBox.innerHTML = '<a href="support.html" class="nav-btn-primary">شات الدعم</a><button onclick="logout()" class="nav-btn-link">خروج</button>';
      } else {
        authBox.innerHTML = '<a href="dashboard.html" class="nav-btn-primary">لوحة الطالب (' + sanitizeText(user.fullName.split(' ')[0]) + ')</a><button onclick="logout()" class="nav-btn-link">خروج</button>';
      }
    } else {
      authBox.innerHTML = '<a href="login.html" class="nav-btn-link">دخول</a><a href="register.html" class="nav-btn-primary">حساب جديد</a>';
    }
  }

  if (user) {
    document.querySelectorAll(".footer-links-list a").forEach(function(link) {
      if (link.getAttribute("href") === "login.html" || link.getAttribute("href") === "register.html") {
        link.parentElement.style.display = "none";
      }
    });
  }
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

  if (user.enrolledCourses && user.enrolledCourses.includes(courseId)) {
    showToast("أنت مشترك بالفعل في هذا الكورس، جاري تحويلك للمحاضرات", "success");
    setTimeout(function() {
      window.location.href = "course-view.html?id=" + courseId;
    }, 800);
    return;
  }

  var courses = JSON.parse(localStorage.getItem("edu_courses")) || [];
  var course = courses.find(function(c) { return c.id == courseId; });

  if (course && (course.isFree || Number(course.price) === 0)) {
    var users = JSON.parse(localStorage.getItem("edu_users")) || [];
    var uIdx = users.findIndex(function(u) { return u.email === user.email; });
    if (uIdx !== -1) {
      if (!users[uIdx].enrolledCourses) users[uIdx].enrolledCourses = [];
      users[uIdx].enrolledCourses.push(courseId);
      localStorage.setItem("edu_users", JSON.stringify(users));

      user.enrolledCourses = users[uIdx].enrolledCourses;
      localStorage.setItem("current_user", JSON.stringify(user));

      logAdminAction("اشتراك مجاني", "اشترك الطالب " + user.fullName + " في الكورس المجاني: " + course.title);
      showToast("تم تفعيل الكورس المجاني بحسابك بنجاح!", "success");
      setTimeout(function() {
        window.location.href = "course-view.html?id=" + courseId;
      }, 1000);
      return;
    }
  }

  window.location.href = "checkout.html?course=" + courseId;
}

document.addEventListener("DOMContentLoaded", function() {
  initSecurityGuards();
  injectChemicalPreloader();
  updateNavbarAndAuthGuards();
});