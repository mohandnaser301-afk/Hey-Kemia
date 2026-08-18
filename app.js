// --- محرك منصة هي كيميا ! المستقل والمباشر 100% ---

function initPlatformDatabase() {
  // 1. حساب المشرف العام وحسابات الإدارة
  let users = JSON.parse(localStorage.getItem("edu_users")) || [];
  if (!users.some(u => u.email.toLowerCase() === "superadmin@platform.com")) {
    users.unshift({
      fullName: "أستاذ المادة (المشرف العام)",
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

  // 2. الكورسات والمحاضرات المتعددة
  if (!localStorage.getItem("edu_courses")) {
    const defaultCourses = [
      {
        id: "c1",
        title: "كورس الباب الأول: العناصر الانتقالية والتأسيس",
        desc: "توزيع الإلكترونات، حالات التأكسد، خواص وتفاعلات الحديد ومركباته بالتفصيل مع التدريبات.",
        price: 220,
        maxViews: 5,
        tag: "الصف الثالث الثانوي",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
        lessons: [
          { id: 1, title: "المحاضرة 1: السلسلة الانتقالية الأولى وحالات التأكسد", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "45 دقيقة" },
          { id: 2, title: "المحاضرة 2: الخواص المغناطيسية والألوان والسبائك", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "50 دقيقة" },
          { id: 3, title: "المحاضرة 3: استخلاص وتفاعلات أكاسيد الحديد", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "60 دقيقة" }
        ],
        attachments: [{ name: "مذكرة تفاعلات الحديد والأكاسيد (PDF)", size: "3.8 MB" }],
        examId: "e1"
      },
      {
        id: "c2",
        title: "كورس الكيمياء العضوية المكثف 🧪",
        desc: "تأسيس التسمية الأيوباك، الهيدروكربونات، وتفاعلات الكحولات والأحماض بالأفكار العالية.",
        price: 300,
        maxViews: 6,
        tag: "الصف الثالث الثانوي",
        image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80",
        lessons: [
          { id: 1, title: "المحاضرة 1: مقدمة التسمية ونظام الأيوباك", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "55 دقيقة" },
          { id: 2, title: "المحاضرة 2: الألكانات والألكينات والتفاعلات", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "65 دقيقة" }
        ],
        attachments: [{ name: "مخطط التفاعلات العضوية الشامل", size: "6.2 MB" }],
        examId: "e2"
      }
    ];
    localStorage.setItem("edu_courses", JSON.stringify(defaultCourses));
  }

  // 3. الامتحانات والمحاولات
  if (!localStorage.getItem("edu_exams")) {
    const defaultExams = [
      {
        id: "e1",
        courseId: "c1",
        isGeneral: false,
        title: "امتحان العناصر الانتقالية وتفاعلات الأكاسيد",
        subject: "كيمياء 3 ث",
        durationMinutes: 15,
        maxAttempts: 1,
        questions: [
          { q: "أي من الأيونات الآتية يعتبر دايامغناطيسي وغير ملون؟", options: ["Sc³⁺", "Fe²⁺", "Cu²⁺", "Cr³⁺"], correct: 0 },
          { q: "عند تسخين أوكسالات الحديد II بمعزل عن الهواء يتكون:", options: ["أكسيد الحديد III", "أكسيد الحديد II", "أكسيد الحديد المغناطيسي", "برادة الحديد"], correct: 1 }
        ]
      },
      {
        id: "e2",
        courseId: "0",
        isGeneral: true,
        title: "الامتحان الشامل التجريبي الأول على منهج الكيمياء 🏆",
        subject: "امتحان شامل عام",
        durationMinutes: 30,
        maxAttempts: 2,
        questions: [
          { q: "المركب العضوي الناتج من تفاعل الإيثين مع الماء في وسط حمضي هو:", options: ["الإيثانول", "حمض الأسيتيك", "الإيثانال", "الأسيتون"], correct: 0 }
        ]
      }
    ];
    localStorage.setItem("edu_exams", JSON.stringify(defaultExams));
  }

  if (!localStorage.getItem("edu_payments")) localStorage.setItem("edu_payments", JSON.stringify([]));
  if (!localStorage.getItem("edu_submissions")) localStorage.setItem("edu_submissions", JSON.stringify([]));
  if (!localStorage.getItem("edu_live_chats")) localStorage.setItem("edu_live_chats", JSON.stringify([]));
  if (!localStorage.getItem("edu_activity_logs")) {
    localStorage.setItem("edu_activity_logs", JSON.stringify([
      { id: Date.now(), actorName: "المشرف العام", actorRole: "SUPER_ADMIN", actionType: "تهيئة المنصة", details: "تم تفعيل وتشغيل المنصة بنجاح.", timestamp: new Date().toLocaleString('ar-EG') }
    ]));
  }
}
initPlatformDatabase();

// تسجيل العمليات
function logAdminAction(actionType, details) {
  const user = getCurrentUser() || { fullName: "زائر", role: "GUEST" };
  const logs = JSON.parse(localStorage.getItem("edu_activity_logs")) || [];
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

// المستخدم الحالي
function getCurrentUser() {
  const data = localStorage.getItem("current_user");
  return data ? JSON.parse(data) : null;
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem("current_user");
  window.location.href = "login.html";
}

// تحديث شريط التنقل
function updateNavbar() {
  const authBox = document.getElementById("navAuthBox");
  if (!authBox) return;
  const user = getCurrentUser();
  if (user) {
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      authBox.innerHTML = '<a href="admin.html" class="btn btn-primary">لوحة الإدارة 🧪</a><button onclick="logout()" class="btn btn-outline">خروج 🚪</button>';
    } else if (user.role === "SUPPORT") {
      authBox.innerHTML = '<a href="support.html" class="btn btn-primary">شات الدعم 💬</a><button onclick="logout()" class="btn btn-outline">خروج 🚪</button>';
    } else {
      authBox.innerHTML = '<a href="dashboard.html" class="btn btn-primary">لوحة الطالب 📊</a><button onclick="logout()" class="btn btn-outline">خروج 🚪</button>';
    }
  } else {
    authBox.innerHTML = '<a href="login.html" class="btn btn-outline">تسجيل الدخول</a><a href="register.html" class="btn btn-primary">حساب جديد ✨</a>';
  }
}

// توجيه للاشتراك
function handleEnrollClick(courseId) {
  const user = getCurrentUser();
  if (!user) {
    alert("يرجى تسجيل الدخول أولاً للاشتراك!");
    window.location.href = "login.html?redirect=checkout.html?course=" + courseId;
  } else {
    window.location.href = "checkout.html?course=" + courseId;
  }
}

// تسجيل الدخول
function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById("loginEmail").value.trim().toLowerCase();
  const passInput = document.getElementById("loginPassword").value.trim();

  const users = JSON.parse(localStorage.getItem("edu_users")) || [];
  let user = users.find(u => u.email.toLowerCase() === emailInput && u.password === passInput);

  if (!user && emailInput === "superadmin@platform.com" && passInput === "admin123") {
    user = {
      fullName: "أستاذ المادة (المشرف العام)",
      email: "superadmin@platform.com",
      role: "SUPER_ADMIN",
      governorate: "كفر الشيخ",
      enrolledCourses: ["c1", "c2"]
    };
  }

  if (!user) {
    alert("❌ البريد الإلكتروني أو كلمة المرور غير صحيحة!");
    return;
  }

  localStorage.setItem("current_user", JSON.stringify(user));
  logAdminAction("تسجيل دخول", `قام ${user.fullName} (${user.role}) بالدخول للمنصة.`);

  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (redirect) {
    window.location.href = redirect;
  } else if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    window.location.href = "admin.html";
  } else if (user.role === "SUPPORT") {
    window.location.href = "support.html";
  } else {
    window.location.href = "dashboard.html";
  }
}

// إنشاء الحساب
function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim().toLowerCase();
  let users = JSON.parse(localStorage.getItem("edu_users")) || [];

  if (users.some(u => u.email.toLowerCase() === email)) {
    alert("❌ هذا البريد مسجل بالفعل!");
    return;
  }

  const eduType = document.querySelector('input[name="educationType"]:checked');

  const newUser = {
    fullName: document.getElementById("fullName").value.trim(),
    email: email,
    password: document.getElementById("password").value.trim(),
    studentPhone: document.getElementById("studentPhone").value.trim(),
    parentPhone: document.getElementById("parentPhone").value.trim(),
    governorate: document.getElementById("governorate").value,
    schoolName: document.getElementById("schoolName").value.trim(),
    educationType: eduType ? eduType.value : "GENERAL",
    role: "STUDENT",
    enrolledCourses: [],
    courseAccessCount: {}
  };

  users.push(newUser);
  localStorage.setItem("edu_users", JSON.stringify(users));
  alert("🎉 تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();
  const lForm = document.getElementById("loginForm");
  if (lForm) lForm.addEventListener("submit", handleLogin);
  const rForm = document.getElementById("registerForm");
  if (rForm) rForm.addEventListener("submit", handleRegister);
});