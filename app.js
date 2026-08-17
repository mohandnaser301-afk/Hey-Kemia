import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy 
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

// تهيئة الكورسات والامتحانات الافتراضية في السحابة إذا كانت فارغة
export async function seedInitialCloudData() {
  try {
    const coursesSnap = await getDocs(collection(db, "courses"));
    if (coursesSnap.empty) {
      await addDoc(collection(db, "courses"), {
        title: "كورس الباب الأول: العناصر الانتقالية والتأسيس",
        desc: "توزيع الإلكترونات، حالات التأكسد، خواص وتفاعلات الحديد ومركباته بالتفصيل.",
        price: 220,
        maxViews: 5,
        tag: "الصف الثالث الثانوي",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
        lessons: [
          { id: 1, title: "المحاضرة 1: السلسلة الانتقالية الأولى", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "45 دقيقة" },
          { id: 2, title: "المحاضرة 2: تفاعلات أكاسيد الحديد", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "60 دقيقة" }
        ],
        createdAt: new Date().toISOString()
      });
    }

    const examsSnap = await getDocs(collection(db, "exams"));
    if (examsSnap.empty) {
      await addDoc(collection(db, "exams"), {
        title: "امتحان العناصر الانتقالية وتفاعلات الأكاسيد",
        courseId: "0",
        isGeneral: true,
        durationMinutes: 15,
        maxAttempts: 2,
        questions: [
          { q: "أي من الأيونات الآتية يعتبر دايامغناطيسي وغير ملون؟", options: ["Sc³⁺", "Fe²⁺", "Cu²⁺", "Cr³⁺"], correct: 0 },
          { q: "عند تسخين أوكسالات الحديد II بمعزل عن الهواء يتكون:", options: ["أكسيد الحديد III", "أكسيد الحديد II", "أكسيد الحديد المغناطيسي", "برادة الحديد"], correct: 1 }
        ],
        createdAt: new Date().toISOString()
      });
    }
  } catch (e) {
    console.error("Cloud seed check:", e);
  }
}
seedInitialCloudData();

// تسجيل العمليات بالسحابة
export async function logAction(actionType, details) {
  const user = getCurrentUser() || { fullName: "زائر", role: "GUEST" };
  try {
    await addDoc(collection(db, "activity_logs"), {
      actorName: user.fullName || "مستخدم",
      actorRole: user.role || "GUEST",
      actionType: actionType,
      details: details,
      timestamp: new Date().toLocaleString('ar-EG'),
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn("Log failed to cloud:", e);
  }
}

export function getCurrentUser() {
  const data = localStorage.getItem("current_user");
  return data ? JSON.parse(data) : null;
}

// تسجيل حساب طالب في السحابة
export async function registerStudent(userData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const uid = userCredential.user.uid;

    const payload = {
      fullName: userData.fullName,
      email: userData.email.toLowerCase(),
      studentPhone: userData.studentPhone,
      parentPhone: userData.parentPhone,
      governorate: userData.governorate,
      schoolName: userData.schoolName,
      educationType: userData.educationType,
      role: "STUDENT",
      enrolledCourses: [],
      courseAccessCount: {},
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", uid), payload);
    await logAction("إنشاء حساب طالب", `قام ${userData.fullName} بالتسجيل من محافظة ${userData.governorate}.`);

    alert("🎉 تم إنشاء الحساب بنجاح في قاعدة البيانات السحابية!");
    window.location.href = "login.html";
  } catch (error) {
    alert("❌ خطأ: " + error.message);
  }
}

// تسجيل الدخول مع جلب الرتبة من السحابة
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
    const uid = userCredential.user.uid;
    const userDoc = await getDoc(doc(db, "users", uid));

    let userData = null;
    if (userDoc.exists()) {
      userData = userDoc.data();
    } else {
      userData = {
        fullName: "مشرف النظام",
        email: email,
        role: "SUPER_ADMIN"
      };
      await setDoc(doc(db, "users", uid), userData);
    }

    const sessionUser = { uid, ...userData };
    localStorage.setItem("current_user", JSON.stringify(sessionUser));
    await logAction("تسجيل دخول", `قام ${sessionUser.fullName} (${sessionUser.role}) بتسجيل الدخول.`);

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
    alert("❌ البريد الإلكتروني أو كلمة المرور غير صحيحة!");
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