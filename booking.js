const packages = {
  "online-course": { name: "ONLINE COURSE", detail: "เรียนด้วยตัวเอง เข้าถึงคอร์สได้ตลอดเวลา", format: "เรียนด้วยตัวเอง", duration: "เข้าเรียนได้ตลอด 24 ชม.", price: 990, needsSlot: false, needsLocation: false },
  "live-online": { name: "PRIVATE LIVE ONLINE", detail: "เรียนสด 4 ชั่วโมง ผ่าน Meet หรือ Zoom", format: "Private 1:1 ออนไลน์", duration: "4 ชั่วโมง", price: 2999, needsSlot: true, needsLocation: false },
  solo: { name: "SOLO", detail: "Private 1:1 เต็มวัน 6 ชั่วโมง", format: "Private Workshop 1 คน", duration: "6 ชั่วโมง", price: 3999, needsSlot: true, needsLocation: true },
  buddy: { name: "BUDDY", detail: "มา 2 คน เรียนและทำเว็บไซต์ไปด้วยกัน", format: "Private Workshop 2 คน", duration: "6 ชั่วโมง", price: 5999, needsSlot: true, needsLocation: true },
};

const form = document.querySelector("#booking-form");
const packageInputs = [...document.querySelectorAll('input[name="package"]')];
const slot = document.querySelector("#slot");
const locationField = document.querySelector("[data-location-field]");
const locationSelect = document.querySelector("#location");
const scheduleFields = document.querySelector("[data-schedule-fields]");
const scheduleHelp = document.querySelector("[data-schedule-help]");
const onlineNotice = document.querySelector("[data-online-notice]");
const buddyField = document.querySelector("[data-buddy-field]");
const status = document.querySelector("#booking-status");
const payButton = document.querySelector(".booking-pay");

function money(amount) {
  return new Intl.NumberFormat("th-TH").format(amount) + " บาท";
}

function selectedPackage() {
  return packages[packageInputs.find((input) => input.checked)?.value] ?? null;
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
  locationField.hidden = !selected.needsLocation;
  locationSelect.required = selected.needsLocation;
  slot.required = selected.needsSlot;
  buddyField.hidden = selected.name !== "BUDDY";
  document.querySelector("#buddy-name").required = selected.name === "BUDDY";
  scheduleHelp.textContent = selected.needsSlot
    ? "เลือกรอบที่คุณสะดวกจากรอบว่างที่เปิดรับ"
    : "คอร์สนี้ไม่ต้องเลือกรอบเรียน";

  updateSummaryDetails();
}

function updateSummaryDetails() {
  const selected = selectedPackage();
  document.querySelector("[data-summary-slot-row]").hidden = !selected?.needsSlot;
  document.querySelector("[data-summary-location-row]").hidden = !selected?.needsLocation;
  document.querySelector("[data-summary-slot]").textContent = slot.selectedOptions[0]?.textContent ?? "ยังไม่ได้เลือก";
  document.querySelector("[data-summary-location]").textContent = locationSelect.selectedOptions[0]?.textContent ?? "ยังไม่ได้เลือก";
}

packageInputs.forEach((input) => input.addEventListener("change", updateBookingPage));
slot.addEventListener("change", updateSummaryDetails);
locationSelect.addEventListener("change", updateSummaryDetails);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "";
  if (!form.reportValidity()) return;

  const endpoint = document.body.dataset.checkoutEndpoint;
  if (!endpoint) {
    status.textContent = "หน้านี้พร้อมสำหรับ Stripe Checkout แล้ว แต่ยังต้องเชื่อม Supabase, Stripe และรอบเรียนจริงก่อนเปิดรับชำระเงิน";
    return;
  }

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
const initialInput = packageInputs.find((input) => input.value === preselected) ?? packageInputs.find((input) => input.value === "buddy");
initialInput.checked = true;
updateBookingPage();
