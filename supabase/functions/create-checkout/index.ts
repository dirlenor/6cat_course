import Stripe from "npm:stripe@^22";
import { withSupabase } from "npm:@supabase/server@^1";

const SITE_URL = "https://course.6cat.website";
const LOCAL_ORIGINS = new Set(["http://localhost:4502", "http://127.0.0.1:4502"]);

const packages = {
  "online-course": { name: "ONLINE COURSE", amountThb: 990, needsSlot: false, needsLocation: false },
  "live-online": { name: "PRIVATE LIVE ONLINE", amountThb: 2999, needsSlot: true, needsLocation: false, defaultLocation: "Online — Google Meet / Zoom" },
  solo: { name: "SOLO", amountThb: 3999, needsSlot: true, needsLocation: true },
  buddy: { name: "BUDDY", amountThb: 5999, needsSlot: true, needsLocation: true },
} as const;
const workshopLocations = new Set(["Central นอร์ทวิว", "Central เวสเกต", "Espanard แคลาย"]);

type PackageCode = keyof typeof packages;

function text(value: unknown, maxLength: number, required = false) {
  const result = typeof value === "string" ? value.trim() : "";
  if ((required && !result) || result.length > maxLength) throw new Error("ข้อมูลการจองไม่ถูกต้อง");
  return result || null;
}

function createStripeClient() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe ยังไม่ได้ตั้งค่า");
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

function isAllowedOrigin(origin: string | null) {
  return !origin || origin === SITE_URL || LOCAL_ORIGINS.has(origin);
}

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    if (!isAllowedOrigin(request.headers.get("origin"))) return Response.json({ error: "Origin not allowed" }, { status: 403 });

    let reservedSlotId: string | null = null;
    try {
      const payload = await request.json();
      const packageCode = text(payload.package, 40, true) as PackageCode;
      const selected = packages[packageCode];
      if (!selected) throw new Error("ไม่พบแพ็กเกจที่เลือก");

      const customerName = text(payload.fullName, 120, true)!;
      const customerPhone = text(payload.phone, 40, true)!;
      const customerEmail = text(payload.email, 254, true)!;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) throw new Error("อีเมลไม่ถูกต้อง");
      let scheduledSlot: { id: string; course_date: string; start_time: string; location: string } | null = null;
      if (selected.needsSlot) {
        const courseSlotId = text(payload.courseSlotId, 36, true)!;
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(courseSlotId)) throw new Error("รอบเรียนไม่ถูกต้อง");
        const { data, error } = await ctx.supabaseAdmin.rpc("reserve_course_slot", { p_slot_id: courseSlotId, p_package_code: packageCode });
        if (error || !data) throw new Error(error?.message || "รอบเรียนนี้เต็มหรือปิดรับจองแล้ว");
        scheduledSlot = data as typeof scheduledSlot;
        reservedSlotId = courseSlotId;
      }
      const requestedLocation = selected.needsLocation
        ? text(payload.location, 160, true)
        : scheduledSlot?.location ?? null;
      if (selected.needsLocation && !workshopLocations.has(requestedLocation || "")) throw new Error("กรุณาเลือกสถานที่เรียนที่กำหนด");

      const { data: booking, error: bookingError } = await ctx.supabaseAdmin
        .from("bookings")
        .insert({
          package_code: packageCode,
          amount_thb: selected.amountThb,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          line_id: text(payload.lineId, 120),
          buddy_name: text(payload.buddyName, 120),
          course_slot_id: scheduledSlot?.id ?? null,
          requested_slot: scheduledSlot ? `${scheduledSlot.course_date} ${scheduledSlot.start_time.slice(0, 5)}` : null,
          requested_date: scheduledSlot?.course_date ?? null,
          requested_time: scheduledSlot?.start_time ?? null,
          requested_location: requestedLocation,
          customer_note: text(payload.note, 2000),
        })
        .select("id")
        .single();
      if (bookingError) throw bookingError;

      const session = await createStripeClient().checkout.sessions.create({
        mode: "payment",
        customer_email: customerEmail,
        line_items: [{
          price_data: {
            currency: "thb",
            product_data: { name: selected.name },
            unit_amount: selected.amountThb * 100,
          },
          quantity: 1,
        }],
        metadata: { booking_id: booking.id, package_code: packageCode },
        payment_intent_data: { metadata: { booking_id: booking.id }, receipt_email: customerEmail },
        success_url: `${SITE_URL}/booking-success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/booking-cancel.html?booking_id=${booking.id}`,
      }, { idempotencyKey: booking.id });

      const { error: updateError } = await ctx.supabaseAdmin
        .from("bookings")
        .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
        .eq("id", booking.id);
      if (updateError) throw updateError;
      if (!session.url) throw new Error("Stripe ไม่ส่งลิงก์ชำระเงินกลับมา");

      return Response.json({ url: session.url });
    } catch (error) {
      if (reservedSlotId) await ctx.supabaseAdmin.rpc("release_course_slot", { p_slot_id: reservedSlotId });
      const message = error instanceof Error ? error.message : "ไม่สามารถสร้างรายการชำระเงินได้";
      return Response.json({ error: message }, { status: 400 });
    }
  }),
};
