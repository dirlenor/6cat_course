(() => {
  const supabaseUrl = "https://qmayxfnadhqzilwrtepx.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtYXl4Zm5hZGhxemlsd3J0ZXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MDExNTUsImV4cCI6MjEwNDA3NzE1NX0.bqjBAT40wb15awnsRX-F7eDpGOM2rXdfZO_g43HPYn4";
  const sessionKey = "6cat-student-session";
  const form = document.querySelector("[data-student-login-form]");
  const message = document.querySelector("[data-student-login-message]");

  async function studentProfile(token, userId) {
    const response = await fetch(`${supabaseUrl}/rest/v1/student_profiles?id=eq.${encodeURIComponent(userId)}&select=id,status`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` } });
    const rows = await response.json().catch(() => []);
    return response.ok ? rows[0] : null;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    message.textContent = "กำลังเข้าสู่ระบบ...";
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: supabaseKey, "Content-Type": "application/json" }, body: JSON.stringify({ email: form.elements.email.value.trim(), password: form.elements.password.value }) });
      const session = await response.json();
      if (!response.ok) throw new Error(session.error_description || session.msg || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      const profile = await studentProfile(session.access_token, session.user.id);
      if (!profile || profile.status !== "active") throw new Error("บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบนักเรียน");
      sessionStorage.setItem(sessionKey, JSON.stringify(session));
      location.href = "./student-dashboard.html";
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
    }
  });

  if (sessionStorage.getItem(sessionKey)) location.href = "./student-dashboard.html";
})();
