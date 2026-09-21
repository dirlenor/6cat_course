(() => {
  const supabaseUrl = "https://qmayxfnadhqzilwrtepx.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtYXl4Zm5hZGhxemlsd3J0ZXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDExNTUsImV4cCI6MjEwNDA3NzE1NX0.bqjBAT40wb15awnsRX-F7eDpGOM2rXdfZO_g43HPYn4";
  const sessionKey = "6cat-student-session";
  const app = document.querySelector("[data-student-app]");
  const courseSelect = document.querySelector("[data-student-course]");
  const navigation = document.querySelector("[data-student-navigation]");
  const lessonView = document.querySelector("[data-student-lesson]");
  const empty = document.querySelector("[data-student-empty]");
  const message = document.querySelector("[data-student-message]");
  const passwordDialog = document.querySelector("[data-student-password-dialog]");
  const passwordForm = document.querySelector("[data-student-password-form]");
  const passwordMessage = document.querySelector("[data-student-password-message]");

  let session = null;
  let profile = null;
  let courses = [];
  let modules = [];
  let lessons = [];
  let progress = [];
  let currentCourseId = "";
  let currentLessonId = "";

  function storeSession(next) {
    session = next;
    sessionStorage.setItem(sessionKey, JSON.stringify(next));
  }

  async function auth(path, body) {
    const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, { method: "POST", headers: { apikey: supabaseKey, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error_description || result.msg || "Session หมดอายุ");
    return result;
  }

  async function restoreSession() {
    const saved = sessionStorage.getItem(sessionKey);
    if (!saved) throw new Error("กรุณาเข้าสู่ระบบ");
    session = JSON.parse(saved);
    let response = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${session.access_token}` } });
    if (!response.ok && session.refresh_token) {
      storeSession(await auth("token?grant_type=refresh_token", { refresh_token: session.refresh_token }));
      response = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${session.access_token}` } });
    }
    if (!response.ok) throw new Error("กรุณาเข้าสู่ระบบใหม่");
    session.user = await response.json();
    storeSession(session);
  }

  async function rest(path, options = {}) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { ...options, headers: { apikey: supabaseKey, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json", ...(options.headers || {}) } });
    const result = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "โหลดบทเรียนไม่สำเร็จ");
    return result;
  }

  async function loadPortal() {
    await restoreSession();
    const userId = session.user.id;
    const [profiles, visibleCourses, visibleModules, visibleLessons, ownProgress] = await Promise.all([
      rest(`student_profiles?id=eq.${encodeURIComponent(userId)}&select=*`),
      rest("courses?select=*&order=created_at.asc"),
      rest("course_modules?select=*&order=position.asc,created_at.asc"),
      rest("lessons?select=*&order=position.asc,created_at.asc"),
      rest(`lesson_progress?student_id=eq.${encodeURIComponent(userId)}&select=*`),
    ]);
    profile = profiles[0];
    if (!profile || profile.status !== "active") throw new Error("บัญชีนักเรียนถูกระงับหรือไม่มีสิทธิ์ใช้งาน");
    courses = visibleCourses;
    modules = visibleModules;
    lessons = visibleLessons;
    progress = ownProgress;
    currentCourseId = courses[0]?.id || "";
    currentLessonId = firstLessonId(currentCourseId);
    renderPortal();
    app.hidden = false;
  }

  function firstLessonId(courseId) {
    const moduleIds = new Set(modules.filter((item) => item.course_id === courseId).map((item) => item.id));
    const courseLessons = lessons.filter((item) => moduleIds.has(item.module_id));
    return courseLessons.find((item) => !progress.some((record) => record.lesson_id === item.id && record.completed))?.id || courseLessons[0]?.id || "";
  }

  function renderPortal() {
    document.querySelector("[data-student-name]").textContent = profile.full_name;
    document.querySelector("[data-student-code]").textContent = `${profile.student_code} · ${profile.email}`;
    courseSelect.innerHTML = courses.map((course) => `<option value="${course.id}">${escapeHtml(course.title)}</option>`).join("");
    courseSelect.value = currentCourseId;
    empty.hidden = courses.length > 0;
    lessonView.hidden = !currentLessonId;
    if (!courses.length) {
      navigation.innerHTML = "";
      document.querySelector("[data-student-course-title]").textContent = "บทเรียนของฉัน";
      updateProgress();
      return;
    }
    const course = courses.find((item) => item.id === currentCourseId);
    document.querySelector("[data-student-course-title]").textContent = course?.title || "บทเรียนของฉัน";
    renderNavigation();
    renderLesson();
    updateProgress();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function courseLessons() {
    const courseModules = modules.filter((item) => item.course_id === currentCourseId);
    const moduleOrder = new Map(courseModules.map((item, index) => [item.id, index]));
    return lessons
      .filter((item) => moduleOrder.has(item.module_id))
      .sort((a, b) => moduleOrder.get(a.module_id) - moduleOrder.get(b.module_id) || a.position - b.position);
  }

  function isComplete(lessonId) {
    return progress.some((record) => record.lesson_id === lessonId && record.completed);
  }

  function renderNavigation() {
    const courseModules = modules.filter((module) => module.course_id === currentCourseId);
    navigation.innerHTML = courseModules.map((module) => `<section><h3>${escapeHtml(module.position)}. ${escapeHtml(module.title)}</h3>${lessons.filter((lesson) => lesson.module_id === module.id).map((lesson) => `<button class="${lesson.id === currentLessonId ? "is-active " : ""}${isComplete(lesson.id) ? "is-complete" : ""}" type="button" data-student-lesson-id="${lesson.id}"><i>${isComplete(lesson.id) ? "✓" : escapeHtml(lesson.position)}</i><span>${escapeHtml(lesson.title)}</span></button>`).join("")}</section>`).join("");
  }

  function renderLesson() {
    const lesson = lessons.find((item) => item.id === currentLessonId);
    if (!lesson) { lessonView.hidden = true; return; }
    lessonView.hidden = false;
    const module = modules.find((item) => item.id === lesson.module_id);
    document.querySelector("[data-student-module-label]").textContent = module?.title || "บทเรียน";
    document.querySelector("[data-student-lesson-title]").textContent = lesson.title;
    document.querySelector("[data-student-lesson-summary]").textContent = lesson.summary || "";
    document.querySelector("[data-student-lesson-content]").textContent = lesson.lesson_content || "ยังไม่มีเนื้อหาประกอบ";
    const video = document.querySelector("[data-student-video]");
    const frame = document.querySelector("[data-student-video-frame]");
    video.hidden = !lesson.youtube_video_id;
    frame.src = lesson.youtube_video_id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(lesson.youtube_video_id)}?rel=0&modestbranding=1` : "about:blank";
    document.querySelector("[data-student-watermark]").textContent = `${profile.student_code} · ${profile.email}`;
    const ordered = courseLessons();
    const index = ordered.findIndex((item) => item.id === lesson.id);
    document.querySelector("[data-student-previous]").disabled = index <= 0;
    document.querySelector("[data-student-next]").disabled = index < 0 || index >= ordered.length - 1;
    const completeButton = document.querySelector("[data-student-complete]");
    completeButton.textContent = isComplete(lesson.id) ? "เรียนจบแล้ว ✓" : "ทำเครื่องหมายว่าเรียนจบ";
  }

  function updateProgress() {
    const items = courseLessons();
    const completed = items.filter((lesson) => isComplete(lesson.id)).length;
    const percent = items.length ? Math.round(completed / items.length * 100) : 0;
    document.querySelector("[data-student-progress-label]").textContent = `${percent}%`;
    document.querySelector("[data-student-progress-bar]").style.width = `${percent}%`;
  }

  async function toggleComplete() {
    const completed = !isComplete(currentLessonId);
    const rows = await rest("lesson_progress?on_conflict=student_id,lesson_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ student_id: session.user.id, lesson_id: currentLessonId, completed, completed_at: completed ? new Date().toISOString() : null }) });
    progress = progress.filter((item) => item.lesson_id !== currentLessonId).concat(rows || []);
    renderNavigation();
    renderLesson();
    updateProgress();
  }

  function moveLesson(direction) {
    const ordered = courseLessons();
    const index = ordered.findIndex((item) => item.id === currentLessonId);
    const next = ordered[index + direction];
    if (next) { currentLessonId = next.id; renderPortal(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }

  courseSelect.addEventListener("change", () => { currentCourseId = courseSelect.value; currentLessonId = firstLessonId(currentCourseId); renderPortal(); });
  navigation.addEventListener("click", (event) => { const button = event.target.closest("[data-student-lesson-id]"); if (button) { currentLessonId = button.dataset.studentLessonId; renderPortal(); } });
  document.querySelector("[data-student-complete]").addEventListener("click", () => toggleComplete().catch((error) => { message.textContent = error.message; }));
  document.querySelector("[data-student-previous]").addEventListener("click", () => moveLesson(-1));
  document.querySelector("[data-student-next]").addEventListener("click", () => moveLesson(1));
  document.querySelector("[data-student-video]").addEventListener("contextmenu", (event) => event.preventDefault());
  document.querySelector("[data-student-password]").addEventListener("click", () => { passwordForm.reset(); passwordMessage.textContent = ""; passwordDialog.showModal(); });
  document.querySelector("[data-student-password-cancel]").addEventListener("click", () => passwordDialog.close());
  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = passwordForm.elements.password.value;
    if (password !== passwordForm.elements.confirmPassword.value) { passwordMessage.textContent = "รหัสผ่านทั้งสองช่องไม่ตรงกัน"; return; }
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, { method: "PUT", headers: { apikey: supabaseKey, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { passwordMessage.textContent = result.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ"; return; }
    passwordDialog.close();
    message.textContent = "เปลี่ยนรหัสผ่านแล้ว";
  });
  document.querySelector("[data-student-logout]").addEventListener("click", async () => {
    if (session?.access_token) await fetch(`${supabaseUrl}/auth/v1/logout`, { method: "POST", headers: { apikey: supabaseKey, Authorization: `Bearer ${session.access_token}` } }).catch(() => null);
    sessionStorage.removeItem(sessionKey);
    location.href = "./student-login.html";
  });

  setInterval(() => {
    const watermark = document.querySelector("[data-student-watermark]");
    if (!watermark) return;
    watermark.style.top = `${8 + Math.floor(Math.random() * 72)}%`;
    watermark.style.left = `${5 + Math.floor(Math.random() * 60)}%`;
  }, 12000);

  loadPortal().catch((error) => {
    sessionStorage.removeItem(sessionKey);
    alert(error.message);
    location.href = "./student-login.html";
  });
})();
