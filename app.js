// --- محرك منصة هي كيميا ! الشامل والمستقل ---

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

  // 1. الكورسات والمحاضرات
  if (!localStorage.getItem("edu_courses")) {
    var defaultCourses = [
      {
        id: "c1",
        title: "كورس الباب الأول: العناصر الانتقالية والتأسيس الكيميائي",
        desc: "8 محاضرات لشرح حالات التأكسد، خواص وتفاعلات الحديد ومركباته بالأفكار الوزارية العليا مع أ/ محمد السعيد.",
        price: 220,
        maxViews: 5,
        tag: "الصف الثالث الثانوي",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
        lessons: [
          { id: 1, title: "المحاضرة 1: مدخل السلسلة الانتقالية الأولى وحالات التأكسد", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "45 دقيقة" },
          { id: 2, title: "المحاضرة 2: الخواص المغناطيسية والألوان والسبائك", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "50 دقيقة" },
          { id: 3, title: "المحاضرة 3: استخلاص وتفاعلات أكاسيد الحديد", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "60 دقيقة" }
        ],
        attachments: [{ name: "مذكرة تفاعلات الحديد والأكاسيد (PDF)", size: "3.8 MB" }],
        examId: "e1"
      },
      {
        id: "c2",
        title: "كورس الكيمياء العضوية الشامل 🧪",
        desc: "تأسيس الهيدروكربونات، التسمية بنظام الأيوباك، وتفاعلات الكحولات والأحماض بأعلى نواتج التعلم مع أ/ محمد السعيد.",
        price: 300,
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

  // 2. الامتحانات
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

  // 3. الأسئلة الشائعة FAQ
  if (!localStorage.getItem("edu_faqs")) {
    localStorage.setItem("edu_faqs", JSON.stringify([
      { q: "كيف يمكنني الاشتراك في كورسات أ/ محمد السعيد؟", a: "بكل سهولة: اختر الكورس الذي تريده، واضغط على 'الاشتراك في الكورس'، ثم حول المبلغ عبر فودافون كاش أو فوري وارفع صورة الإيصال ليتم تفعيل حسابك من الإدارة فوراً." },
      { q: "هل يمكنني مشاهدة المحاضرات أكثر من مرة؟", a: "نعم، كل كورس محدد بعدد مرات دخول كافٍ جداً لمشاهدة المحاضرات ومراجعتها وحل تدريباتها مع نظام حماية مخصص لكل طالب." },
      { q: "ماذا يحدث إذا واجهت مسألة صعبة أثناء المذاكرة؟", a: "توفر لك المنصة غرفة شات لايف مباشرة للتواصل مع أ/ محمد السعيد وفريق الدعم الفني لطرح الأسئلة ومتابعة الإجابات خطوة بخطوة." }
    ]));
  }

  if (!localStorage.getItem("edu_payments")) localStorage.setItem("edu_payments", JSON.stringify([]));
  if (!localStorage.getItem("edu_submissions")) localStorage.setItem("edu_submissions", JSON.stringify([]));
  if (!localStorage.getItem("edu_live_chats")) localStorage.setItem("edu_live_chats", JSON.stringify([]));
  if (!localStorage.getItem("edu_activity_logs")) {
    localStorage.setItem("edu_activity_logs", JSON.stringify([
      { id: Date.now(), actorName: "أ/ محمد السعيد", actorRole: "SUPER_ADMIN", actionType: "تهيئة المنصة", details: "تم تشغيل منصة هي كيميا ! بنجاح.", timestamp: new Date().toLocaleString('ar-EG') }
    ]));
  }
}
initPlatformDatabase();

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

function updateNavbar() {
  var authBox = document.getElementById("navAuthBox");
  var user = getCurrentUser();
  if (!authBox) return;
  
  if (user) {
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      authBox.innerHTML = '<a href="admin.html" class="nav-btn-primary">لوحة الإدارة 🧪</a><button onclick="logout()" class="nav-btn-link">خروج 🚪</button>';
    } else if (user.role === "SUPPORT") {
      authBox.innerHTML = '<a href="support.html" class="nav-btn-primary">شات الدعم 💬</a><button onclick="logout()" class="nav-btn-link">خروج 🚪</button>';
    } else {
      authBox.innerHTML = '<a href="dashboard.html" class="nav-btn-primary">لوحة الطالب (' + user.fullName.split(' ')[0] + ') 📊</a><button onclick="logout()" class="nav-btn-link">خروج 🚪</button>';
    }
  } else {
    authBox.innerHTML = '<a href="login.html" class="nav-btn-link">تسجيل الدخول</a><a href="register.html" class="nav-btn-primary">حساب جديد ✨</a>';
  }
}

function handleEnrollClick(courseId) {
  var user = getCurrentUser();
  if (!user) {
    alert("يرجى تسجيل الدخول أولاً للاشتراك!");
    window.location.href = "login.html?redirect=checkout.html?course=" + courseId;
  } else {
    window.location.href = "checkout.html?course=" + courseId;
  }
}

document.addEventListener("DOMContentLoaded", function() {
  updateNavbar();
});