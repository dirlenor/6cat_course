(() => {
  const admin = window.sixCatAdmin;
  if (!admin) return;

  const courseList = document.querySelector("[data-learning-course-list]");
  const courseCreateForm = document.querySelector("[data-learning-course-create]");
  const courseForm = document.querySelector("[data-learning-course-form]");
  const emptyState = document.querySelector("[data-learning-empty]");
  const editor = document.querySelector("[data-learning-editor]");
  const moduleList = document.querySelector("[data-learning-module-list]");
  const message = document.querySelector("[data-learning-message]");
  const studentForm = document.querySelector("[data-learning-student-form]");
  const studentMessage = document.querySelector("[data-learning-student-message]");
  const studentList = document.querySelector("[data-learning-student-list]");
  const moduleDialog = document.querySelector("[data-learning-module-dialog]");
  const moduleForm = document.querySelector("[data-learning-module-form]");
  const moduleMessage = document.querySelector("[data-learning-module-message]");
  const lessonDialog = document.querySelector("[data-learning-lesson-dialog]");
  const lessonForm = document.querySelector("[data-learning-lesson-form]");
  const lessonMessage = document.querySelector("[data-learning-lesson-message]");

  let courses = [];
  let modules = [];
  let lessons = [];
  let students = [];
  let enrollments = [];
  let selectedCourseId = "";
  let loaded = false;

  function authHeaders(extra = {}) {
    const token = admin.getAccessToken();
    if (!token) throw new Error("กรุณาเข้าสู่ระบบใหม่");
    return { apikey: admin.getSupabaseKey(), Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...extra };
  }

  async function readJson(response, fallback) {
    const result = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.message || result?.error || fallback);
    return result;
  }

  async function rest(path, options = {}) {
    const response = await fetch(`${admin.getSupabaseUrl()}/rest/v1/${path}`, { ...options, headers: authHeaders(options.headers || {}) });
    return readJson(response, "เชื่อมต่อฐานข้อมูลบทเรียนไม่สำเร็จ");
  }

  async function invoke(name, payload) {
    const response = await fetch(`${admin.getSupabaseUrl()}/functions/v1/${name}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
    return readJson(response, "เรียกใช้งานระบบนักเรียนไม่สำเร็จ");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function slugify(value) {
    const slug = String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return slug || `course-${Date.now()}`;
  }

  function youtubeId(value) {
    const input = String(value || "").trim();
    if (!input) return null;
    if (/^[A-Za-z0-9_-]{6,20}$/.test(input)) return input;
    try {
      const url = new URL(input);
      const host = url.hostname.replace(/^www\./, "");
      const id = host === "youtu.be" ? url.pathname.slice(1).split("/")[0] : ["youtube.com", "m.youtube.com"].includes(host) ? (url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1]) : "";
      return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
    } catch (_) {
      return null;
    }
  }

  function selectedCourse() {
    return courses.find((course) => course.id === selectedCourseId) || null;
  }

  async function loadLearningData() {
    message.textContent = "กำลังโหลดข้อมูลคอร์ส...";
    try {
      [courses, modules, lessons, students, enrollments] = await Promise.all([
        rest("courses?select=*&order=created_at.asc"),
        rest("course_modules?select=*&order=position.asc,created_at.asc"),
        rest("lessons?select=*&order=position.asc,created_at.asc"),
        rest("student_profiles?select=*&order=created_at.desc"),
        rest("enrollments?select=*&order=created_at.desc"),
      ]);
      if (selectedCourseId && !courses.some((course) => course.id === selectedCourseId)) selectedCourseId = "";
      if (!selectedCourseId && courses.length) selectedCourseId = courses[0].id;
      renderAll();
      loaded = true;
      message.textContent = "";
    } catch (error) {
      message.textContent = error.message;
    }
  }

  function renderAll() {
    renderCourseList();
    renderCourseEditor();
    renderStudentOptions();
    renderStudents();
  }

  function renderCourseList() {
    courseList.innerHTML = courses.map((course) => `<button class="learning-course-item${course.id === selectedCourseId ? " is-active" : ""}" type="button" data-learning-course="${course.id}"><strong>${escapeHtml(course.title)}</strong><span>${course.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}</span></button>`).join("") || `<div class="learning-no-lessons">ยังไม่มีคอร์ส</div>`;
  }

  function renderCourseEditor() {
    const course = selectedCourse();
    emptyState.hidden = Boolean(course);
    editor.hidden = !course;
    if (!course) return;
    courseForm.elements.courseId.value = course.id;
    courseForm.elements.title.value = course.title;
    courseForm.elements.slug.value = course.slug;
    courseForm.elements.description.value = course.description || "";
    courseForm.elements.coverImageUrl.value = course.cover_image_url || "";
    courseForm.elements.status.value = course.status;
    renderModules();
  }

  function renderModules() {
    const courseModules = modules.filter((module) => module.course_id === selectedCourseId);
    moduleList.innerHTML = courseModules.map((module) => {
      const moduleLessons = lessons.filter((lesson) => lesson.module_id === module.id);
      const lessonRows = moduleLessons.map((lesson) => `<div class="learning-lesson"><div><strong>${escapeHtml(lesson.position)}. ${escapeHtml(lesson.title)}</strong><small>${lesson.is_published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}${lesson.duration_minutes ? ` · ${escapeHtml(lesson.duration_minutes)} นาที` : ""}${lesson.youtube_video_id ? " · มีวิดีโอ" : ""}</small></div><div class="learning-row-actions"><button type="button" data-learning-edit-lesson="${lesson.id}">แก้ไข</button></div></div>`).join("") || `<div class="learning-no-lessons">ยังไม่มีบทเรียนในบทนี้</div>`;
      return `<article class="learning-module"><div class="learning-module__head"><div><strong>${escapeHtml(module.position)}. ${escapeHtml(module.title)}</strong><span>${module.is_published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}</span></div><div class="learning-row-actions"><button type="button" data-learning-edit-module="${module.id}">แก้ไขบท</button><button type="button" data-learning-add-lesson="${module.id}">เพิ่มบทเรียน</button></div></div><div class="learning-lessons">${lessonRows}</div></article>`;
    }).join("") || `<div class="learning-no-lessons">ยังไม่มีบท กด “เพิ่มบท” เพื่อเริ่มต้น</div>`;
  }

  function renderStudentOptions() {
    const select = studentForm.elements.courseId;
    const previous = select.value;
    select.innerHTML = `<option value="">เลือกคอร์ส</option>${courses.map((course) => `<option value="${course.id}">${escapeHtml(course.title)}</option>`).join("")}`;
    if (courses.some((course) => course.id === previous)) select.value = previous;
  }

  function renderStudents() {
    const rows = enrollments.map((enrollment) => {
      const student = students.find((item) => item.id === enrollment.student_id);
      const course = courses.find((item) => item.id === enrollment.course_id);
      if (!student || !course) return "";
      const expired = enrollment.expires_at && new Date(enrollment.expires_at).getTime() <= Date.now();
      const state = expired && enrollment.status === "active" ? "expired" : enrollment.status;
      const stateLabel = ({ active: "ใช้งาน", suspended: "พักสิทธิ์", expired: "หมดอายุ", revoked: "ยกเลิก" })[state] || state;
      const nextStatus = enrollment.status === "active" ? "suspended" : "active";
      return `<tr><td><strong>${escapeHtml(student.full_name)}</strong><br><small>${escapeHtml(student.email)}</small></td><td>${escapeHtml(student.student_code)}</td><td>${escapeHtml(course.title)}</td><td>${enrollment.expires_at ? escapeHtml(new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(enrollment.expires_at))) : "ไม่หมดอายุ"}</td><td><span class="learning-state learning-state--${escapeHtml(state)}">${escapeHtml(stateLabel)}</span></td><td><button type="button" data-learning-enrollment="${enrollment.id}" data-learning-enrollment-status="${nextStatus}">${nextStatus === "active" ? "เปิดสิทธิ์" : "พักสิทธิ์"}</button></td></tr>`;
    }).join("");
    studentList.innerHTML = `<table class="learning-student-table"><thead><tr><th>นักเรียน</th><th>รหัส</th><th>คอร์ส</th><th>หมดอายุ</th><th>สถานะ</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="6">ยังไม่มีนักเรียน</td></tr>`}</tbody></table>`;
  }

  async function createCourse(event) {
    event.preventDefault();
    const title = courseCreateForm.elements.title.value.trim();
    const rows = await rest("courses", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ title, slug: slugify(title) }) });
    courseCreateForm.reset();
    selectedCourseId = rows[0]?.id || "";
    await loadLearningData();
    message.textContent = "สร้างคอร์สแล้ว เริ่มเพิ่มบทและบทเรียนได้เลย";
  }

  async function saveCourse(event) {
    event.preventDefault();
    const id = courseForm.elements.courseId.value;
    await rest(`courses?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ title: courseForm.elements.title.value.trim(), slug: courseForm.elements.slug.value.trim(), description: courseForm.elements.description.value.trim(), cover_image_url: courseForm.elements.coverImageUrl.value.trim() || null, status: courseForm.elements.status.value }) });
    await loadLearningData();
    message.textContent = "บันทึกข้อมูลคอร์สแล้ว";
  }

  function openModule(module = null) {
    moduleMessage.textContent = "";
    moduleForm.reset();
    moduleForm.elements.courseId.value = selectedCourseId;
    moduleForm.elements.moduleId.value = module?.id || "";
    moduleForm.elements.title.value = module?.title || "";
    moduleForm.elements.description.value = module?.description || "";
    moduleForm.elements.position.value = module?.position || modules.filter((item) => item.course_id === selectedCourseId).length + 1;
    moduleForm.elements.isPublished.checked = Boolean(module?.is_published);
    moduleDialog.showModal();
  }

  async function saveModule(event) {
    event.preventDefault();
    const id = moduleForm.elements.moduleId.value;
    const payload = { course_id: moduleForm.elements.courseId.value, title: moduleForm.elements.title.value.trim(), description: moduleForm.elements.description.value.trim(), position: Number(moduleForm.elements.position.value), is_published: moduleForm.elements.isPublished.checked };
    await rest(id ? `course_modules?id=eq.${encodeURIComponent(id)}` : "course_modules", { method: id ? "PATCH" : "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) });
    moduleDialog.close();
    await loadLearningData();
    message.textContent = "บันทึกบทแล้ว";
  }

  function openLesson(moduleId, lesson = null) {
    lessonMessage.textContent = "";
    lessonForm.reset();
    lessonForm.elements.moduleId.value = moduleId;
    lessonForm.elements.lessonId.value = lesson?.id || "";
    lessonForm.elements.title.value = lesson?.title || "";
    lessonForm.elements.summary.value = lesson?.summary || "";
    lessonForm.elements.lessonContent.value = lesson?.lesson_content || "";
    lessonForm.elements.youtubeVideo.value = lesson?.youtube_video_id || "";
    lessonForm.elements.durationMinutes.value = lesson?.duration_minutes || "";
    lessonForm.elements.position.value = lesson?.position || lessons.filter((item) => item.module_id === moduleId).length + 1;
    lessonForm.elements.isPublished.checked = Boolean(lesson?.is_published);
    lessonDialog.showModal();
  }

  async function saveLesson(event) {
    event.preventDefault();
    const id = lessonForm.elements.lessonId.value;
    const videoInput = lessonForm.elements.youtubeVideo.value.trim();
    const videoId = youtubeId(videoInput);
    if (videoInput && !videoId) throw new Error("YouTube URL หรือ Video ID ไม่ถูกต้อง");
    const duration = Number(lessonForm.elements.durationMinutes.value);
    const payload = { module_id: lessonForm.elements.moduleId.value, title: lessonForm.elements.title.value.trim(), summary: lessonForm.elements.summary.value.trim(), lesson_content: lessonForm.elements.lessonContent.value.trim(), youtube_video_id: videoId, duration_minutes: duration || null, position: Number(lessonForm.elements.position.value), is_published: lessonForm.elements.isPublished.checked };
    await rest(id ? `lessons?id=eq.${encodeURIComponent(id)}` : "lessons", { method: id ? "PATCH" : "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) });
    lessonDialog.close();
    await loadLearningData();
    message.textContent = "บันทึกบทเรียนแล้ว";
  }

  async function createStudent(event) {
    event.preventDefault();
    const button = studentForm.querySelector('button[type="submit"]');
    button.disabled = true;
    studentMessage.textContent = "กำลังสร้างบัญชีนักเรียน...";
    try {
      const expiry = studentForm.elements.expiresAt.value;
      const result = await invoke("create-student", { fullName: studentForm.elements.fullName.value.trim(), email: studentForm.elements.email.value.trim(), password: studentForm.elements.password.value, courseId: studentForm.elements.courseId.value, expiresAt: expiry ? new Date(`${expiry}T23:59:59+07:00`).toISOString() : null });
      studentForm.reset();
      await loadLearningData();
      studentMessage.textContent = result.createdAuthUser
        ? `สร้างบัญชี ${result.student.student_code} แล้ว ส่งอีเมลและรหัสผ่านชั่วคราวให้นักเรียนได้เลย`
        : `เพิ่มสิทธิ์คอร์สให้ ${result.student.student_code} แล้ว ใช้รหัสผ่านเดิมเข้าสู่ระบบได้เลย`;
    } catch (error) {
      studentMessage.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  }

  courseList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-learning-course]");
    if (!button) return;
    selectedCourseId = button.dataset.learningCourse;
    renderCourseList();
    renderCourseEditor();
  });
  courseCreateForm.addEventListener("submit", (event) => createCourse(event).catch((error) => { message.textContent = error.message; }));
  courseForm.addEventListener("submit", (event) => saveCourse(event).catch((error) => { message.textContent = error.message; }));
  document.querySelector("[data-learning-add-module]").addEventListener("click", () => openModule());
  moduleList.addEventListener("click", (event) => {
    const editModule = event.target.closest("[data-learning-edit-module]");
    const addLesson = event.target.closest("[data-learning-add-lesson]");
    const editLesson = event.target.closest("[data-learning-edit-lesson]");
    if (editModule) openModule(modules.find((item) => item.id === editModule.dataset.learningEditModule));
    else if (addLesson) openLesson(addLesson.dataset.learningAddLesson);
    else if (editLesson) {
      const lesson = lessons.find((item) => item.id === editLesson.dataset.learningEditLesson);
      if (lesson) openLesson(lesson.module_id, lesson);
    }
  });
  moduleForm.addEventListener("submit", (event) => saveModule(event).catch((error) => { moduleMessage.textContent = error.message; }));
  lessonForm.addEventListener("submit", (event) => saveLesson(event).catch((error) => { lessonMessage.textContent = error.message; }));
  studentForm.addEventListener("submit", createStudent);
  studentList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-learning-enrollment]");
    if (!button) return;
    button.disabled = true;
    try {
      await rest(`enrollments?id=eq.${encodeURIComponent(button.dataset.learningEnrollment)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status: button.dataset.learningEnrollmentStatus }) });
      await loadLearningData();
      studentMessage.textContent = "อัปเดตสิทธิ์เข้าเรียนแล้ว";
    } catch (error) {
      studentMessage.textContent = error.message;
      button.disabled = false;
    }
  });
  ["[data-learning-module-close]", "[data-learning-module-cancel]"].forEach((selector) => document.querySelector(selector).addEventListener("click", () => moduleDialog.close()));
  ["[data-learning-lesson-close]", "[data-learning-lesson-cancel]"].forEach((selector) => document.querySelector(selector).addEventListener("click", () => lessonDialog.close()));
  ["courses", "students"].forEach((view) => document.querySelector(`[data-dashboard-tab="${view}"]`).addEventListener("click", () => { if (!loaded) loadLearningData(); }));
})();
