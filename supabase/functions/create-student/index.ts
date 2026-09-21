import { withSupabase } from "npm:@supabase/server@^1";

function value(input: unknown, max: number) {
  const result = typeof input === "string" ? input.trim() : "";
  return result && result.length <= max ? result : "";
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    const role = ctx.userClaims?.app_metadata?.role;
    if (ctx.userClaims?.email !== "admin@6cat.com" && role !== "admin") return Response.json({ error: "ไม่มีสิทธิ์สร้างบัญชีนักเรียน" }, { status: 403 });

    let userId = "";
    let createdAuthUser = false;
    try {
      const payload = await request.json();
      const email = value(payload.email, 254).toLowerCase();
      const fullName = value(payload.fullName, 120);
      const password = value(payload.password, 128);
      const courseId = value(payload.courseId, 36);
      const expiresAt = value(payload.expiresAt, 40) || null;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("อีเมลนักเรียนไม่ถูกต้อง");
      if (fullName.length < 2) throw new Error("กรุณาใส่ชื่อนักเรียน");
      if (!/^[0-9a-f-]{36}$/i.test(courseId)) throw new Error("คอร์สเรียนไม่ถูกต้อง");
      if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) throw new Error("วันหมดอายุไม่ถูกต้อง");

      const { data: course, error: courseError } = await ctx.supabaseAdmin.from("courses").select("id").eq("id", courseId).maybeSingle();
      if (courseError || !course) throw new Error("ไม่พบคอร์สเรียน");

      const { data: existingProfile, error: lookupError } = await ctx.supabaseAdmin.from("student_profiles").select("id").eq("email", email).maybeSingle();
      if (lookupError) throw new Error(lookupError.message);
      if (existingProfile) {
        userId = existingProfile.id;
      } else {
        if (password.length < 10) throw new Error("บัญชีใหม่ต้องมีรหัสผ่านชั่วคราวอย่างน้อย 10 ตัวอักษร");
        const { data: created, error: authError } = await ctx.supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          app_metadata: { role: "student" },
          user_metadata: { full_name: fullName },
        });
        if (authError || !created.user) throw new Error(authError?.message || "สร้างบัญชีนักเรียนไม่สำเร็จ");
        userId = created.user.id;
        createdAuthUser = true;
      }

      const { data: profile, error: provisionError } = await ctx.supabaseAdmin.rpc("provision_student_enrollment", {
        p_student_id: userId,
        p_email: email,
        p_full_name: fullName,
        p_course_id: courseId,
        p_expires_at: expiresAt,
      });
      if (provisionError || !profile) throw new Error(provisionError?.message || "เปิดสิทธิ์คอร์สไม่สำเร็จ");

      return Response.json({ student: profile, createdAuthUser });
    } catch (error) {
      if (createdAuthUser && userId) {
        const { error: cleanupError } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
        if (cleanupError) {
          console.error("create-student cleanup failed", { userId, cleanupError: cleanupError.message });
          return Response.json({ error: "สร้างข้อมูลไม่สำเร็จและต้องตรวจบัญชีค้าง", reconciliationUserId: userId }, { status: 500 });
        }
      }
      return Response.json({ error: error instanceof Error ? error.message : "สร้างบัญชีนักเรียนไม่สำเร็จ" }, { status: 400 });
    }
  }),
};
