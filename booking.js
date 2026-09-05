const packages = {
  "online-course": { name: "ONLINE COURSE", detail: "เรียนด้วยตัวเอง เข้าถึงคอร์สได้ตลอดเวลา", format: "เรียนด้วยตัวเอง", duration: "เข้าเรียนได้ตลอด 24 ชม.", price: 990, needsSlot: false },
  "live-online": { name: "PRIVATE LIVE ONLINE", detail: "เรียนสด 4 ชั่วโมง ผ่าน Meet หรือ Zoom", format: "Private 1:1 ออนไลน์", duration: "4 ชั่วโมง", price: 2999, needsSlot: true, type: "live" },
  solo: { name: "SOLO", detail: "Private Workshop 6 ชั่วโมง เลือกสถานที่ได้", format: "Private Workshop 1 คน", duration: "6 ชั่วโมง", price: 3999, needsSlot: true, type: "workshop" },
  buddy: { name: "BUDDY", detail: "Private Workshop 6 ชั่วโมง สำหรับ 2 คน", format: "Private Workshop 2 คน", duration: "6 ชั่วโมง", price: 5999, needsSlot: true, type: "workshop" },
};

const form = document.querySelector("#booking-form");
const packageInputs = [...document.querySelectorAll('input[name="package"]')];
const scheduleFields = document.querySelector("[data-schedule-fields]");
const scheduleHelp = document.querySelector("[data-schedule-help]");
const onlineNotice = document.querySelector("[data-online-notice]");
const buddyField = document.querySelector("[data-buddy-field]");
const slotDays = document.querySelector("[data-slot-days]");
const slotTimes = document.querySelector("[data-slot-times]");
const slotIdInput = document.querySelector("#course-slot-id");
const workshopLocation = document.querySelector("[data-workshop-location]");
const workshopLocationSelect = document.querySelector("#workshop-location");
const weekLabel = document.querySelector("[data-slot-week-label]");
const previousWeek = document.querySelector("[data-slot-previous]");
const nextWeek = document.querySelector("[data-slot-next]");
const status = document.querySelector("#booking-status");
const payButton = document.querySelector(".booking-pay");
let courseSlots = [];
let selectedDate = "";
let selectedSlot = null;
let weekStart = startOfDay(new Date());
let weekDirection = 0;

function startOfDay(value) { const date = new Date(value); date.setHours(0, 0, 0, 0); return date; }
function dateKey(date) { return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-"); }
function weekDates() { return Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(weekStart.getDate() + index); return date; }); }
const money = (amount) => new Intl.NumberFormat("th-TH").format(amount) + " บาท";
const thaiDate = (value) => new Intl.DateTimeFormat("th-TH", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`));
const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);

function selectedPackageCode() { return packageInputs.find((input) => input.checked)?.value || ""; }
function selectedPackage() { return packages[selectedPackageCode()] || null; }
function isAvailable(slot) { return slot.is_open && Number(slot.reserved_count) < Number(slot.capacity); }

function updateSummaryDetails() {
  const selected = selectedPackage();
  const isWorkshop = selected?.type === "workshop";
  document.querySelector("[data-summary-slot-row]").hidden = !selected?.needsSlot;
  document.querySelector("[data-summary-location-row]").hidden = !selected?.needsSlot;
  document.querySelector("[data-summary-slot]").textContent = selectedSlot ? (isWorkshop ? `${thaiDate(selectedSlot.course_date)} · 6 ชั่วโมง` : `${thaiDate(selectedSlot.course_date)} · ${selectedSlot.start_time.slice(0, 5)} น. · 4 ชั่วโมง`) : "ยังไม่ได้เลือก";
  document.querySelector("[data-summary-location]").textContent = isWorkshop ? workshopLocationSelect.value || "ยังไม่ได้เลือก" : selectedSlot?.location || "ยังไม่ได้เลือก";
}

function renderSlots(direction = weekDirection) {
  const selected = selectedPackage();
  const isWorkshop = selected?.type === "workshop";
  const today = startOfDay(new Date());
  previousWeek.disabled = weekStart <= today;
  weekLabel.textContent = `${new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(weekStart)} – ${new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(weekDates()[6])}`;
  slotDays.innerHTML = weekDates().map((date) => {
    const key = dateKey(date);
    const slots = courseSlots.filter((slot) => slot.course_date === key);
    const hasOpenSlot = slots.some(isAvailable);
    const hasBooking = slots.some((slot) => Number(slot.reserved_count) > 0);
    const statusText = !slots.length ? "ไม่เปิดรอบ" : hasOpenSlot ? "ว่าง" : hasBooking ? "มีคนจองแล้ว" : "ปิดรับจอง";
    return `<button class="course-slot-day${selectedDate === key ? " is-selected" : ""}${hasOpenSlot ? "" : " is-unavailable"}" type="button" data-slot-date="${key}" ${hasOpenSlot ? "" : "disabled"}><strong>${new Intl.DateTimeFormat("th-TH", { weekday: "short" }).format(date)}</strong><span>${date.getDate()}</span><small>${statusText}</small></button>`;
  }).join("");
  const daySlots = courseSlots.filter((slot) => slot.course_date === selectedDate);
  slotTimes.hidden = !selectedDate || isWorkshop;
  if (isWorkshop && selectedDate) {
    const availableSlot = daySlots.find(isAvailable) || null;
    selectedSlot = availableSlot;
    slotIdInput.value = availableSlot?.id || "";
    slotTimes.innerHTML = "";
  } else if (selectedDate) {
    slotTimes.innerHTML = `<strong>เลือกรอบเวลา · ${thaiDate(selectedDate)} · 4 ชั่วโมง</strong><div>${daySlots.map((slot) => `<button type="button" class="course-slot-time${selectedSlot?.id === slot.id ? " is-selected" : ""}${isAvailable(slot) ? "" : " is-unavailable"}" data-slot-id="${slot.id}" ${isAvailable(slot) ? "" : "disabled"}>${slot.start_time.slice(0, 5)} น.<small>${isAvailable(slot) ? "Google Meet / Zoom" : "เต็ม"}</small></button>`).join("") || "<p>วันนี้ไม่มีรอบเรียนที่เปิดรับ</p>"}</div>`;
  } else {
    slotTimes.innerHTML = "";
  }
  if (direction) {
    const animationClass = direction > 0 ? "is-sliding-next" : "is-sliding-previous";
    [slotDays, slotTimes, weekLabel].forEach((element) => {
      element.classList.remove("is-sliding-next", "is-sliding-previous");
      void element.offsetWidth;
      element.classList.add(animationClass);
      element.addEventListener("animationend", () => element.classList.remove(animationClass), { once: true });
    });
  }
  updateSummaryDetails();
}

async function loadSlots(direction = 0) {
  const packageCode = selectedPackageCode();
  if (!packages[packageCode]?.needsSlot) return;
  const endpoint = document.body.dataset.courseSlotsEndpoint;
  if (!endpoint) return;
  weekDirection = direction;
  selectedDate = "";
  selectedSlot = null;
  slotIdInput.value = "";
  slotDays.classList.toggle("is-loading", Boolean(direction));
  slotTimes.hidden = true;
  try {
    const response = await fetch(`${endpoint}?package=${encodeURIComponent(packageCode)}&week=${encodeURIComponent(dateKey(weekStart))}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "ไม่สามารถโหลดรอบเรียนได้");
    courseSlots = Array.isArray(result.slots) ? result.slots : [];
    slotDays.classList.remove("is-loading");
    renderSlots(direction);
  } catch (error) {
    slotDays.classList.remove("is-loading");
    slotDays.innerHTML = `<p class="course-slot-loading">${escapeHtml(error instanceof Error ? error.message : "ไม่สามารถโหลดรอบเรียนได้")}</p>`;
  }
  updateSummaryDetails();
}

