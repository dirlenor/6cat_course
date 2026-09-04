import { withSupabase } from "npm:@supabase/server@^1";

const SITE_URL = "https://course.6cat.website";
const LOCAL_ORIGINS = new Set(["http://localhost:4502", "http://127.0.0.1:4502"]);
const packages = new Set(["live-online", "solo", "buddy"]);

function isAllowedOrigin(origin: string | null) {
  return !origin || origin === SITE_URL || LOCAL_ORIGINS.has(origin);
}

function dateKey(date: Date) {
  return [date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, "0"), String(date.getUTCDate()).padStart(2, "0")].join("-");
}

function requestedWeek(value: string | null) {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
  if (!date || Number.isNaN(date.getTime()) || dateKey(date) !== value) return undefined;
  return value;
}

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405 });
    if (!isAllowedOrigin(request.headers.get("origin"))) return Response.json({ error: "Origin not allowed" }, { status: 403 });
    const url = new URL(request.url);
    const packageCode = url.searchParams.get("package") || "";
    if (!packages.has(packageCode)) return Response.json({ error: "ไม่พบแพ็กเกจที่เลือกรอบเรียน" }, { status: 400 });

    const today = new Date();
    const todayKey = dateKey(today);
    const week = requestedWeek(url.searchParams.get("week"));
    if (week === undefined) return Response.json({ error: "สัปดาห์ที่เลือกไม่ถูกต้อง" }, { status: 400 });
    const start = week ? new Date(`${week}T00:00:00Z`) : new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    if (dateKey(start) < todayKey) return Response.json({ error: "ไม่สามารถดูรอบย้อนหลังได้" }, { status: 400 });
    const limit = new Date(Date.UTC(today.getFullYear() + 1, today.getMonth(), today.getDate()));
    if (start > limit) return Response.json({ error: "สามารถดูรอบล่วงหน้าได้ไม่เกิน 1 ปี" }, { status: 400 });
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    const slotGroup = packageCode === "solo" || packageCode === "buddy" ? "workshop" : packageCode;
    const { data, error } = await ctx.supabaseAdmin
      .from("course_slots")
      .select("id,course_date,start_time,location,capacity,reserved_count,is_open")
      .eq("package_code", slotGroup)
      .gte("course_date", dateKey(start))
      .lte("course_date", dateKey(end))
      .order("course_date")
      .order("start_time");
    if (error) return Response.json({ error: "ไม่สามารถโหลดรอบเรียนได้" }, { status: 500 });
    return Response.json({ slots: data || [] });
  }),
};
