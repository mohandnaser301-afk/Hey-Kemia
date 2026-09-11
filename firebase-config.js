// =========================================================
// إعدادات وتهيئة Firebase لمنصة هي كيميا !
// =========================================================

var firebaseConfig = {
  apiKey: "AIzaSyDwUdbxMJmGlQctBuZWgxFbJqdHwqYUzzs",
  authDomain: "hey-kemia-a8f6c.firebaseapp.com",
  projectId: "hey-kemia-a8f6c",
  storageBucket: "hey-kemia-a8f6c.firebasestorage.app",
  messagingSenderId: "206028495913",
  appId: "1:206028495913:web:b858b8ac1701ad5a62d038",
  measurementId: "G-CGPJHC9BD6"
};

function getFirebase() {
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

getFirebase();

function formatYouTubeEmbedUrl(url) {
  if (!url) return "";
  var cleanUrl = String(url).trim();
  if (cleanUrl.indexOf("youtube-nocookie.com/embed/") !== -1) return cleanUrl;

  var videoId = "";
  if (cleanUrl.indexOf("youtu.be/") !== -1) {
    videoId = cleanUrl.split("youtu.be/")[1].split("?")[0].split("&")[0];
  } else if (cleanUrl.indexOf("youtube.com/watch") !== -1) {
    var urlParams = new URLSearchParams(cleanUrl.split("?")[1] || "");
    videoId = urlParams.get("v") || "";
  } else if (cleanUrl.indexOf("youtube.com/shorts/") !== -1) {
    videoId = cleanUrl.split("youtube.com/shorts/")[1].split("?")[0].split("&")[0];
  } else if (cleanUrl.indexOf("youtube.com/embed/") !== -1) {
    videoId = cleanUrl.split("youtube.com/embed/")[1].split("?")[0].split("&")[0];
  }

  return videoId 
    ? "https://www.youtube-nocookie.com/embed/" + videoId + "?rel=0&modestbranding=1&enablejsapi=1" 
    : cleanUrl;
}
window.formatYouTubeEmbedUrl = formatYouTubeEmbedUrl;

function compressImageBase64(base64Str, maxWidth, maxHeight, quality) {
  maxWidth = maxWidth || 450;
  maxHeight = maxHeight || 260;
  quality = quality || 0.45;

  return new Promise(function(resolve) {
    if (!base64Str || !base64Str.startsWith("data:image")) {
      return resolve(base64Str);
    }
    var img = new Image();
    img.src = base64Str;
    img.onload = function() {
      var width = img.width;
      var height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = function() { resolve(base64Str); };
  });
}
window.compressImageBase64 = compressImageBase64;

// منع كتابة الأحرف الإنجليزية والأرقام والرموز في خانة الاسم لحظياً
document.addEventListener("input", function(e) {
  if (e.target && (e.target.id === "fullName" || e.target.name === "fullName" || (e.target.placeholder && e.target.placeholder.indexOf("الاسم") !== -1))) {
    var cleanVal = e.target.value.replace(/[^\u0621-\u064A\s]/g, "");
    if (e.target.value !== cleanVal) {
      e.target.value = cleanVal;
    }
  }
});

// واجهة تأكيد البريد الإلكتروني الأنيقة
function showVerificationPrompt(email, fbUser, pendingDoc) {
  try {
    var oldModal = document.getElementById("hkEmailVerificationModal");
    if (oldModal) oldModal.remove();

    var modal = document.createElement("div");
    modal.id = "hkEmailVerificationModal";
    modal.style.cssText = "position:fixed; inset:0; background:rgba(8,10,33,0.88); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; z-index:99999999; padding:20px; font-family:system-ui, -apple-system, sans-serif;";
    
    modal.innerHTML = 
      '<div style="background:#ffffff; border-radius:24px; max-width:440px; width:100%; padding:32px 24px; text-align:center; box-shadow:0 25px 60px rgba(0,0,0,0.4); border:1px solid rgba(0,210,255,0.3); position:relative; overflow:hidden;">' +
        '<div style="width:68px; height:68px; background:linear-gradient(135deg, rgba(0,210,255,0.15), rgba(2,132,199,0.2)); color:#0284C7; border-radius:20px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:32px; box-shadow:0 8px 20px rgba(0,210,255,0.25);">' +
          '✉️' +
        '</div>' +
        '<h3 style="font-size:20px; font-weight:900; color:#0E1338; margin-bottom:8px;">تأكيد البريد الإلكتروني</h3>' +
        '<p style="font-size:13.5px; color:#64748B; line-height:1.6; margin-bottom:14px;">تم إرسال رابط التفعيل إلى بريدك الإلكتروني:</p>' +
        '<div style="background:#F1F5F9; border:1px dashed #00D2FF; padding:10px 14px; border-radius:12px; font-size:13.5px; font-weight:800; color:#0E1338; word-break:break-all; margin-bottom:18px;">' +
          email +
        '</div>' +
        '<p style="font-size:12.5px; color:#94A3B8; line-height:1.6; margin-bottom:22px;">يرجى فتح صندوق الوارد (أو مجلد الرسائل غير المرغوب فيها Spam) والضغط على رابط التفعيل، ثم اضغط على زر المتابعة بالأسفل لإتمام الدخول.</p>' +
        '<div style="display:flex; flex-direction:column; gap:10px;">' +
          '<button id="hkBtnCheckVerified" style="width:100%; padding:13px; background:linear-gradient(135deg, #00D2FF, #0284C7); color:#fff; border:none; border-radius:12px; font-weight:900; font-size:14px; cursor:pointer; box-shadow:0 8px 20px rgba(0,210,255,0.35);">تأكيد والمتابعة الآن 🚀</button>' +
          '<button id="hkBtnResendVerification" style="width:100%; padding:11px; background:#F8FAFC; color:#0284C7; border:1px solid #CBD5E1; border-radius:12px; font-weight:800; font-size:13px; cursor:pointer;">إعادة إرسال الرابط</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    document.getElementById("hkBtnCheckVerified").onclick = async function() {
      try {
        if (fbUser) {
          await fbUser.reload();
          if (fbUser.emailVerified) {
            var fb = getFirebase();
            var finalDoc = pendingDoc || JSON.parse(localStorage.getItem("hk_pending_reg_doc") || "{}");
            finalDoc.emailVerified = true;
            finalDoc.uid = fbUser.uid;
            finalDoc.id = fbUser.uid;

            if (fb && fb.firestore) {
              await fb.firestore().collection("users").doc(fbUser.uid).set(finalDoc, { merge: true });
            }

            localStorage.setItem("current_user", JSON.stringify(finalDoc));
            localStorage.setItem("edu_currentUser", JSON.stringify(finalDoc));
            localStorage.removeItem("hk_pending_reg_doc");

            modal.remove();
            window.location.replace("dashboard.html");
            return;
          }
        }
      } catch (e) {}
      alert("لم يتم تفعيل البريد الإلكتروني بعد. يرجى الضغط على الرابط في رسالتك ثم إعادة المحاولة.");
    };

    document.getElementById("hkBtnResendVerification").onclick = async function() {
      try {
        if (fbUser) {
          await fbUser.sendEmailVerification();
          alert("تمت إعادة إرسال رابط التفعيل بنجاح. تفقد بريدك الإلكتروني.");
        }
      } catch (e) {
        alert("يرجى الانتظار دقيقة واحدة قبل طلب إعادة الإرسال.");
      }
    };
  } catch (e) {}
}
window.showVerificationPrompt = showVerificationPrompt;

window.FirebaseService = {
  async validateRegistrationData(userData) {
    userData = userData || {};

    var cleanFullName = String(
      userData.fullName || 
      userData.name || 
      userData.studentName || 
      userData.userName || 
      ""
    ).trim();

    var cleanEmail = String(userData.email || "").toLowerCase().trim();
    var cleanPassword = String(userData.password || "");

    var cleanStudentPhone = String(
      userData.studentPhone || 
      userData.phone || 
      userData.mobile || 
      userData.telephone || 
      ""
    ).trim();

    var cleanParentPhone = String(
      userData.parentPhone || 
      userData.guardianPhone || 
      userData.fatherPhone || 
      ""
    ).trim();

    var arabicRegex = /^[\u0621-\u064A\s]+$/;
    if (!cleanFullName || !arabicRegex.test(cleanFullName)) {
      throw new Error("يجب كتابة الاسم باللغة العربية فقط (ممنوع كتابة الأحرف الإنجليزية أو الأرقام أو الرموز).");
    }

    var nameParts = cleanFullName.split(/\s+/).filter(Boolean);
    if (nameParts.length < 3) {
      throw new Error("يرجى إدخال الاسم ثلاثياً باللغة العربية على الأقل.");
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      throw new Error("يرجى إدخال بريد إلكتروني صحيح ومعتمد.");
    }

    var egyptianPhoneRegex = /^01[0125][0-9]{8}$/;

    if (!cleanStudentPhone || !egyptianPhoneRegex.test(cleanStudentPhone)) {
      throw new Error("رقم هاتف الطالب غير صحيح، يجب أن يكون رقماً مصرياً مكوناً من 11 رقماً ويبدأ بـ (010, 011, 012, 015).");
    }

    if (!cleanParentPhone || !egyptianPhoneRegex.test(cleanParentPhone)) {
      throw new Error("رقم ولي الأمر غير صحيح، يجب أن يكون رقماً مصرياً مكوناً من 11 رقماً ويبدأ بـ (010, 011, 012, 015).");
    }

    if (cleanStudentPhone === cleanParentPhone) {
      throw new Error("يجب أن يكون رقم ولي الأمر مختلفاً تماماً عن رقم هاتف الطالب.");
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      throw new Error("يجب ألا تقل كلمة المرور عن 6 خانات.");
    }

    var fb = getFirebase();
    if (fb && fb.firestore) {
      var emailCheck = await fb.firestore().collection("users").where("email", "==", cleanEmail).get();
      if (!emailCheck.empty) {
        throw new Error("هذا البريد الإلكتروني مسجل بالفعل بحساب آخر.");
      }

      var phoneCheck = await fb.firestore().collection("users").where("studentPhone", "==", cleanStudentPhone).get();
      if (!phoneCheck.empty) {
        throw new Error("رقم هاتف الطالب مسجل بالفعل بحساب آخر.");
      }

      var allUsersSnap = await fb.firestore().collection("users").get();
      allUsersSnap.forEach(function(doc) {
        var existingData = doc.data() || {};
        var existingName = String(existingData.fullName || existingData.name || "").trim();
        var existingParts = existingName.split(/\s+/).filter(Boolean);

        if (existingName === cleanFullName) {
          if (nameParts.length === 3) {
            throw new Error("هذا الاسم الثلاثي مسجل بالفعل مسبقاً في المنصة، يرجى كتابة اسمك رباعياً للمتابعة.");
          } else {
            throw new Error("هذا الاسم مسجل بالفعل بحساب آخر، يرجى التأكد من كتابة اسمك بالكامل وبشكل دقيق.");
          }
        }

        if (nameParts.length === 3 && existingParts.length >= 3) {
          var firstThreeExisting = existingParts.slice(0, 3).join(" ");
          if (firstThreeExisting === cleanFullName) {
            throw new Error("الاسم الثلاثي (" + cleanFullName + ") مسجل بالفعل لطالب آخر، يرجى كتابة اسمك رباعياً لتفادي التشابه.");
          }
        }
      });
    }

    return {
      fullName: cleanFullName,
      name: cleanFullName,
      studentName: cleanFullName,
      email: cleanEmail,
      password: cleanPassword,
      studentPhone: cleanStudentPhone,
      phone: cleanStudentPhone,
      mobile: cleanStudentPhone,
      parentPhone: cleanParentPhone,
      guardianPhone: cleanParentPhone,
      governorate: userData.governorate || "غير محدد",
      educationType: userData.educationType || "GENERAL",
      schoolName: userData.schoolName || "غير محدد"
    };
  },

  async registerStudent(userData) {
    var valid = await this.validateRegistrationData(userData);
    var fb = getFirebase();

    var uid = "u_" + Date.now();
    var createdFbUser = null;

    if (fb && fb.auth) {
      try {
        var userCredential = await fb.auth().createUserWithEmailAndPassword(valid.email, valid.password);
        createdFbUser = userCredential.user;
        uid = createdFbUser.uid;

        await createdFbUser.updateProfile({ displayName: valid.fullName }).catch(function() {});
        await createdFbUser.sendEmailVerification();
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          throw new Error("هذا البريد الإلكتروني مسجل بالفعل بحساب آخر.");
        }
        throw authErr;
      }
    }

    var userDoc = {
      uid: uid,
      id: uid,
      fullName: valid.fullName,
      name: valid.fullName,
      studentName: valid.fullName,
      email: valid.email,
      studentPhone: valid.studentPhone,
      phone: valid.studentPhone,
      mobile: valid.studentPhone,
      parentPhone: valid.parentPhone,
      guardianPhone: valid.parentPhone,
      governorate: valid.governorate,
      educationType: valid.educationType,
      schoolName: valid.schoolName,
      role: "STUDENT",
      enrolledCourses: ["c1"],
      customAllowedLessons: {},
      courseAccessCount: {},
      emailVerified: false,
      devices: [],
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("hk_pending_reg_doc", JSON.stringify(userDoc));
    showVerificationPrompt(valid.email, createdFbUser, userDoc);
    return userDoc;
  },

  async loginUser(email, password) {
    var fb = getFirebase();
    var foundUser = null;
    var cleanEmail = email.toLowerCase().trim();

    if (fb && fb.auth) {
      try {
        var userCredential = await fb.auth().signInWithEmailAndPassword(cleanEmail, password);
        var fbUser = userCredential.user;
        var uid = fbUser.uid;

        await fbUser.reload();
        if (!fbUser.emailVerified) {
          showVerificationPrompt(fbUser.email, fbUser, null);
          throw new Error("لا يمكن تسجيل الدخول؛ يرجى تفعيل حسابك أولاً عبر الرابط المرسل لبريدك الإلكتروني.");
        }

        if (fb.firestore) {
          try {
            var snap = await fb.firestore().collection("users").doc(uid).get();
            if (snap.exists) {
              foundUser = snap.data();
              foundUser.uid = uid;
              foundUser.id = uid;
            }
          } catch (e) {}
        }

        if (!foundUser) {
          foundUser = {
            uid: uid,
            id: uid,
            email: cleanEmail,
            fullName: fbUser.displayName || "طالب",
            name: fbUser.displayName || "طالب",
            role: "STUDENT",
            enrolledCourses: ["c1"],
            devices: []
          };
        }
      } catch (e) {
        if (e.message && e.message.includes("تفعيل حسابك")) {
          throw e;
        }
        if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }
        throw e;
      }
    }

    if (!foundUser && fb && fb.firestore) {
      try {
        var qSnap = await fb.firestore().collection("users").where("email", "==", cleanEmail).get();
        if (!qSnap.empty) {
          foundUser = qSnap.docs[0].data();
          foundUser.uid = qSnap.docs[0].id;
          foundUser.id = qSnap.docs[0].id;
        }
      } catch (e) {}
    }

    if (foundUser) {
      foundUser.uid = foundUser.uid || foundUser.id;
      foundUser.id = foundUser.uid;
      var unifiedName = foundUser.fullName || foundUser.name || foundUser.studentName || "طالب";
      foundUser.fullName = unifiedName;
      foundUser.name = unifiedName;
      var unifiedPhone = foundUser.studentPhone || foundUser.phone || foundUser.mobile || "";
      foundUser.studentPhone = unifiedPhone;
      foundUser.phone = unifiedPhone;
      foundUser.email = foundUser.email || cleanEmail;
      foundUser.role = (foundUser.role || "STUDENT").toUpperCase();
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

  async resetPassword(email) {
    var fb = getFirebase();
    var cleanEmail = email.toLowerCase().trim();

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

  async logoutUser() {
    var fb = getFirebase();
    if (fb && fb.auth) {
      try { await fb.auth().signOut(); } catch (e) {}
    }
    localStorage.removeItem("current_user");
    localStorage.removeItem("edu_currentUser");
    localStorage.removeItem("hk_pending_reg_doc");
    window.location.replace("login.html");
  },

  subscribeUsers(callback) {
    var local = JSON.parse(localStorage.getItem("edu_users") || "[]");
    if (callback && local.length > 0) callback(local);

    var check = setInterval(function() {
      var fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("users").onSnapshot(function(snap) {
          var list = [];
          snap.forEach(function(doc) { 
            var uData = doc.data() || {};
            var docId = String(doc.id || "");
            uData.uid = docId;
            uData.id = docId;

            var resolvedName = String(uData.fullName || uData.name || uData.studentName || "طالب");
            var resolvedPhone = String(uData.studentPhone || uData.phone || uData.mobile || "");
            var resolvedParentPhone = String(uData.parentPhone || uData.guardianPhone || "غير مسجل");

            uData.fullName = resolvedName;
            uData.name = resolvedName;
            uData.studentName = resolvedName;
            uData.email = String(uData.email || "");
            uData.studentPhone = resolvedPhone;
            uData.phone = resolvedPhone;
            uData.mobile = resolvedPhone;
            uData.parentPhone = resolvedParentPhone;
            uData.governorate = String(uData.governorate || "غير محدد");
            uData.role = String(uData.role || "STUDENT").toUpperCase();
            uData.enrolledCourses = Array.isArray(uData.enrolledCourses) ? uData.enrolledCourses.map(String) : [];
            uData.devices = Array.isArray(uData.devices) ? uData.devices : [];
            list.push(uData);
          });
          localStorage.setItem("edu_users", JSON.stringify(list));
          if (callback) callback(list);
        }, function(err) {
          console.warn("Users sync notice:", err);
          if (callback && local.length > 0) callback(local);
        });
      }
    }, 150);
  },

  async updateUserRoleByUid(uid, newRole) {
    var fb = getFirebase();
    if (fb && fb.firestore && uid) {
      await fb.firestore().collection("users").doc(uid).update({ role: newRole });
    }
  },

  async updateUserEnrollmentsByUid(uid, enrolledCourses, customLessons) {
    var fb = getFirebase();
    if (fb && fb.firestore && uid) {
      var normalizedCourses = (enrolledCourses || []).map(String);
      var updateData = { enrolledCourses: normalizedCourses };
      if (customLessons) updateData.customAllowedLessons = customLessons;
      await fb.firestore().collection("users").doc(uid).update(updateData);
    }
  },

  async deleteUserCascadeByUid(uid) {
    var fb = getFirebase();
    if (fb && fb.firestore && uid) {
      var batch = fb.firestore().batch();
      batch.delete(fb.firestore().collection("users").doc(uid));

      try {
        var paySnap = await fb.firestore().collection("payments").where("userUid", "==", uid).get();
        paySnap.forEach(function(doc) { batch.delete(doc.ref); });

        var subSnap = await fb.firestore().collection("submissions").where("userUid", "==", uid).get();
        subSnap.forEach(function(doc) { batch.delete(doc.ref); });

        await batch.commit();
      } catch (e) {}
    }
  },

  subscribeCourses(callback) {
    var local = JSON.parse(localStorage.getItem("edu_courses") || "[]");
    if (callback && local.length > 0) callback(local);

    var check = setInterval(function() {
      var fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("courses").onSnapshot(function(snap) {
          var list = [];
          snap.forEach(function(doc) { 
            var cData = doc.data() || {};
            var safeCourse = {
              id: String(doc.id || ""),
              title: String(cData.title || ""),
              description: String(cData.description || ""),
              image: String(cData.image || ""),
              price: String(cData.price !== undefined && cData.price !== null ? cData.price : "0"),
              isFree: Boolean(cData.isFree),
              lessons: []
            };

            if (Array.isArray(cData.lessons)) {
              safeCourse.lessons = cData.lessons.map(function(l) {
                if (!l || typeof l !== "object") l = {};
                var rawUrl = String(l.videoUrl || "");
                return {
                  id: String(l.id || ""),
                  title: String(l.title || ""),
                  description: String(l.description || ""),
                  videoUrl: rawUrl ? formatYouTubeEmbedUrl(rawUrl) : "",
                  duration: String(l.duration || ""),
                  pdfUrl: String(l.pdfUrl || "")
                };
              });
            }

            list.push(safeCourse);
          });

          localStorage.setItem("edu_courses", JSON.stringify(list));
          if (callback) callback(list);
        }, function(err) {
          console.warn("Courses sync notice:", err);
          if (callback && local.length > 0) callback(local);
        });
      }
    }, 150);
  },

  async saveCourse(courseData, courseId) {
    var fb = getFirebase();
    if (fb && fb.firestore) {
      if (courseData.image && courseData.image.startsWith("data:image")) {
        courseData.image = await compressImageBase64(courseData.image, 450, 260, 0.45);
      }
      if (courseData.lessons && Array.isArray(courseData.lessons)) {
        courseData.lessons = courseData.lessons.map(function(l) {
          return Object.assign({}, l, { videoUrl: formatYouTubeEmbedUrl(l.videoUrl || "") });
        });
      }
      if (courseId) {
        await fb.firestore().collection("courses").doc(courseId).set(courseData, { merge: true });
        return Object.assign({ id: courseId }, courseData);
      } else {
        var ref = await fb.firestore().collection("courses").add(courseData);
        return Object.assign({ id: ref.id }, courseData);
      }
    }
  },

  async deleteCourse(courseId) {
    var fb = getFirebase();
    if (fb && fb.firestore && courseId) {
      await fb.firestore().collection("courses").doc(courseId).delete();
    }
  },

  subscribeExams(callback) {
    var local = JSON.parse(localStorage.getItem("edu_exams") || "[]");
    if (callback && local.length > 0) callback(local);

    var check = setInterval(function() {
      var fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("exams").onSnapshot(function(snap) {
          var list = [];
          snap.forEach(function(doc) { 
            var exData = doc.data() || {};
            exData.id = String(doc.id || "");
            exData.title = String(exData.title || "");
            list.push(exData);
          });
          localStorage.setItem("edu_exams", JSON.stringify(list));
          if (callback) callback(list);
        }, function(err) {
          console.warn("Exams sync notice:", err);
          if (callback && local.length > 0) callback(local);
        });
      }
    }, 150);
  },

  async saveExam(examData, examId) {
    var fb = getFirebase();
    if (fb && fb.firestore) {
      if (examId) {
        await fb.firestore().collection("exams").doc(examId).set(examData, { merge: true });
      } else {
        var ref = await fb.firestore().collection("exams").add(examData);
        examData.id = ref.id;
      }
    }
  },

  async deleteExam(examId) {
    var fb = getFirebase();
    if (fb && fb.firestore && examId) {
      await fb.firestore().collection("exams").doc(examId).delete();
    }
  },

  subscribeSubmissions(callback) {
    var local = JSON.parse(localStorage.getItem("edu_submissions") || "[]");
    if (callback && local.length > 0) callback(local);

    var check = setInterval(function() {
      var fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("submissions").onSnapshot(function(snap) {
          var list = [];
          snap.forEach(function(doc) { list.push(Object.assign({ id: doc.id }, doc.data())); });
          localStorage.setItem("edu_submissions", JSON.stringify(list));
          if (callback) callback(list);
        }, function(err) {
          if (callback && local.length > 0) callback(local);
        });
      }
    }, 150);
  },

  async saveSubmission(submissionData) {
    var fb = getFirebase();
    if (fb && fb.firestore) {
      submissionData.createdAt = new Date().toISOString();
      await fb.firestore().collection("submissions").add(submissionData);
    }
  },

  subscribePayments(callback) {
    var local = JSON.parse(localStorage.getItem("edu_payments") || "[]");
    if (callback && local.length > 0) callback(local);

    var check = setInterval(function() {
      var fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("payments").onSnapshot(function(snap) {
          var list = [];
          snap.forEach(function(doc) { list.push(Object.assign({ id: doc.id }, doc.data())); });
          localStorage.setItem("edu_payments", JSON.stringify(list));
          if (callback) callback(list);
        }, function(err) {
          if (callback && local.length > 0) callback(local);
        });
      }
    }, 150);
  },

  async submitPayment(paymentData) {
    var fb = getFirebase();
    if (fb && fb.firestore) {
      if (paymentData.receipt && paymentData.receipt.startsWith("data:image")) {
        paymentData.receipt = await compressImageBase64(paymentData.receipt, 400, 400, 0.4);
      }
      paymentData.createdAt = new Date().toISOString();
      paymentData.status = "PENDING";
      paymentData.courseId = String(paymentData.courseId);
      var ref = await fb.firestore().collection("payments").add(paymentData);
      return ref.id;
    }
  },

  async approvePaymentAndEnroll(paymentId, userUid, courseId, userEmail) {
    var fb = getFirebase();
    if (fb && fb.firestore) {
      var stringCourseId = String(courseId);
      var targetUid = userUid;

      if (!targetUid && userEmail) {
        var cleanEmail = userEmail.toLowerCase().trim();
        var qSnap = await fb.firestore().collection("users").where("email", "==", cleanEmail).get();
        if (!qSnap.empty) {
          targetUid = qSnap.docs[0].id;
        }
      }

      if (!targetUid) {
        throw new Error("لم يتم العثور على حساب الطالب المرتبط بعملية الدفع.");
      }

      var batch = fb.firestore().batch();
      var payRef = fb.firestore().collection("payments").doc(paymentId);
      batch.update(payRef, { status: "APPROVED", userUid: targetUid });

      var userRef = fb.firestore().collection("users").doc(targetUid);
      batch.update(userRef, {
        enrolledCourses: firebase.firestore.FieldValue.arrayUnion(stringCourseId)
      });

      await batch.commit();

      var currentUser = JSON.parse(localStorage.getItem("current_user"));
      if (currentUser && (currentUser.uid === targetUid || currentUser.id === targetUid)) {
        if (!currentUser.enrolledCourses) currentUser.enrolledCourses = [];
        if (!currentUser.enrolledCourses.map(String).includes(stringCourseId)) {
          currentUser.enrolledCourses.push(stringCourseId);
          localStorage.setItem("current_user", JSON.stringify(currentUser));
          localStorage.setItem("edu_currentUser", JSON.stringify(currentUser));
        }
      }
    }
  },

  async rejectPayment(paymentId) {
    var fb = getFirebase();
    if (fb && fb.firestore && paymentId) {
      await fb.firestore().collection("payments").doc(paymentId).update({ status: "REJECTED" });
    }
  },

  subscribeNotifications(callback) {
    var check = setInterval(function() {
      var fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("notifications").orderBy("createdAt", "desc").limit(25).onSnapshot(function(snap) {
          var list = [];
          snap.forEach(function(doc) { list.push(Object.assign({ id: doc.id }, doc.data())); });
          if (callback) callback(list);
        }, function() {});
      }
    }, 150);
  },

  async pushNotificationToCloud(title, body, targetUid, targetUrl, senderEmail) {
    var fb = getFirebase();
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

  // =========================================================
  // شات الدعم الفني: استماع فوري فائق الدقة بدون فقدان أي رسالة
  // =========================================================

  subscribeChatGlobalConfig(callback) {
    var check = setInterval(function() {
      var fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("system_settings").doc("chat_config")
          .onSnapshot(function(doc) {
            var cfg = doc && doc.exists ? doc.data() : { isStudentChatEnabled: true };
            if (callback) callback(cfg);
          }, function() {
            if (callback) callback({ isStudentChatEnabled: true });
          });
      }
    }, 150);
  },

  async setChatGlobalStatus(isEnabled, adminUid) {
    var fb = getFirebase();
    if (fb && fb.firestore) {
      await fb.firestore().collection("system_settings").doc("chat_config").set({
        isStudentChatEnabled: Boolean(isEnabled),
        updatedBy: adminUid || "SUPER_ADMIN",
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  },

  subscribeStudentChat(studentUid, callback) {
    if (!studentUid) return function() {};

    var unsub = null;
    var check = setInterval(function() {
      var fb = getFirebase();
      if (fb && fb.firestore && studentUid) {
        clearInterval(check);
        unsub = fb.firestore().collection("support_threads").doc(studentUid).collection("messages")
          .onSnapshot(function(snap) {
            var list = [];
            snap.forEach(function(doc) { 
              list.push(Object.assign({ id: doc.id }, doc.data())); 
            });
            // فرز الرسائل محلياً لضمان عدم توقف الاستعلام عند غياب الـ Index السحابي
            list.sort(function(a, b) {
              var tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              var tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tA - tB;
            });
            localStorage.setItem("edu_chat_" + studentUid, JSON.stringify(list));
            if (callback) callback(list);
          }, function(err) {
            console.warn("Chat sync notice:", err);
          });
      }
    }, 120);

    return function() {
      clearInterval(check);
      if (unsub) unsub();
    };
  },

  subscribeAllSupportThreads(callback) {
    var check = setInterval(function() {
      var fb = getFirebase();
      if (fb && fb.firestore) {
        clearInterval(check);
        fb.firestore().collection("support_threads")
          .onSnapshot(function(snap) {
            var list = [];
            snap.forEach(function(doc) { 
              var tData = doc.data() || {};
              tData.id = doc.id;
              tData.studentUid = tData.studentUid || doc.id;
              list.push(tData); 
            });
            list.sort(function(a, b) {
              var tA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
              var tB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
              return tB - tA;
            });
            localStorage.setItem("edu_support_threads", JSON.stringify(list));
            if (callback) callback(list);
          }, function(err) {
            console.warn("Threads sync notice:", err);
          });
      }
    }, 150);
  },

  async sendSupportMessage(msgData) {
    var fb = getFirebase();
    var studentUid = String(msgData.studentUid || msgData.senderUid || "").trim();
    if (!studentUid) {
      var user = JSON.parse(localStorage.getItem("current_user") || "{}");
      studentUid = String(user.uid || user.id || "guest_student");
    }

    var now = new Date().toISOString();
    var senderRole = String(msgData.senderRole || "STUDENT").toUpperCase();

    var messageDoc = {
      text: String(msgData.text || "").trim(),
      senderUid: String(msgData.senderUid || studentUid),
      senderName: String(msgData.senderName || "طالب"),
      senderRole: senderRole,
      createdAt: now
    };

    if (fb && fb.firestore) {
      await fb.firestore().collection("support_threads").doc(studentUid).collection("messages").add(messageDoc);

      var threadUpdate = {
        studentUid: studentUid,
        studentName: String(msgData.studentName || "طالب"),
        studentPhone: String(msgData.studentPhone || ""),
        studentEmail: String(msgData.studentEmail || ""),
        lastMessage: String(msgData.text || ""),
        lastMessageTime: now,
        lastSenderRole: senderRole,
        status: senderRole === "STUDENT" ? "PENDING" : "RESOLVED"
      };

      try {
        if (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue) {
          threadUpdate.unreadCount = senderRole === "STUDENT" 
            ? firebase.firestore.FieldValue.increment(1) 
            : 0;
        }
      } catch (e) {}

      await fb.firestore().collection("support_threads").doc(studentUid).set(threadUpdate, { merge: true });
    }
  },

  async deleteSupportThread(studentUid, name) {
    var fb = getFirebase();
    if (fb && fb.firestore && studentUid) {
      try {
        var msgs = await fb.firestore().collection("support_threads").doc(studentUid).collection("messages").get();
        var batch = fb.firestore().batch();
        msgs.forEach(function(d) { batch.delete(d.ref); });
        batch.delete(fb.firestore().collection("support_threads").doc(studentUid));
        await batch.commit();
        localStorage.removeItem("edu_chat_" + studentUid);
      } catch (e) {
        console.warn("حذف المحادثة:", e);
      }
    }
  },

  async updateThreadStatus(studentUid, status, assignedTo) {
    var fb = getFirebase();
    if (fb && fb.firestore && studentUid) {
      var update = { status: status, updatedAt: new Date().toISOString() };
      if (assignedTo !== undefined) update.assignedTo = assignedTo;
      await fb.firestore().collection("support_threads").doc(studentUid).update(update);
    }
  }
};