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

type PackageCode = keyof typeof packages;

function text(value: unknown, maxLength: number, required = false) {
  const result = typeof value === "string" ? value.trim() : "";
  if ((required && !result) || result.length > maxLength) throw new Error("ข้อมูลการจองไม่ถูกต้อง");
  return result || null;
}

function courseDate(value: unknown, required = false) {
  const result = text(value, 10, required);
  if (!result) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00Z`))) throw new Error("วันที่เรียนไม่ถูกต้อง");
  return result;
}

function courseTime(value: unknown, required = false) {
  const result = text(value, 5, required);
  if (!result) return null;
  if (!new Set(["10:00", "13:00", "16:00"]).has(result)) throw new Error("เวลาเรียนไม่ถูกต้อง");
  return result;
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

    try {
      const payload = await request.json();
      const packageCode = text(payload.package, 40, true) as PackageCode;
      const selected = packages[packageCode];
      if (!selected) throw new Error("ไม่พบแพ็กเกจที่เลือก");

      const customerName = text(payload.fullName, 120, true)!;
      const customerPhone = text(payload.phone, 40, true)!;
      const customerEmail = text(payload.email, 254, true)!;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) throw new Error("อีเมลไม่ถูกต้อง");
      const requestedDate = courseDate(payload.courseDate, selected.needsSlot);
      const requestedTime = courseTime(payload.courseTime, selected.needsSlot);
      const requestedLocation = selected.needsLocation
        ? text(payload.location, 160, true)
        : packageCode === "live-online" ? "Online — Google Meet / Zoom" : null;

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
          requested_slot: requestedDate && requestedTime ? `${requestedDate} ${requestedTime}` : null,
          requested_date: requestedDate,
          requested_time: requestedTime,
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
      const message = error instanceof Error ? error.message : "ไม่สามารถสร้างรายการชำระเงินได้";
      return Response.json({ error: message }, { status: 400 });
    }
  }),
};
