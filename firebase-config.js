// =========================================================
// محرك ربط Firebase السحابي لمنصة هي كيميا !
// مزامنة لحظية بين جميع الأجهزة
// =========================================================

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
  // 1. تسجيل طالب جديد
  async registerStudent(userData) {
    const fb = getFirebase();
    let uid = "u_" + Date.now();

    if (fb && fb.auth) {
      try {
        const userCredential = await fb.auth().createUserWithEmailAndPassword(userData.email, userData.password);
        uid = userCredential.user.uid;
      } catch (authErr) {
        console.warn("Auth alert:", authErr.message);
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
      enrolledCourses: ["c1"],
      customAllowedLessons: {},
      courseAccessCount: {},
      createdAt: new Date().toISOString()
    };

    if (fb && fb.firestore) {
      await fb.firestore().collection("users").doc(uid).set(userDoc);
    }

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
        console.warn("Local fallback search:", e.message);
      }
    }

    if (!foundUser && fb && fb.firestore) {
      const qSnap = await fb.firestore().collection("users").where("email", "==", email.toLowerCase()).get();
      if (!qSnap.empty) {
        foundUser = qSnap.docs[0].data();
      }
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
  },

  // 4. الاستماع اللحظي للكورسات لجميع الأجهزة
  subscribeCourses(callback) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      return fb.firestore().collection("courses").onSnapshot(snap => {
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        localStorage.setItem("edu_courses", JSON.stringify(list));
        if (callback) callback(list);
      });
    }
  },

  async saveCourse(courseData, courseId) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      if (courseId) {
        await fb.firestore().collection("courses").doc(courseId).set(courseData, { merge: true });
        return { id: courseId, ...courseData };
      } else {
        const ref = await fb.firestore().collection("courses").add(courseData);
        return { id: ref.id, ...courseData };
      }
    }
  },

  async deleteCourse(courseId) {
    const fb = getFirebase();
    if (fb && fb.firestore && courseId) {
      await fb.firestore().collection("courses").doc(courseId).delete();
    }
  },

  // 5. الاستماع اللحظي للامتحانات
  subscribeExams(callback) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      return fb.firestore().collection("exams").onSnapshot(snap => {
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        localStorage.setItem("edu_exams", JSON.stringify(list));
        if (callback) callback(list);
      });
    }
  },

  async saveExam(examData, examId) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      if (examId) {
        await fb.firestore().collection("exams").doc(examId).set(examData, { merge: true });
      } else {
        const ref = await fb.firestore().collection("exams").add(examData);
        examData.id = ref.id;
      }
    }
  },

  async deleteExam(examId) {
    const fb = getFirebase();
    if (fb && fb.firestore && examId) {
      await fb.firestore().collection("exams").doc(examId).delete();
    }
  },

  // 6. الاستماع اللحظي للمستخدمين والطلاب
  subscribeUsers(callback) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      return fb.firestore().collection("users").onSnapshot(snap => {
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        localStorage.setItem("edu_users", JSON.stringify(list));
        if (callback) callback(list);
      });
    }
  },

  async updateUserRole(uid, newRole) {
    const fb = getFirebase();
    if (fb && fb.firestore && uid) {
      await fb.firestore().collection("users").doc(uid).update({ role: newRole });
    }
  },

  async updateUserPermissions(uid, enrolledCourses, customLessons) {
    const fb = getFirebase();
    if (fb && fb.firestore && uid) {
      await fb.firestore().collection("users").doc(uid).update({
        enrolledCourses: enrolledCourses,
        customAllowedLessons: customLessons || {}
      });
    }
  },

  async deleteUser(uid) {
    const fb = getFirebase();
    if (fb && fb.firestore && uid) {
      await fb.firestore().collection("users").doc(uid).delete();
    }
  }
};