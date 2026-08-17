// --- تهيئة Firebase من خلال مكتبات الـ CDN المباشرة ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCwH_1XfIPNBDR7uLxpPEQG0xjNydKMGsA",
  authDomain: "hey-kemia.firebaseapp.com",
  projectId: "hey-kemia",
  storageBucket: "hey-kemia.firebasestorage.app",
  messagingSenderId: "370186545560",
  appId: "1:370186545560:web:9b1a81d62e7eb65242a3ed",
  measurementId: "G-GWC88JE45F"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// تهيئة البيانات المحلية التلقائية للاحتياط
export function initLocalData() {
  if (!localStorage.getItem("edu_courses")) {
    const defaultCourses = [
      {
        id: "c1",
        title: "كورس الباب الأول: العناصر الانتقالية والتأسيس",
        desc: "توزيع الإلكترونات، حالات التأكسد، خواص وتفاعلات الحديد ومركباته بالتفصيل.",
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
        desc: "تأسيس التسمية بنظام الأيوباك، الهيدروكربونات، وتفاعلات الكحولات والأحماض بالأفكار العالية.",
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

  if (!localStorage.getItem("edu_exams")) {
    const defaultExams = [
      {
        id: "e1",
        courseId: "c1",
        isGeneral: false,
        title: "امتحان العناصر الانتقالية وتفاعلات الأكاسيد",
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
      { id: Date.now(), actorName: "المشرف العام", actorRole: "SUPER_ADMIN", actionType: "تهيئة النظام", details: "تم تشغيل المنصة السحابية بنجاح.", timestamp: new Date().toLocaleString('ar-EG') }
    ]));
  }
}
initLocalData();

export function logAction(actionType, details) {
  const user = getCurrentUser() || { fullName: "غير معروف", role: "GUEST" };
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

export function getCurrentUser() {
  const data = localStorage.getItem("current_user");
  return data ? JSON.parse(data) : null;
}

// تسجيل حساب جديد سحابياً ومحلياً
export async function registerStudent(userData) {
  try {
    let uid = "usr_" + Date.now();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      uid = userCredential.user.uid;
      await setDoc(doc(db, "users", uid), {
        fullName: userData.fullName,
        email: userData.email,
        studentPhone: userData.studentPhone,
        parentPhone: userData.parentPhone,
        governorate: userData.governorate,
        schoolName: userData.schoolName,
        educationType: userData.educationType,
        role: "STUDENT",
        enrolledCourses: [],
        courseAccessCount: {},
        createdAt: new Date().toISOString()
      });
    } catch(err) {
      console.warn("Firebase Auth Error, Fallback to Local:", err.message);
    }

    let users = JSON.parse(localStorage.getItem("edu_users")) || [];
    users.push({ uid, ...userData, role: "STUDENT", enrolledCourses: [], courseAccessCount: {} });
    localStorage.setItem("edu_users", JSON.stringify(users));

    alert("🎉 تم إنشاء الحساب بنجاح في قاعدة البيانات!");
    window.location.href = "login.html";
  } catch (error) {
    alert("❌ خطأ: " + error.message);
  }
}

// تسجيل الدخول والتحقق من الرتبة
export async function loginUser(email, password) {
  try {
    let userData = null;
    let uid = null;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      uid = userCredential.user.uid;
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        userData = userDoc.data();
      }
    } catch (err) {
      console.warn("Cloud login failed, checking fallback local database...");
    }

    if (!userData) {
      const localUsers = JSON.parse(localStorage.getItem("edu_users")) || [];
      const matched = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (matched) {
        userData = matched;
        uid = matched.uid || "local_" + Date.now();
      }
    }

    // حساب الطوارئ للمشرف العام
    if (!userData && email.toLowerCase() === "superadmin@platform.com" && password === "admin123") {
      userData = {
        fullName: "أستاذ المادة (المشرف العام)",
        email: "superadmin@platform.com",
        role: "SUPER_ADMIN",
        governorate: "كفر الشيخ",
        enrolledCourses: ["c1", "c2"]
      };
      uid = "admin_master";
    }

    if (!userData) {
      alert("❌ البريد الإلكتروني أو كلمة المرور غير صحيحة!");
      return;
    }

    const sessionUser = { uid, ...userData };
    localStorage.setItem("current_user", JSON.stringify(sessionUser));
    logAction("تسجيل دخول", `قام ${sessionUser.fullName} (${sessionUser.role}) بتسجيل الدخول.`);

    const redirect = new URLSearchParams(window.location.search).get("redirect");
    if (redirect) {
      window.location.href = redirect;
    } else if (sessionUser.role === "SUPER_ADMIN" || sessionUser.role === "ADMIN") {
      window.location.href = "admin.html";
    } else if (sessionUser.role === "SUPPORT") {
      window.location.href = "support.html";
    } else {
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    alert("❌ خطأ: " + error.message);
  }
}

export function updateNavbar() {
  const authBox = document.getElementById("navAuthBox");
  if (!authBox) return;
  const user = getCurrentUser();
  if (user) {
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      authBox.innerHTML = `<a href="admin.html" class="btn btn-primary">لوحة الإدارة 🧪</a><button onclick="logout()" class="btn btn-outline">خروج 🚪</button>`;
    } else if (user.role === "SUPPORT") {
      authBox.innerHTML = `<a href="support.html" class="btn btn-primary">شات الدعم 💬</a><button onclick="logout()" class="btn btn-outline">خروج 🚪</button>`;
    } else {
      authBox.innerHTML = `<a href="dashboard.html" class="btn btn-primary">لوحة الطالب 📊</a><button onclick="logout()" class="btn btn-outline">خروج 🚪</button>`;
    }
  } else {
    authBox.innerHTML = `<a href="login.html" class="btn btn-outline">تسجيل الدخول</a><a href="register.html" class="btn btn-primary">حساب جديد ✨</a>`;
  }
}

export function handleEnrollClick(courseId) {
  const user = getCurrentUser();
  if (!user) {
    alert("يرجى تسجيل الدخول أولاً لتتمكن من الاشتراك!");
    window.location.href = `login.html?redirect=checkout.html?course=${courseId}`;
  } else {
    window.location.href = `checkout.html?course=${courseId}`;
  }
}

export async function logoutUser() {
  try { await signOut(auth); } catch(e){}
  localStorage.removeItem("current_user");
  window.location.href = "login.html";
}

window.logout = logoutUser;
window.handleEnrollClick = handleEnrollClick;
document.addEventListener("DOMContentLoaded", updateNavbar);