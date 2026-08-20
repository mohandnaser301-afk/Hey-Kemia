// =========================================================
// محرك ربط Firebase السحابي لمنصة هي كيميا !
// متوافق بنسبة 100% مع المتصفح والعمل المباشر
// =========================================================

// تحميل سكريبتات Firebase الأساسية تلقائياً إذا لم تكن موجودة
(function loadFirebaseSDKs() {
  const scripts = [
    "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js",
    "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js"
  ];

  scripts.forEach(src => {
    if (!document.querySelector(`script[src="${src}"]`)) {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      document.head.appendChild(s);
    }
  });
})();

const firebaseConfig = {
  apiKey: "AIzaSyDwUdbxMJmGlQctBuZWgxFbJqdHwqYUzzs",
  authDomain: "hey-kemia-a8f6c.firebaseapp.com",
  projectId: "hey-kemia-a8f6c",
  storageBucket: "hey-kemia-a8f6c.firebasestorage.app",
  messagingSenderId: "206028495913",
  appId: "1:206028495913:web:b858b8ac1701ad5a62d038",
  measurementId: "G-CGPJHC9BD6"
};

function getFirebase() {
  if (typeof firebase === "undefined") return null;
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return firebase;
}

window.FirebaseService = {
  // 1. تسجيل طالب جديد في Auth و Firestore و LocalStorage معاً
  async registerStudent(userData) {
    const fb = getFirebase();
    let uid = "u_" + Date.now();

    if (fb && fb.auth) {
      try {
        const userCredential = await fb.auth().createUserWithEmailAndPassword(userData.email, userData.password);
        uid = userCredential.user.uid;
      } catch (authErr) {
        console.warn("تنبيه أمني في Auth، جاري المتابعة السحابية والمحلية:", authErr.message);
      }
    }

    const userDoc = {
      uid: uid,
      fullName: userData.fullName,
      email: userData.email.toLowerCase(),
      studentPhone: userData.studentPhone,
      parentPhone: userData.parentPhone || "غير مسجل",
      governorate: userData.governorate,
      educationType: userData.educationType || "GENERAL",
      schoolName: userData.schoolName || "غير محدد",
      role: "STUDENT",
      enrolledCourses: ["c1"], // تفعيل الكورس التأسيسي تلقائياً
      customAllowedLessons: {},
      courseAccessCount: {},
      createdAt: new Date().toISOString()
    };

    // حفظ في Firestore
    if (fb && fb.firestore) {
      try {
        await fb.firestore().collection("users").doc(uid).set(userDoc);
      } catch (dbErr) {
        console.warn("تعذر الكتابة في Firestore مباشرة:", dbErr.message);
      }
    }

    // حفظ فوري في LocalStorage لضمان تشغيل الموقع في كل الظروف
    const users = JSON.parse(localStorage.getItem("edu_users")) || [];
    users.push(userDoc);
    localStorage.setItem("edu_users", JSON.stringify(users));
    localStorage.setItem("current_user", JSON.stringify(userDoc));

    return userDoc;
  },

  // 2. تسجيل الدخول
  async loginUser(email, password) {
    const fb = getFirebase();
    let foundUser = null;

    if (fb && fb.auth) {
      try {
        const userCredential = await fb.auth().signInWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        const snap = await fb.firestore().collection("users").doc(uid).get();
        if (snap.exists) {
          foundUser = snap.data();
        }
      } catch (e) {
        console.warn("فحص محلي بعد السحابة:", e.message);
      }
    }

    // فحص المحرك المحلي
    if (!foundUser) {
      const users = JSON.parse(localStorage.getItem("edu_users")) || [];
      foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (u.password === password || !u.password));
    }

    if (foundUser) {
      localStorage.setItem("current_user", JSON.stringify(foundUser));
      return foundUser;
    } else {
      throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
  },

  // 3. تسجيل الخروج
  async logoutUser() {
    const fb = getFirebase();
    if (fb && fb.auth) {
      try { await fb.auth().signOut(); } catch (e) {}
    }
    localStorage.removeItem("current_user");
    window.location.href = "login.html";
  }
};