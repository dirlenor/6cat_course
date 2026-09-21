(() => {
  const admin = window.sixCatAdmin;
  if (!admin) return;

  const weekGrid = document.querySelector("[data-content-week]");
  const message = document.querySelector("[data-content-message]");
  const weekLabel = document.querySelector("[data-content-week-label]");
  const weekSummary = document.querySelector("[data-content-week-summary]");
  const weeklyNotes = document.querySelector("[data-content-weekly-notes]");
  const editor = document.querySelector("[data-content-editor]");
  const editorForm = document.querySelector("[data-content-form]");
  const editorMessage = document.querySelector("[data-content-form-message]");
  const imagePreview = document.querySelector("[data-content-image-preview]");
  const captionPreview = document.querySelector("[data-content-caption-preview]");
  const settingsDialog = document.querySelector("[data-content-settings-dialog]");
  const settingsForm = document.querySelector("[data-content-settings-form]");
  const settingsMessage = document.querySelector("[data-content-settings-message]");
  const typeLabels = {
    education: "ให้ความรู้",
    inspiration: "ตัวอย่าง / แรงบันดาลใจ",
    behind_the_scenes: "เบื้องหลัง",
    promotion: "แนะนำคอร์ส",
    engagement: "ชวนพูดคุย",
  };
  const statusLabels = {
    draft: "รอตรวจ",
    scheduled: "ตั้งเวลาแล้ว",
    publishing: "กำลังโพสต์",
    published: "โพสต์แล้ว",
    failed: "ไม่สำเร็จ",
  };

  let contentWeekStart = mondayOf(new Date());
  let contentSettings = null;
  let contentPosts = [];
  let editingPost = null;
  let editingImagePath = null;
  let previewObjectUrl = null;
  let loadedOnce = false;

  function localDate(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function mondayOf(value) {
    const date = new Date(value);
    date.setHours(12, 0, 0, 0);
    const offset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - offset);
    return date;
  }

  function parseLocalDate(value) {
    return new Date(`${value}T12:00:00`);
  }

  function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function currentUserId() {
    return admin.getSession()?.user?.id || null;
  }

  function authHeaders(extra = {}) {
    const token = admin.getAccessToken();
    if (!token) throw new Error("กรุณาเข้าสู่ระบบใหม่");
    return { apikey: admin.getSupabaseKey(), Authorization: `Bearer ${token}`, ...extra };
  }

  async function readJson(response, fallback) {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || result.error || fallback);
    return result;
  }

  async function rest(path, options = {}) {
    const response = await fetch(`${admin.getSupabaseUrl()}/rest/v1/${path}`, {
      ...options,
      headers: authHeaders({ "Content-Type": "application/json", ...(options.headers || {}) }),
    });
    return readJson(response, "เชื่อมต่อฐานข้อมูลไม่สำเร็จ");
  }

  async function invoke(functionName, payload) {
    const response = await fetch(`${admin.getSupabaseUrl()}/functions/v1/${functionName}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    return readJson(response, "เรียกใช้งานระบบไม่สำเร็จ");
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function scheduledTime(post) {
    return new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" }).format(new Date(post.scheduled_at));
  }

  function publishingNeedsReview(post) {
    return post.status === "publishing" && Date.now() - new Date(post.updated_at).getTime() >= 5 * 60 * 1000;
  }

  function weekDates() {
    return Array.from({ length: 7 }, (_, index) => addDays(contentWeekStart, index));
  }

  async function loadContentSettings() {
    const rows = await rest("content_settings?id=eq.1&select=*");
    contentSettings = rows[0] || null;
    if (!contentSettings) throw new Error("ไม่พบการตั้งค่าคอนเทนต์ กรุณารัน migration ล่าสุด");
    return contentSettings;
  }

  async function loadContentWeek() {
    message.textContent = "กำลังโหลดแผนคอนเทนต์...";
    try {
      if (!contentSettings) await loadContentSettings();
      const start = localDate(contentWeekStart);
      const end = localDate(addDays(contentWeekStart, 6));
      contentPosts = await rest(`content_posts?planned_date=gte.${start}&planned_date=lte.${end}&select=*&order=scheduled_at.asc`);
      renderContentWeek();
      message.textContent = contentPosts.length ? "" : "สัปดาห์นี้ยังไม่มีแผน กด “สร้างตารางเปล่า” แล้วใช้ “คัดลอกโจทย์ไป ChatGPT” เพื่อเริ่มต้น";
      loadedOnce = true;
    } catch (error) {
      message.textContent = error.message;
      weekGrid.innerHTML = "";
    }
  }

  function renderContentWeek() {
    const dates = weekDates();
    const start = dates[0];
    const end = dates[6];
    weekLabel.textContent = `${new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(start)} – ${new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(end)}`;
    const approved = contentPosts.filter((post) => post.status === "scheduled").length;
    weekSummary.textContent = `${contentPosts.length} โพสต์ · อนุมัติและตั้งเวลาแล้ว ${approved}`;
    const slots = Math.max(Number(contentSettings?.posts_per_day || 1), ...contentPosts.map((post) => Number(post.slot_number || 1)));
    weekGrid.innerHTML = dates.map((date) => {
      const dateValue = localDate(date);
      const dayPosts = contentPosts.filter((post) => post.planned_date === dateValue);
      const postHtml = Array.from({ length: slots }, (_, index) => {
        const post = dayPosts.find((item) => Number(item.slot_number) === index + 1);
        if (!post) return `<div class="content-post content-post--empty"><span>ยังไม่มีโพสต์รอบ ${index + 1}</span></div>`;
        const statusClass = ["scheduled", "published", "failed"].includes(post.status) ? ` content-post--${post.status}` : "";
        const imageState = post.image_path ? "มีรูป" : "ยังไม่มีรูป";
        const approveButton = post.status === "draft"
          ? `<button type="button" class="content-approve" data-content-approve="${post.id}">อนุมัติ</button>`
          : ["scheduled", "failed"].includes(post.status)
            ? `<button type="button" class="content-unapprove" data-content-unapprove="${post.id}">ยกเลิกอนุมัติ</button>`
            : "";
        const publishButton = ["scheduled", "failed"].includes(post.status)
          ? `<button type="button" data-content-publish="${post.id}">${post.status === "failed" ? "ลองโพสต์ใหม่" : "โพสต์ตอนนี้"}</button>`
          : "";
        const reconcileButtons = publishingNeedsReview(post)
          ? `<button type="button" data-content-resolve-published="${post.id}">ตรวจแล้วว่าโพสต์สำเร็จ</button><button type="button" data-content-resolve-draft="${post.id}">ตรวจแล้วว่ายังไม่โพสต์</button>`
          : post.status === "publishing" ? `<span class="content-post__waiting">รอตรวจผลจาก Facebook ก่อน</span>` : "";
        const externalLink = post.external_post_url ? `<a href="${escapeHtml(post.external_post_url)}" target="_blank" rel="noreferrer">เปิด Facebook</a>` : "";
        return `<article class="content-post${statusClass}">
          <div class="content-post__top"><span class="content-post__time">${escapeHtml(scheduledTime(post))} น.</span><span class="content-post__status content-post__status--${escapeHtml(post.status)}">${escapeHtml(statusLabels[post.status] || post.status)}</span></div>
          <h3>${escapeHtml(post.title)}</h3>
          <div class="content-post__meta"><span>${escapeHtml(typeLabels[post.content_type] || post.content_type)}</span><i></i><span>${imageState}</span></div>
          ${post.last_error ? `<p class="content-error">${escapeHtml(post.last_error)}</p>` : ""}
          <div class="content-post__actions">${post.status !== "publishing" && post.status !== "published" ? `<button type="button" data-content-edit="${post.id}">แก้ไข</button>` : ""}${approveButton}${publishButton}${reconcileButtons}${externalLink}</div>
        </article>`;
      }).join("");
      return `<section class="content-day"><div class="content-day__head"><strong>${new Intl.DateTimeFormat("th-TH", { weekday: "long" }).format(date)}</strong><span>${new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(date)}</span></div><div class="content-day__posts">${postHtml}</div></section>`;
    }).join("");

    document.querySelector("[data-content-total]").textContent = contentPosts.length;
    document.querySelector("[data-content-draft]").textContent = contentPosts.filter((post) => post.status === "draft").length;
    document.querySelector("[data-content-scheduled]").textContent = contentPosts.filter((post) => post.status === "scheduled").length;
    document.querySelector("[data-content-published]").textContent = contentPosts.filter((post) => post.status === "published").length;
  }

  async function createEmptyWeek() {
    if (!contentSettings) await loadContentSettings();
    const postsPerDay = Number(contentSettings.posts_per_day) === 2 ? 2 : 1;
    const times = [String(contentSettings.morning_time).slice(0, 5), String(contentSettings.evening_time).slice(0, 5)];
    const weekStartValue = localDate(contentWeekStart);
    const rows = weekDates().flatMap((date) => Array.from({ length: postsPerDay }, (_, index) => ({
      week_start: weekStartValue,
      planned_date: localDate(date),
      slot_number: index + 1,
      scheduled_at: new Date(`${localDate(date)}T${times[index]}:00+07:00`).toISOString(),
      title: "รอวางหัวข้อ",
      content_type: "education",
      objective: "",
      caption: "",
      cta: contentSettings.default_cta || "",
      image_brief: "",
      image_prompt: "",
      source: "manual",
      status: "draft",
      created_by: currentUserId(),
    })));
    await rest("content_posts?on_conflict=planned_date,slot_number", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(rows) });
    await loadContentWeek();
    message.textContent = "สร้างตารางเปล่าแล้ว สามารถเปิดแต่ละโพสต์เพื่อใส่เนื้อหาได้";
  }

  async function copyChatGptPrompt() {
    if (!contentSettings) await loadContentSettings();
    const postsPerDay = Number(contentSettings.posts_per_day) === 2 ? 2 : 1;
    const times = [String(contentSettings.morning_time).slice(0, 5), String(contentSettings.evening_time).slice(0, 5)];
    const slots = weekDates().flatMap((date) => Array.from({ length: postsPerDay }, (_, index) => `- ${localDate(date)} เวลา ${times[index]} น. (โพสต์ที่ ${index + 1})`));
    const prompt = `ช่วยวางแผนคอนเทนต์ Facebook ภาษาไทยสำหรับ ${contentSettings.brand_name} ตามรายการวันและเวลานี้\n${slots.join("\n")}\n\nกลุ่มเป้าหมาย: ${contentSettings.audience}\nโทนภาษา: ${contentSettings.brand_voice}\nข้อมูลธุรกิจที่ใช้ได้: ${contentSettings.business_context}\nหัวข้อหลัก: ${(contentSettings.content_pillars || []).join(", ")}\nCTA เริ่มต้น: ${contentSettings.default_cta}\nข้อห้าม: ${contentSettings.avoid_topics}\nโจทย์เพิ่มเติมสัปดาห์นี้: ${weeklyNotes.value.trim() || "ไม่มี"}\n\nสำหรับแต่ละโพสต์ ขอ: 1) หัวเรื่อง 2) ประเภทโพสต์ 3) แคปชัน 4) CTA 5) แนวทางทำรูป 6) Prompt สำหรับเจนรูป โดยอย่าแต่งราคา โปรโมชัน หรือผลลัพธ์เกินจริง`;
    try {
      if (!navigator.clipboard?.writeText || !window.isSecureContext) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(prompt);
      message.textContent = "คัดลอกโจทย์แล้ว วางใน ChatGPT ได้เลย แล้วนำคำตอบมากรอกในแต่ละโพสต์";
    } catch (_) {
      window.prompt("คัดลอกโจทย์นี้ไปวางใน ChatGPT", prompt);
      message.textContent = "เปิดโจทย์ให้คัดลอกแล้ว นำไปวางใน ChatGPT ได้เลย";
    }
  }

  async function signedImageUrl(path) {
    const encodedPath = String(path).split("/").map(encodeURIComponent).join("/");
    const response = await fetch(`${admin.getSupabaseUrl()}/storage/v1/object/sign/content-assets/${encodedPath}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ expiresIn: 3600 }),
    });
    const result = await readJson(response, "โหลดรูปไม่สำเร็จ");
    const signed = result.signedURL || result.signedUrl || "";
    return signed.startsWith("http") ? signed : `${admin.getSupabaseUrl()}/storage/v1${signed}`;
  }

  function clearPreviewObjectUrl() {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }

  function renderImagePreview(url = "") {
    imagePreview.innerHTML = url ? `<img src="${escapeHtml(url)}" alt="ตัวอย่างรูปโพสต์" />` : "<span>ยังไม่มีรูป</span>";
  }

  function updateCaptionPreview() {
    const caption = editorForm.elements.caption.value.trim();
    const cta = editorForm.elements.cta.value.trim();
    captionPreview.textContent = [caption, cta && !caption.includes(cta) ? cta : ""].filter(Boolean).join("\n\n") || "ยังไม่มีแคปชัน";
  }

  async function openEditor(post) {
    editingPost = post;
    editingImagePath = post.image_path || null;
    clearPreviewObjectUrl();
    editorMessage.textContent = "";
    editorForm.reset();
    editorForm.elements.postId.value = post.id;
    editorForm.elements.plannedDate.value = post.planned_date;
    editorForm.elements.plannedTime.value = scheduledTime(post);
    editorForm.elements.title.value = post.title || "";
    editorForm.elements.contentType.value = post.content_type || "education";
    editorForm.elements.objective.value = post.objective || "";
    editorForm.elements.caption.value = post.caption || "";
    editorForm.elements.cta.value = post.cta || "";
    editorForm.elements.imageBrief.value = post.image_brief || "";
    editorForm.elements.imagePrompt.value = post.image_prompt || "";
    editorForm.elements.imageRequired.checked = Boolean(post.image_required);
    renderImagePreview();
    if (editingImagePath) signedImageUrl(editingImagePath).then(renderImagePreview).catch(() => renderImagePreview());
    updateCaptionPreview();
    editor.showModal();
  }

  async function uploadImage(file) {
    if (!file) return editingImagePath;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("รองรับเฉพาะไฟล์ JPG, PNG และ WebP");
    if (file.size > 10 * 1024 * 1024) throw new Error("รูปต้องมีขนาดไม่เกิน 10MB");
    const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[file.type];
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;
    const response = await fetch(`${admin.getSupabaseUrl()}/storage/v1/object/content-assets/${path}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": file.type, "x-upsert": "false" }),
      body: file,
    });
    await readJson(response, "อัปโหลดรูปไม่สำเร็จ");
    return path;
  }

  async function updatePostIfCurrent(post, payload) {
    const rows = await rest(`content_posts?id=eq.${encodeURIComponent(post.id)}&status=eq.${encodeURIComponent(post.status)}&revision=eq.${encodeURIComponent(post.revision)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    if (!Array.isArray(rows) || rows.length !== 1) throw new Error("โพสต์นี้ถูกแก้ไขหรือเริ่มเผยแพร่จากหน้าจออื่นแล้ว กรุณาปิดหน้าต่างและโหลดใหม่");
    return rows[0];
  }

  async function savePost(event) {
    event.preventDefault();
    if (!editorForm.reportValidity() || !editingPost) return;
    const submitButton = editorForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    editorMessage.textContent = "กำลังบันทึก...";
    try {
      const plannedDate = editorForm.elements.plannedDate.value;
      const plannedTime = editorForm.elements.plannedTime.value;
      const file = editorForm.elements.contentImage.files[0];
      const imagePath = await uploadImage(file);
      const update = {
        week_start: localDate(mondayOf(parseLocalDate(plannedDate))),
        planned_date: plannedDate,
        scheduled_at: new Date(`${plannedDate}T${plannedTime}:00+07:00`).toISOString(),
        title: editorForm.elements.title.value.trim(),
        content_type: editorForm.elements.contentType.value,
        objective: editorForm.elements.objective.value.trim(),
        caption: editorForm.elements.caption.value.trim(),
        cta: editorForm.elements.cta.value.trim(),
        image_brief: editorForm.elements.imageBrief.value.trim(),
        image_prompt: editorForm.elements.imagePrompt.value.trim(),
        image_path: imagePath,
        image_required: editorForm.elements.imageRequired.checked,
        status: "draft",
        approved_at: null,
        approved_by: null,
        last_error: null,
        updated_at: new Date().toISOString(),
      };
      await updatePostIfCurrent(editingPost, update);
      editor.close();
      await loadContentWeek();
      message.textContent = editingPost.status === "draft" ? "บันทึกแบบร่างแล้ว" : "บันทึกแล้วและยกเลิกการอนุมัติเดิม กรุณาตรวจและอนุมัติใหม่";
    } catch (error) {
      editorMessage.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  }

  async function approvePost(post) {
    if (!post.caption.trim()) throw new Error("กรุณาใส่แคปชันก่อนอนุมัติ");
    if (post.image_required && !post.image_path) throw new Error("โพสต์นี้กำหนดว่าต้องมีรูป กรุณาอัปโหลดรูปก่อนอนุมัติ");
    if (new Date(post.scheduled_at).getTime() <= Date.now() && !window.confirm("เวลาที่ตั้งไว้ผ่านไปแล้ว โพสต์อาจถูกส่งทันทีเมื่อระบบอัตโนมัติทำงาน ต้องการอนุมัติต่อหรือไม่?")) return;
    await updatePostIfCurrent(post, { status: "scheduled", approved_at: new Date().toISOString(), approved_by: currentUserId(), last_error: null, updated_at: new Date().toISOString() });
    await loadContentWeek();
    message.textContent = "อนุมัติแล้ว ระบบจะโพสต์ตามเวลาที่กำหนด";
  }

  async function unapprovePost(post) {
    await updatePostIfCurrent(post, { status: "draft", approved_at: null, approved_by: null, last_error: null, updated_at: new Date().toISOString() });
    await loadContentWeek();
    message.textContent = "ยกเลิกการอนุมัติแล้ว โพสต์นี้จะยังไม่ถูกเผยแพร่";
  }

  async function publishNow(post) {
    if (!window.confirm(`ต้องการโพสต์ “${post.title}” ขึ้น Facebook ตอนนี้หรือไม่?`)) return;
    message.textContent = "กำลังส่งโพสต์ไปยัง Facebook...";
    let result;
    try {
      result = await invoke("publish-facebook-content", { postId: post.id });
    } finally {
      await loadContentWeek();
    }
    message.textContent = result.status === "published" ? "โพสต์ขึ้น Facebook Page สำเร็จ" : "ยังไม่ได้ส่งโพสต์ เนื่องจากสถานะถูกเปลี่ยนจากหน้าจออื่นแล้ว";
  }

  async function resolvePublishing(post, published) {
    if (!publishingNeedsReview(post)) throw new Error("กรุณารออย่างน้อย 5 นาทีหลังเริ่มโพสต์ เพื่อไม่ให้ชนกับงานที่กำลังทำอยู่");
    if (published) {
      if (!window.confirm("ยืนยันว่าตรวจหน้า Facebook แล้วและพบว่าโพสต์นี้เผยแพร่สำเร็จจริงหรือไม่?")) return;
      const externalPostUrl = window.prompt("วางลิงก์โพสต์ Facebook (เว้นว่างได้)", "")?.trim() || null;
      if (externalPostUrl) {
        const parsedUrl = new URL(externalPostUrl);
        if (parsedUrl.protocol !== "https:" || !/(^|\.)facebook\.com$/i.test(parsedUrl.hostname)) throw new Error("ลิงก์โพสต์ต้องเป็น https://...facebook.com เท่านั้น");
      }
      const rows = await rest("rpc/reconcile_content_post", {
        method: "POST",
        body: JSON.stringify({ p_post_id: post.id, p_revision: post.revision, p_published: true, p_external_post_url: externalPostUrl }),
      });
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error("ยืนยันสถานะโพสต์ไม่สำเร็จ กรุณาโหลดใหม่");
      await loadContentWeek();
      message.textContent = "บันทึกว่าโพสต์นี้เผยแพร่สำเร็จแล้ว";
      return;
    }
    if (!window.confirm("ยืนยันว่าตรวจหน้า Facebook แล้วและยังไม่มีโพสต์นี้จริงหรือไม่? ระบบจะส่งกลับไปเป็นแบบร่างและต้องอนุมัติใหม่")) return;
    const rows = await rest("rpc/reconcile_content_post", {
      method: "POST",
      body: JSON.stringify({ p_post_id: post.id, p_revision: post.revision, p_published: false, p_external_post_url: null }),
    });
    if (!Array.isArray(rows) || rows.length !== 1) throw new Error("ยืนยันสถานะโพสต์ไม่สำเร็จ กรุณาโหลดใหม่");
    await loadContentWeek();
    message.textContent = "นำโพสต์กลับเป็นแบบร่างแล้ว กรุณาตรวจและอนุมัติใหม่ก่อนเผยแพร่";
  }

  function fillSettingsForm() {
    settingsMessage.textContent = "";
    settingsForm.elements.brandName.value = contentSettings.brand_name || "";
    settingsForm.elements.postsPerDay.value = contentSettings.posts_per_day || 1;
    settingsForm.elements.morningTime.value = String(contentSettings.morning_time).slice(0, 5);
    settingsForm.elements.eveningTime.value = String(contentSettings.evening_time).slice(0, 5);
    settingsForm.elements.audience.value = contentSettings.audience || "";
    settingsForm.elements.brandVoice.value = contentSettings.brand_voice || "";
    settingsForm.elements.businessContext.value = contentSettings.business_context || "";
    settingsForm.elements.contentPillars.value = (contentSettings.content_pillars || []).join("\n");
    settingsForm.elements.defaultCta.value = contentSettings.default_cta || "";
    settingsForm.elements.avoidTopics.value = contentSettings.avoid_topics || "";
    settingsForm.elements.facebookPageId.value = contentSettings.facebook_page_id || "";
    settingsForm.elements.facebookPageName.value = contentSettings.facebook_page_name || "";
  }

  async function openSettings() {
    try {
      if (!contentSettings) await loadContentSettings();
      fillSettingsForm();
      settingsDialog.showModal();
    } catch (error) {
      message.textContent = error.message;
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    if (!settingsForm.reportValidity()) return;
    const submitButton = settingsForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    settingsMessage.textContent = "กำลังบันทึก...";
    try {
      const payload = {
        brand_name: settingsForm.elements.brandName.value.trim(),
        posts_per_day: Number(settingsForm.elements.postsPerDay.value),
        morning_time: settingsForm.elements.morningTime.value,
        evening_time: settingsForm.elements.eveningTime.value,
        audience: settingsForm.elements.audience.value.trim(),
        brand_voice: settingsForm.elements.brandVoice.value.trim(),
        business_context: settingsForm.elements.businessContext.value.trim(),
        content_pillars: settingsForm.elements.contentPillars.value.split("\n").map((value) => value.trim()).filter(Boolean),
        default_cta: settingsForm.elements.defaultCta.value.trim(),
        avoid_topics: settingsForm.elements.avoidTopics.value.trim(),
        facebook_page_id: settingsForm.elements.facebookPageId.value.trim() || null,
        facebook_page_name: settingsForm.elements.facebookPageName.value.trim() || null,
        updated_at: new Date().toISOString(),
      };
      await rest("content_settings?id=eq.1", { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) });
      contentSettings = { ...contentSettings, ...payload };
      settingsDialog.close();
      renderContentWeek();
      message.textContent = "บันทึกการตั้งค่าคอนเทนต์แล้ว";
    } catch (error) {
      settingsMessage.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  }

  document.querySelector('[data-dashboard-tab="content"]').addEventListener("click", () => { if (!loadedOnce) loadContentWeek(); });
  document.querySelector("[data-content-previous]").addEventListener("click", () => { contentWeekStart = addDays(contentWeekStart, -7); weeklyNotes.value = ""; loadContentWeek(); });
  document.querySelector("[data-content-next]").addEventListener("click", () => { contentWeekStart = addDays(contentWeekStart, 7); weeklyNotes.value = ""; loadContentWeek(); });
  document.querySelector("[data-content-today]").addEventListener("click", () => { contentWeekStart = mondayOf(new Date()); weeklyNotes.value = ""; loadContentWeek(); });
  document.querySelector("[data-content-create-empty]").addEventListener("click", () => createEmptyWeek().catch((error) => { message.textContent = error.message; }));
  document.querySelector("[data-content-copy-prompt]").addEventListener("click", () => copyChatGptPrompt().catch((error) => { message.textContent = error.message; }));
  document.querySelector("[data-content-settings]").addEventListener("click", openSettings);
  weekGrid.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-content-edit], [data-content-approve], [data-content-unapprove], [data-content-publish], [data-content-resolve-published], [data-content-resolve-draft]");
    if (!action) return;
    const id = action.dataset.contentEdit || action.dataset.contentApprove || action.dataset.contentUnapprove || action.dataset.contentPublish || action.dataset.contentResolvePublished || action.dataset.contentResolveDraft;
    const post = contentPosts.find((item) => item.id === id);
    if (!post) return;
    action.disabled = true;
    try {
      if (action.dataset.contentEdit) await openEditor(post);
      else if (action.dataset.contentApprove) await approvePost(post);
      else if (action.dataset.contentUnapprove) await unapprovePost(post);
      else if (action.dataset.contentPublish) await publishNow(post);
      else await resolvePublishing(post, Boolean(action.dataset.contentResolvePublished));
    } catch (error) {
      message.textContent = error.message;
    } finally {
      action.disabled = false;
    }
  });
  editorForm.addEventListener("submit", savePost);
  editorForm.elements.caption.addEventListener("input", updateCaptionPreview);
  editorForm.elements.cta.addEventListener("input", updateCaptionPreview);
  editorForm.elements.contentImage.addEventListener("change", () => {
    clearPreviewObjectUrl();
    const file = editorForm.elements.contentImage.files[0];
    if (!file) return;
    previewObjectUrl = URL.createObjectURL(file);
    renderImagePreview(previewObjectUrl);
  });
  document.querySelector("[data-content-remove-image]").addEventListener("click", () => { editingImagePath = null; editorForm.elements.contentImage.value = ""; clearPreviewObjectUrl(); renderImagePreview(); });
  ["[data-content-close]", "[data-content-cancel]"].forEach((selector) => document.querySelector(selector).addEventListener("click", () => editor.close()));
  editor.addEventListener("close", clearPreviewObjectUrl);
  settingsForm.addEventListener("submit", saveSettings);
  ["[data-content-settings-close]", "[data-content-settings-cancel]"].forEach((selector) => document.querySelector(selector).addEventListener("click", () => settingsDialog.close()));
})();