function updateBookingPage() {
  const selected = selectedPackage();
  if (!selected) return;
  document.querySelector("[data-summary-name]").textContent = selected.name;
  document.querySelector("[data-summary-detail]").textContent = selected.detail;
  document.querySelector("[data-summary-format]").textContent = selected.format;
  document.querySelector("[data-summary-duration]").textContent = selected.duration;
  document.querySelector("[data-summary-total]").textContent = money(selected.price);
  scheduleFields.hidden = !selected.needsSlot;
  onlineNotice.hidden = selected.needsSlot;
  workshopLocation.hidden = selected.type !== "workshop";
  workshopLocationSelect.required = selected.type === "workshop";
  slotIdInput.required = selected.needsSlot;
  buddyField.hidden = selected.name !== "BUDDY";
  document.querySelector("#buddy-name").required = selected.name === "BUDDY";
  scheduleHelp.textContent = selected.type === "workshop" ? "เลือกวันเรียนได้อิสระ วันละ 6 ชั่วโมง เริ่มประมาณ 10:00 น. หรือตามตกลง" : selected.needsSlot ? "เลือกวันและรอบเวลาจากตารางรายสัปดาห์" : "คอร์สนี้ไม่ต้องเลือกรอบเรียน";
  updateSummaryDetails();
  if (selected.needsSlot) loadSlots();
}

packageInputs.forEach((input) => input.addEventListener("change", updateBookingPage));
previousWeek.addEventListener("click", () => { weekStart.setDate(weekStart.getDate() - 7); loadSlots(-1); });
nextWeek.addEventListener("click", () => { weekStart.setDate(weekStart.getDate() + 7); loadSlots(1); });
slotDays.addEventListener("click", (event) => {
  const button = event.target.closest("[data-slot-date]");
  if (!button) return;
  selectedDate = button.dataset.slotDate;
  selectedSlot = null;
  slotIdInput.value = "";
  renderSlots();
});
slotTimes.addEventListener("click", (event) => {
  const button = event.target.closest("[data-slot-id]");
  if (!button) return;
  selectedSlot = courseSlots.find((slot) => slot.id === button.dataset.slotId) || null;
  slotIdInput.value = selectedSlot?.id || "";
  renderSlots();
});
workshopLocationSelect.addEventListener("change", updateSummaryDetails);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "";
  if (!form.reportValidity()) return;
  const endpoint = document.body.dataset.checkoutEndpoint;
  if (!endpoint) { status.textContent = "ยังไม่ได้เชื่อมระบบชำระเงิน"; return; }
  payButton.disabled = true;
  payButton.textContent = "กำลังเปิด Stripe Checkout...";
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const result = await response.json();
    if (!response.ok || !result.url) throw new Error(result.error || "ยังสร้างรายการชำระเงินไม่สำเร็จ");
    window.location.assign(result.url);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "ยังสร้างรายการชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    payButton.disabled = false;
    payButton.textContent = "ชำระเงินด้วย Stripe";
  }
});

const preselected = new URLSearchParams(window.location.search).get("package");
const initialInput = packageInputs.find((input) => input.value === preselected) || packageInputs.find((input) => input.value === "buddy");
initialInput.checked = true;
updateBookingPage();
