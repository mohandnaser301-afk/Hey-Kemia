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
  // 1. التسجيل والتحقق من البريد
  async registerStudent(userData) {
    const fb = getFirebase();
    let uid = "u_" + Date.now();
    const cleanEmail = userData.email.toLowerCase().trim();

    if (fb && fb.auth) {
      try {
        const userCredential = await fb.auth().createUserWithEmailAndPassword(cleanEmail, userData.password);
        uid = userCredential.user.uid;
        await userCredential.user.sendEmailVerification();
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
      studentPhone: userData.studentPhone,
      parentPhone: userData.parentPhone || "غير مسجل",
      governorate: userData.governorate,
      educationType: userData.educationType || "GENERAL",
      schoolName: userData.schoolName || "غير محدد",
      role: "STUDENT",
      enrolledCourses: ["c1"],
      customAllowedLessons: {},
      courseAccessCount: {},
      emailVerified: false,
      createdAt: new Date().toISOString()
    };

    if (fb && fb.firestore) {
      await fb.firestore().collection("users").doc(uid).set(userDoc);
    }

    return userDoc;
  },

  async loginUser(email, password) {
    const fb = getFirebase();
    let foundUser = null;
    const cleanEmail = email.toLowerCase().trim();

    if (fb && fb.auth) {
      try {
        const userCredential = await fb.auth().signInWithEmailAndPassword(cleanEmail, password);
        const fbUser = userCredential.user;
        const uid = fbUser.uid;
        const snap = await fb.firestore().collection("users").doc(uid).get();
        if (snap.exists) {
          foundUser = snap.data();
          foundUser.uid = uid;
        }

        if (foundUser && foundUser.role === "STUDENT") {
          if (!fbUser.emailVerified) {
            localStorage.setItem("unverified_email", cleanEmail);
            throw new Error("EMAIL_NOT_VERIFIED");
          } else if (!foundUser.emailVerified) {
            await fb.firestore().collection("users").doc(uid).update({ emailVerified: true });
            foundUser.emailVerified = true;
          }
        }
      } catch (e) {
        if (e.message === "EMAIL_NOT_VERIFIED") throw e;
        if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }
        throw e;
      }
    }

    if (!foundUser && fb && fb.firestore) {
      const qSnap = await fb.firestore().collection("users").where("email", "==", cleanEmail).get();
      if (!qSnap.empty) {
        foundUser = qSnap.docs[0].data();
        foundUser.uid = qSnap.docs[0].id;
      }
    }

    if (foundUser) {
      localStorage.setItem("current_user", JSON.stringify(foundUser));
      return foundUser;
    } else {
      throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
  },

  async resendVerificationEmail(email, password) {
    const fb = getFirebase();
    if (fb && fb.auth) {
      const userCredential = await fb.auth().signInWithEmailAndPassword(email.toLowerCase().trim(), password);
      await userCredential.user.sendEmailVerification();
      await fb.auth().signOut();
    }
  },

  async logoutUser() {
    const fb = getFirebase();
    if (fb && fb.auth) {
      try { await fb.auth().signOut(); } catch (e) {}
    }
    localStorage.removeItem("current_user");
    window.location.href = "login.html";
  },

  // 2. إدارة المستخدمين والمزامنة
  subscribeUsers(callback) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      return fb.firestore().collection("users").onSnapshot(snap => {
        const list = [];
        snap.forEach(doc => list.push({ uid: doc.id, ...doc.data() }));
        localStorage.setItem("edu_users", JSON.stringify(list));
        if (callback) callback(list);
      });
    }
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

      const userRef = fb.firestore().collection("users").doc(uid);
      batch.delete(userRef);

      const paySnap = await fb.firestore().collection("payments").where("userUid", "==", uid).get();
      paySnap.forEach(doc => batch.delete(doc.ref));

      const subSnap = await fb.firestore().collection("submissions").where("userUid", "==", uid).get();
      subSnap.forEach(doc => batch.delete(doc.ref));

      await batch.commit();

      try {
        await fb.firestore().collection("support_threads").doc(uid).delete();
      } catch (e) {}
    }
  },

  // 3. الكورسات
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

  // 4. الامتحانات والتسليمات
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

  subscribeSubmissions(callback) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      return fb.firestore().collection("submissions").orderBy("createdAt", "desc").onSnapshot(snap => {
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        localStorage.setItem("edu_submissions", JSON.stringify(list));
        if (callback) callback(list);
      });
    }
  },

  async saveSubmission(submissionData) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      submissionData.createdAt = new Date().toISOString();
      await fb.firestore().collection("submissions").add(submissionData);
    }
  },

  // 5. المدفوعات
  subscribePayments(callback) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      return fb.firestore().collection("payments").orderBy("createdAt", "desc").onSnapshot(snap => {
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        localStorage.setItem("edu_payments", JSON.stringify(list));
        if (callback) callback(list);
      });
    }
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

  // 6. الإشعارات السحابية
  subscribeNotifications(callback) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      return fb.firestore().collection("notifications").orderBy("createdAt", "desc").limit(25).onSnapshot(snap => {
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        if (callback) callback(list);
      });
    }
  },

  async pushNotificationToCloud(title, body, targetUid, targetUrl, senderEmail) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      await fb.firestore().collection("notifications").add({
        title: title,
        body: body,
        targetUid: targetUid || "ALL",
        targetUrl: targetUrl || "support.html",
        senderEmail: (senderEmail || "").toLowerCase().trim(),
        createdAt: new Date().toISOString()
      });
    }
  },

  // 7. الدعم الفني والشات الموحد مع إرسال إشعارات التنبيه
  subscribeStudentChat(studentUid, callback) {
    const fb = getFirebase();
    const key = String(studentUid);

    if (fb && fb.firestore && studentUid) {
      return fb.firestore().collection("support_threads").doc(key)
        .onSnapshot(doc => {
          if (doc.exists) {
            const data = doc.data() || {};
            const list = data.messages || [];
            localStorage.setItem("edu_chat_" + key, JSON.stringify(list));
            if (callback) callback(list);
          } else {
            if (callback) callback([]);
          }
        }, err => {
          console.error("Student Chat Error:", err);
          const local = JSON.parse(localStorage.getItem("edu_chat_" + key) || "[]");
          if (callback) callback(local);
        });
    } else {
      const local = JSON.parse(localStorage.getItem("edu_chat_" + key) || "[]");
      if (callback) callback(local);
      return () => {};
    }
  },

  subscribeAllSupportThreads(callback) {
    const fb = getFirebase();
    if (fb && fb.firestore) {
      return fb.firestore().collection("support_threads")
        .onSnapshot(snap => {
          const list = [];
          snap.forEach(doc => {
            const d = doc.data();
            if (d && d.studentUid) {
              list.push({ id: doc.id, ...d });
            }
          });
          list.sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
          if (callback) callback(list);
        }, err => {
          console.error("All Threads Error:", err);
        });
    }
  },

  async sendSupportMessage(msgData) {
    const fb = getFirebase();
    const targetUid = String(msgData.studentUid);
    const now = new Date().toISOString();

    const localKey = "edu_chat_" + targetUid;
    const localMsgs = JSON.parse(localStorage.getItem(localKey) || "[]");
    localMsgs.push(msgData);
    localStorage.setItem(localKey, JSON.stringify(localMsgs));

    if (fb && fb.firestore) {
      await fb.firestore().collection("support_threads").doc(targetUid).set({
        studentUid: targetUid,
        studentName: msgData.studentName || "طالب",
        studentPhone: msgData.studentPhone || "",
        studentEmail: msgData.studentEmail || "",
        lastMessage: msgData.text,
        lastMessageTime: now,
        lastSenderRole: msgData.senderRole || "STUDENT",
        unreadCount: (msgData.senderRole === "STUDENT") ? firebase.firestore.FieldValue.increment(1) : 0,
        messages: firebase.firestore.FieldValue.arrayUnion(msgData)
      }, { merge: true });

      // دفع إشعار تلقائي للطرف المستلم (إذا كان الدعم يرد على الطالب أو العكس)
      const isStaff = msgData.senderRole === "SUPER_ADMIN" || msgData.senderRole === "ADMIN" || msgData.senderRole === "SUPPORT";
      const notifTargetUid = isStaff ? targetUid : "ALL";
      const notifTitle = isStaff ? "رد جديد من الدعم الأكاديمي 🧪" : "استفسار جديد من: " + (msgData.studentName || "طالب");

      this.pushNotificationToCloud(notifTitle, msgData.text, notifTargetUid, "support.html", msgData.studentEmail);
    }
  },

  async deleteSupportThread(studentUid, studentName) {
    const fb = getFirebase();
    const targetKey = String(studentUid);

    localStorage.removeItem("edu_chat_" + targetKey);

    if (fb && fb.firestore) {
      await fb.firestore().collection("support_threads").doc(targetKey).set({
        studentUid: targetKey,
        studentName: studentName || "طالب",
        messages: [],
        lastMessage: "",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      }, { merge: true });
    }
  }
};