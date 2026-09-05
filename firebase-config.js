// =========================================================
// إعدادات وتهيئة Firebase لمنصة هي كيميا !
// =========================================================

const firebaseConfig = {
  apiKey: "AIzaSyDwUdbxMJmGlQctBuZWgxFbJqdHwqYUzzs",
  authDomain: "hey-kemia-a8f6c.firebaseapp.com",
  projectId: "hey-kemia-a8f6c",
  storageBucket: "hey-kemia-a8f6c.firebasestorage.app",
  messagingSenderId: "206028495913",
  appId: "1:206028495913:web:b858b8ac1701ad5a62d038",
  measurementId: "G-CGPJHC9BD6"
};

// ضمان تهيئة Firebase فوراً دون انتظار
function initFirebaseAppSafe() {
  if (typeof firebase !== "undefined") {
    if (!firebase.apps || !firebase.apps.length) {
      try {
        firebase.initializeApp(firebaseConfig);
      } catch (e) {}
    }
    return firebase;
  }
  return null;
}

// تهيئة أولية
initFirebaseAppSafe();

function getFirebase() {
  return initFirebaseAppSafe();
}

function formatYouTubeEmbedUrl(url) {
  if (!url) return "";
  url = url.trim();
  if (url.includes("embed/")) return url;

  let videoId = "";
  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0].split("&")[0];
  } else if (url.includes("youtube.com/watch")) {
    const urlParams = new URLSearchParams(url.split("?")[1] || "");
    videoId = urlParams.get("v") || "";
  } else if (url.includes("youtube.com/shorts/")) {
    videoId = url.split("youtube.com/shorts/")[1].split("?")[0].split("&")[0];
  }

  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1` : url;
}
window.formatYouTubeEmbedUrl = formatYouTubeEmbedUrl;

function compressImageBase64(base64Str, maxWidth, maxHeight, quality) {
  maxWidth = maxWidth || 450;
  maxHeight = maxHeight || 260;
  quality = quality || 0.45;

  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith("data:image")) {
      return resolve(base64Str);
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(base64Str);
  });
}
window.compressImageBase64 = compressImageBase64;

window.FirebaseService = {
  // 1. تسجيل حساب جديد
  async registerStudent(userData) {
    const fb = getFirebase();
    const cleanEmail = userData.email.toLowerCase().trim();
    const cleanPhone = (userData.studentPhone || "").trim();

    if (fb && fb.firestore) {
      try {
        const emailCheck = await fb.firestore().collection("users").where("email", "==", cleanEmail).get();
        if (!emailCheck.empty) {
          throw new Error("هذا البريد الإلكتروني مسجل بالفعل بحساب آخر.");
        }
      } catch (errCheck) {
        if (errCheck.message.includes("مسجل بالفعل")) throw errCheck;
      }
    }

    let uid = "u_" + Date.now();

    if (fb && fb.auth) {
      try {
        const userCredential = await fb.auth().createUserWithEmailAndPassword(cleanEmail, userData.password);
        uid = userCredential.user.uid;
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          throw new Error("هذا البريد الإلكتروني مسجل بالفعل بحساب آخر.");
        }
        throw authErr;
      }
    }

    const userDoc = {
      uid: uid,
      fullName: userData.fullName,
      email: cleanEmail,
      studentPhone: cleanPhone,
      parentPhone: userData.parentPhone || "غير مسجل",
      governorate: userData.governorate || "غير محدد",
      educationType: userData.educationType || "GENERAL",
      schoolName: userData.schoolName || "غير محدد",
      role: "STUDENT",
      enrolledCourses: ["c1"],
      customAllowedLessons: {},
      courseAccessCount: {},
      emailVerified: true,
      devices: [],
      createdAt: new Date().toISOString()
    };

    if (fb && fb.firestore) {
      await fb.firestore().collection("users").doc(uid).set(userDoc);
    }

    localStorage.setItem("current_user", JSON.stringify(userDoc));
    localStorage.setItem("edu_currentUser", JSON.stringify(userDoc));
    return userDoc;
  },

  // 2. تسجيل الدخول المباشر ودعم تعدد الأجهزة
  async loginUser(email, password) {
    const fb = getFirebase();
    let foundUser = null;
    const cleanEmail = email.toLowerCase().trim();

    if (fb && fb.auth) {
      try {
        const userCredential = await fb.auth().signInWithEmailAndPassword(cleanEmail, password);
        const fbUser = userCredential.user;
        const uid = fbUser.uid;

        if (fb.firestore) {
          try {
            const snap = await fb.firestore().collection("users").doc(uid).get();
            if (snap.exists) {
              foundUser = snap.data();
              foundUser.uid = uid;
            }
          } catch (e) {}
        }

        if (!foundUser) {
          foundUser = {
            uid: uid,
            email: cleanEmail,
            fullName: fbUser.displayName || "طالب",
            role: "STUDENT",
            enrolledCourses: ["c1"],
            devices: []
          };
        }
      } catch (e) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }
        throw e;
      }
    }

    if (!foundUser && fb && fb.firestore) {
      try {
        const qSnap = await fb.firestore().collection("users").where("email", "==", cleanEmail).get();
        if (!qSnap.empty) {
          foundUser = qSnap.docs[0].data();
          foundUser.uid = qSnap.docs[0].id;
        }
      } catch (e) {}
    }

    if (foundUser) {
      // إسناد القيم الأساسية لضمان عدم حدوث تعارض
      foundUser.role = foundUser.role || "STUDENT";
      foundUser.enrolledCourses = (foundUser.enrolledCourses || []).map(String);
      foundUser.devices = Array.isArray(foundUser.devices) ? foundUser.devices : [];

      localStorage.setItem("current_user", JSON.stringify(foundUser));
      localStorage.setItem("edu_currentUser", JSON.stringify(foundUser));

      if (typeof registerCurrentDeviceSession === "function") {
        registerCurrentDeviceSession();
      }

      return foundUser;
    } else {
      throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
  },

  // 3. استعادة كلمة المرور
  async resetPassword(email) {
    const fb = getFirebase();
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail) {
      throw new Error("يرجى إدخال البريد الإلكتروني أولاً.");
    }

    if (fb && fb.auth) {
      try {
        await fb.auth().sendPasswordResetEmail(cleanEmail);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          throw new Error("لا يوجد حساب مسجل بهذا البريد الإلكتروني.");
        } else if (err.code === 'auth/invalid-email') {
          throw new Error("صيغة البريد الإلكتروني غير صحيحة.");
        }
        throw err;
      }
    } else {
      throw new Error("تعذر الاتصال بخدمة التحقق، يرجى المحاولة لاحقاً.");
    }
  },

  async resendVerificationEmail(email, password) {
    const fb = getFirebase();
    if (fb && fb.auth) {
      const userCredential = await fb.auth().signInWithEmailAndPassword(email.toLowerCase().trim(), password);
      await userCredential.user.sendEmailVerification();
    }
  },

  async logoutUser() {
    const fb = getFirebase();
    if (fb && fb.auth) {
      try { await fb.auth().signOut(); } catch (e) {}
    }
    localStorage.removeItem("current_user");
    localStorage.removeItem("edu_currentUser");
    window.location.replace("login.html");
  },

  // 4. إدارة المستخدمين والمزامنة الحية
  subscribeUsers(callback) {
    const local = JSON.parse(localStorage.getItem("edu_users") || "[]");
    if (callback) callback(local);

    const check = setInterval(() => {
      const fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("users").onSnapshot(snap => {
          const list = [];
          snap.forEach(doc => list.push({ uid: doc.id, ...doc.data() }));
          localStorage.setItem("edu_users", JSON.stringify(list));
          if (callback) callback(list);
        }, () => {});
      }
    }, 150);
  },

  async updateUserRoleByUid(uid, newRole) {
    const fb = getFirebase();
    if (fb && fb.firestore && uid) {
      await fb.firestore().collection("users").doc(uid).update({ role: newRole });
    }
  },

  async updateUserEnrollmentsByUid(uid, enrolledCourses, customLessons) {
    const fb = getFirebase();
    if (fb && fb.firestore && uid) {
      const normalizedCourses = (enrolledCourses || []).map(String);
      const updateData = { enrolledCourses: normalizedCourses };
      if (customLessons) updateData.customAllowedLessons = customLessons;
      await fb.firestore().collection("users").doc(uid).update(updateData);
    }
  },

  async deleteUserCascadeByUid(uid) {
    const fb = getFirebase();
    if (fb && fb.firestore && uid) {
      const batch = fb.firestore().batch();
      batch.delete(fb.firestore().collection("users").doc(uid));

      try {
        const paySnap = await fb.firestore().collection("payments").where("userUid", "==", uid).get();
        paySnap.forEach(doc => batch.delete(doc.ref));

        const subSnap = await fb.firestore().collection("submissions").where("userUid", "==", uid).get();
        subSnap.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
      } catch (e) {}
    }
  },

  // 5. الكورسات والمناهج
  subscribeCourses(callback) {
    const local = JSON.parse(localStorage.getItem("edu_courses") || "[]");
    if (callback) callback(local);

    const check = setInterval(() => {
      const fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("courses").onSnapshot(snap => {
          const list = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          localStorage.setItem("edu_courses", JSON.stringify(list));
          if (callback) callback(list);
        }, () => {});
      }
    }, 150);
  },

  async saveCourse(courseData, courseId) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      if (courseData.image && courseData.image.startsWith("data:image")) {
        courseData.image = await compressImageBase64(courseData.image, 450, 260, 0.45);
      }
      if (courseData.lessons && Array.isArray(courseData.lessons)) {
        courseData.lessons = courseData.lessons.map(l => ({
          ...l,
          videoUrl: formatYouTubeEmbedUrl(l.videoUrl)
        }));
      }
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

  // 6. الامتحانات والتسليمات
  subscribeExams(callback) {
    const local = JSON.parse(localStorage.getItem("edu_exams") || "[]");
    if (callback) callback(local);

    const check = setInterval(() => {
      const fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("exams").onSnapshot(snap => {
          const list = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          localStorage.setItem("edu_exams", JSON.stringify(list));
          if (callback) callback(list);
        }, () => {});
      }
    }, 150);
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

  subscribeSubmissions(callback) {
    const local = JSON.parse(localStorage.getItem("edu_submissions") || "[]");
    if (callback) callback(local);

    const check = setInterval(() => {
      const fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("submissions").orderBy("createdAt", "desc").onSnapshot(snap => {
          const list = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          localStorage.setItem("edu_submissions", JSON.stringify(list));
          if (callback) callback(list);
        }, () => {});
      }
    }, 150);
  },

  async saveSubmission(submissionData) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      submissionData.createdAt = new Date().toISOString();
      await fb.firestore().collection("submissions").add(submissionData);
    }
  },

  // 7. المدفوعات والاشتراكات
  subscribePayments(callback) {
    const local = JSON.parse(localStorage.getItem("edu_payments") || "[]");
    if (callback) callback(local);

    const check = setInterval(() => {
      const fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("payments").orderBy("createdAt", "desc").onSnapshot(snap => {
          const list = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          localStorage.setItem("edu_payments", JSON.stringify(list));
          if (callback) callback(list);
        }, () => {});
      }
    }, 150);
  },

  async submitPayment(paymentData) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      if (paymentData.receipt && paymentData.receipt.startsWith("data:image")) {
        paymentData.receipt = await compressImageBase64(paymentData.receipt, 400, 400, 0.4);
      }
      paymentData.createdAt = new Date().toISOString();
      paymentData.status = "PENDING";
      paymentData.courseId = String(paymentData.courseId);
      const ref = await fb.firestore().collection("payments").add(paymentData);
      return ref.id;
    }
  },

  async approvePaymentAndEnroll(paymentId, userUid, courseId, userEmail) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      const stringCourseId = String(courseId);
      let targetUid = userUid;

      if (!targetUid && userEmail) {
        const cleanEmail = userEmail.toLowerCase().trim();
        const qSnap = await fb.firestore().collection("users").where("email", "==", cleanEmail).get();
        if (!qSnap.empty) {
          targetUid = qSnap.docs[0].id;
        }
      }

      if (!targetUid) {
        throw new Error("لم يتم العثور على حساب الطالب المرتبط بعملية الدفع.");
      }

      const batch = fb.firestore().batch();
      const payRef = fb.firestore().collection("payments").doc(paymentId);
      batch.update(payRef, { status: "APPROVED", userUid: targetUid });

      const userRef = fb.firestore().collection("users").doc(targetUid);
      batch.update(userRef, {
        enrolledCourses: firebase.firestore.FieldValue.arrayUnion(stringCourseId)
      });

      await batch.commit();

      const currentUser = JSON.parse(localStorage.getItem("current_user"));
      if (currentUser && currentUser.uid === targetUid) {
        if (!currentUser.enrolledCourses) currentUser.enrolledCourses = [];
        if (!currentUser.enrolledCourses.map(String).includes(stringCourseId)) {
          currentUser.enrolledCourses.push(stringCourseId);
          localStorage.setItem("current_user", JSON.stringify(currentUser));
        }
      }
    }
  },

  async rejectPayment(paymentId) {
    const fb = getFirebase();
    if (fb && fb.firestore && paymentId) {
      await fb.firestore().collection("payments").doc(paymentId).update({ status: "REJECTED" });
    }
  },

  // 8. الإشعارات السحابية
  subscribeNotifications(callback) {
    const check = setInterval(() => {
      const fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("notifications").orderBy("createdAt", "desc").limit(25).onSnapshot(snap => {
          const list = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          if (callback) callback(list);
        }, () => {});
      }
    }, 150);
  },

  async pushNotificationToCloud(title, body, targetUid, targetUrl, senderEmail) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      await fb.firestore().collection("notifications").add({
        title: title,
        body: body,
        targetUid: targetUid || "ALL",
        targetUrl: targetUrl || "dashboard.html",
        senderEmail: (senderEmail || "").toLowerCase().trim(),
        createdAt: new Date().toISOString()
      });
    }
  },

  // 9. الدعم الفني والشات
  subscribeStudentChat(studentUid, callback) {
    const local = JSON.parse(localStorage.getItem("edu_chat_" + studentUid) || "[]");
    if (callback) callback(local);

    const check = setInterval(() => {
      const fb = getFirebase();
      if (fb && fb.firestore && studentUid) {
        clearInterval(check);
        fb.firestore().collection("support_threads").doc(studentUid).collection("messages")
          .orderBy("createdAt", "asc")
          .onSnapshot(snap => {
            const list = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            localStorage.setItem("edu_chat_" + studentUid, JSON.stringify(list));
            if (callback) callback(list);
          }, () => {});
      }
    }, 150);
  },

  subscribeAllSupportThreads(callback) {
    const check = setInterval(() => {
      const fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("support_threads")
          .orderBy("lastMessageTime", "desc")
          .onSnapshot(snap => {
            const list = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            if (callback) callback(list);
          }, () => {});
      }
    }, 150);
  },

  async sendSupportMessage(msgData) {
    const fb = getFirebase();
    const studentUid = String(msgData.studentUid);
    const now = new Date().toISOString();

    const localKey = "edu_chat_" + studentUid;
    const localMsgs = JSON.parse(localStorage.getItem(localKey) || "[]");
    localMsgs.push(msgData);
    localStorage.setItem(localKey, JSON.stringify(localMsgs));

    if (fb && fb.firestore) {
      const messageDoc = {
        text: msgData.text,
        senderUid: msgData.senderUid,
        senderName: msgData.senderName,
        senderRole: msgData.senderRole || "STUDENT",
        createdAt: now
      };

      await fb.firestore().collection("support_threads").doc(studentUid).collection("messages").add(messageDoc);

      const threadUpdate = {
        studentUid: studentUid,
        studentName: msgData.studentName || "طالب",
        studentPhone: msgData.studentPhone || "",
        studentEmail: msgData.studentEmail || "",
        lastMessage: msgData.text,
        lastMessageTime: now,
        lastSenderRole: msgData.senderRole || "STUDENT"
      };

      if (msgData.senderRole === "STUDENT") {
        threadUpdate.unreadCount = firebase.firestore.FieldValue.increment(1);
      } else {
        threadUpdate.unreadCount = 0;
      }

      await fb.firestore().collection("support_threads").doc(studentUid).set(threadUpdate, { merge: true });
    }
  }
};