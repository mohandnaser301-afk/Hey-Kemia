// تهيئة وربط Firebase بمشروع هي كيميا !
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadString, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwUdbxMJmGlQctBuZWgxFbJqdHwqYUzzs",
  authDomain: "hey-kemia-a8f6c.firebaseapp.com",
  projectId: "hey-kemia-a8f6c",
  storageBucket: "hey-kemia-a8f6c.firebasestorage.app",
  messagingSenderId: "206028495913",
  appId: "1:206028495913:web:b858b8ac1701ad5a62d038",
  measurementId: "G-CGPJHC9BD6"
};

// تهيئة الخدمات
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// واجهة التخاطب والعمليات السحابية (Cloud Operations Gateway)
export const FirebaseService = {
  // 1. إدارة الحسابات
  async registerStudent(userData) {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const uid = userCredential.user.uid;
    
    const userDoc = {
      uid: uid,
      fullName: userData.fullName,
      email: userData.email.toLowerCase(),
      studentPhone: userData.studentPhone,
      parentPhone: userData.parentPhone,
      governorate: userData.governorate,
      educationType: userData.educationType,
      schoolName: userData.schoolName,
      role: "STUDENT",
      enrolledCourses: ["c1"], // تفعيل التأسيسي
      customAllowedLessons: {},
      courseAccessCount: {},
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", uid), userDoc);
    localStorage.setItem("current_user", JSON.stringify(userDoc));
    return userDoc;
  },

  async loginUser(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const snap = await getDoc(doc(db, "users", uid));
    
    if (snap.exists()) {
      const userData = snap.data();
      localStorage.setItem("current_user", JSON.stringify(userData));
      return userData;
    } else {
      throw new Error("لم يتم العثور على بيانات المستخدم في السحابة");
    }
  },

  async logoutUser() {
    await signOut(auth);
    localStorage.removeItem("current_user");
    window.location.href = "login.html";
  },

  // 2. إدارة الكورسات
  async getCourses() {
    const snap = await getDocs(collection(db, "courses"));
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    if (list.length === 0) {
      // جلب من الكاش أو التهيئة إذا كانت السحابة فارغة
      return JSON.parse(localStorage.getItem("edu_courses")) || [];
    }
    localStorage.setItem("edu_courses", JSON.stringify(list));
    return list;
  },

  async saveCourse(courseData) {
    const docRef = await addDoc(collection(db, "courses"), courseData);
    return { id: docRef.id, ...courseData };
  },

  async updateCourse(courseId, courseData) {
    await updateDoc(doc(db, "courses", courseId), courseData);
  },

  async deleteCourse(courseId) {
    await deleteDoc(doc(db, "courses", courseId));
  },

  // 3. إدارة الامتحانات
  async getExams() {
    const snap = await getDocs(collection(db, "exams"));
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    return list;
  },

  async saveExam(examData) {
    const docRef = await addDoc(collection(db, "exams"), examData);
    return { id: docRef.id, ...examData };
  },

  async updateExam(examId, examData) {
    await updateDoc(doc(db, "exams", examId), examData);
  },

  async deleteExam(examId) {
    await deleteDoc(doc(db, "exams", examId));
  },

  // 4. المدفوعات والاشتراكات
  async submitPayment(paymentData) {
    let receiptUrl = paymentData.receipt;
    if (receiptUrl && receiptUrl.startsWith("data:image")) {
      const storageRef = ref(storage, `receipts/${Date.now()}_receipt.jpg`);
      await uploadString(storageRef, receiptUrl, "data_url");
      receiptUrl = await getDownloadURL(storageRef);
    }

    const newPayment = {
      ...paymentData,
      receipt: receiptUrl,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "payments"), newPayment);
    return { id: docRef.id, ...newPayment };
  },

  async approvePayment(paymentId, userEmail, courseId) {
    await updateDoc(doc(db, "payments", paymentId), { status: "APPROVED" });
    
    // البحث عن المستخدم وتفعيل الكورس له
    const q = query(collection(db, "users"), where("email", "==", userEmail));
    const snap = await getDocs(q);
    snap.forEach(async (uDoc) => {
      const enrolled = uDoc.data().enrolledCourses || [];
      if (!enrolled.includes(courseId)) {
        enrolled.push(courseId);
        await updateDoc(doc(db, "users", uDoc.id), { enrolledCourses: enrolled });
      }
    });
  },

  // 5. تسجيل الهاكرز والأمان السحابي
  async logHackerThreat(threatData) {
    await addDoc(collection(db, "hacker_logs"), {
      ...threatData,
      timestamp: new Date().toISOString()
    });
  }
};

// مراقبة حالة تسجيل الدخول التلقائية وتحديث الـ Cache
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      localStorage.setItem("current_user", JSON.stringify(snap.data()));
    }
  }
});

// إتاحة الكائن عالمياً لسهولة الاستخدام في ملفات js الأخرى
window.FirebaseService = FirebaseService;