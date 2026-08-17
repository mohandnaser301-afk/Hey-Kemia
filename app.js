// --- استدعاء مكتبات Firebase السحابية الحقيقية (CDN) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// إعدادات Firebase الخاصة بمشروعك (Hey-Kemia)
const firebaseConfig = {
  apiKey: "AIzaSyCwH_1XfIPNBDR7uLxpPEQG0xjNydKMGsA",
  authDomain: "hey-kemia.firebaseapp.com",
  projectId: "hey-kemia",
  storageBucket: "hey-kemia.firebasestorage.app",
  messagingSenderId: "370186545560",
  appId: "1:370186545560:web:9b1a81d62e7eb65242a3ed",
  measurementId: "G-GWC88JE45F"
};

// تهيئة الاتصال السحابي
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- 1. تسجيل حساب طالب جديد في السحابة ---
export async function registerStudent(userData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const uid = userCredential.user.uid;

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

    alert("🎉 تم إنشاء الحساب بنجاح في قاعدة البيانات السحابية!");
    window.location.href = "login.html";
  } catch (error) {
    let msg = "حدث خطأ أثناء التسجيل: ";
    if (error.code === 'auth/email-already-in-use') msg = "البريد الإلكتروني مسجل بالفعل!";
    else if (error.code === 'auth/weak-password') msg = "كلمة المرور ضعيفة (يجب ألا تقل عن 6 أحرف)";
    else msg += error.message;
    alert("❌ " + msg);
  }
}

// --- 2. تسجيل الدخول الحقيقي والتحقق من الصلاحيات ---
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      localStorage.setItem("current_user", JSON.stringify({ uid, ...userData }));

      if (userData.role === "SUPER_ADMIN" || userData.role === "ADMIN") {
        window.location.href = "admin.html";
      } else if (userData.role === "SUPPORT") {
        window.location.href = "support.html";
      } else {
        window.location.href = "dashboard.html";
      }
    } else {
      // إذا كان حساب تم إنشاؤه مسبقاً في Auth دون مستند
      localStorage.setItem("current_user", JSON.stringify({ uid, email, role: "STUDENT", fullName: "طالب" }));
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    alert("❌ خطأ: البريد الإلكتروني أو كلمة المرور غير صحيحة!");
  }
}

// --- 3. جلب الكورسات الحقيقية من Firestore ---
export async function fetchLiveCourses() {
  try {
    const querySnapshot = await getDocs(collection(db, "courses"));
    const courses = [];
    querySnapshot.forEach((docSnap) => {
      courses.push({ id: docSnap.id, ...docSnap.data() });
    });
    return courses;
  } catch (e) {
    console.error("Error fetching courses: ", e);
    return [];
  }
}

// --- 4. إضافة كورس سحابي جديد ---
export async function addCloudCourse(courseData) {
  try {
    await addDoc(collection(db, "courses"), {
      ...courseData,
      createdAt: new Date().toISOString()
    });
    alert("🚀 تم نشر الكورس وحفظه في السيرفر السحابي بنجاح!");
  } catch (error) {
    alert("❌ خطأ في إضافة الكورس: " + error.message);
  }
}

// --- 5. تسجيل الخروج ---
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (e) {}
  localStorage.removeItem("current_user");
  window.location.href = "login.html";
}

window.logout = logoutUser;