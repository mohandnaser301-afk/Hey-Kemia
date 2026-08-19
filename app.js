// --- المحرك البرمجي لمنصة هي كيميا ! ---

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
  if (!localStorage.getItem("edu_activity_logs")) {
    localStorage.setItem("edu_activity_logs", JSON.stringify([
      { id: Date.now(), actorName: "أ/ محمد السعيد", actorRole: "SUPER_ADMIN", actionType: "تهيئة المنصة", details: "تم تشغيل منصة هي كيميا بنجاح.", timestamp: new Date().toLocaleString('ar-EG') }
    ]));
  }
}
initPlatformDatabase();

// إعداد وحقن معمل اللودينج الكيميائي وتشغيله لمدة 3 ثوانٍ كاملة
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
      }, 150);
    }
  }, 30);
}

// تحويل انتقالات الروابط
function initPageTransitionAnimations() {
  document.addEventListener("click", function(e) {
    var target = e.target.closest("a");
    if (!target) return;

    var href = target.getAttribute("href");
    if (
      href && 
      !href.startsWith("#") && 
      !href.startsWith("javascript") && 
      !href.startsWith("tel:") && 
      !href.startsWith("mailto:") && 
      !href.startsWith("https://wa.me") && 
      target.getAttribute("target") !== "_blank"
    ) {
      var preloader = document.getElementById("chemicalPreloader");
      if (preloader) {
        e.preventDefault();
        preloader.classList.remove("hide-preloader");
        var barFill = document.getElementById("loaderBarFill");
        var counterNum = document.getElementById("loaderCounterNum");
        if (barFill) barFill.style.width = "40%";
        if (counterNum) counterNum.innerText = "40%";

        setTimeout(function() {
          if (barFill) barFill.style.width = "100%";
          if (counterNum) counterNum.innerText = "100%";
          setTimeout(function() {
            window.location.href = href;
          }, 200);
        }, 600);
      }
    }
  });
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
      '<span class="toast-title">' + title + '</span>' +
      '<span class="toast-message">' + message + '</span>' +
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
    actorName: user.fullName,
    actorRole: user.role,
    actionType: actionType,
    details: details,
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

function updateNavbarAndAuthGuards() {
  var user = getCurrentUser();
  var currentPath = window.location.pathname.toLowerCase();

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
        authBox.innerHTML = '<a href="dashboard.html" class="nav-btn-primary">لوحة الطالب (' + user.fullName.split(' ')[0] + ')</a><button onclick="logout()" class="nav-btn-link">تسجيل الخروج</button>';
      }
    } else {
      authBox.innerHTML = '<a href="login.html" class="nav-btn-link">تسجيل الدخول</a><a href="register.html" class="nav-btn-primary">حساب جديد</a>';
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
  injectChemicalPreloader();
  initPageTransitionAnimations();
  updateNavbarAndAuthGuards();
});