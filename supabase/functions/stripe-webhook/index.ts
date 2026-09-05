import Stripe from "npm:stripe@^22";
import { withSupabase } from "npm:@supabase/server@^1";

function stripeClient() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe ยังไม่ได้ตั้งค่า");
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

const cryptoProvider = Stripe.createSubtleCryptoProvider();
const SITE_URL = "https://course.6cat.website";
const LINE_URL = "https://line.me/R/ti/p/@6catacademy";

function escapeHtml(value: unknown) {
  return String(value || "-").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function formatSchedule(booking: Record<string, unknown>) {
  if (!booking.requested_date) return "เรียนได้ทันทีหลังชำระเงิน";
  const date = new Intl.DateTimeFormat("th-TH", { dateStyle: "full", timeZone: "Asia/Bangkok" }).format(new Date(`${booking.requested_date}T00:00:00+07:00`));
  return `${date} เวลา ${booking.requested_time || "-"} น.${booking.requested_location ? ` · ${booking.requested_location}` : ""}`;
}

function packageName(value: unknown) {
  return ({ "online-course": "Online Course", "live-online": "Private Live Online", solo: "Solo Workshop", buddy: "Buddy Workshop" } as Record<string, string>)[String(value || "")] || String(value || "-");
}

function invoiceNumber(value: unknown) {
  return `6CAT-${String(value || "").slice(-10).toUpperCase()}`;
}

function customerInvoiceEmail(booking: Record<string, unknown>) {
  const total = `฿${Number(booking.amount_thb || 0).toLocaleString("th-TH")}`;
  const sessionId = String(booking.stripe_checkout_session_id || "");
  const invoiceUrl = `${SITE_URL}/booking-invoice.html?session_id=${encodeURIComponent(sessionId)}`;
  const details: Array<[string, string]> = [["วันเรียน", formatSchedule(booking)]];
  if (booking.requested_location) details.push(["สถานที่ / ช่องทาง", String(booking.requested_location)]);
  if (booking.buddy_name) details.push(["ผู้เรียนร่วม", String(booking.buddy_name)]);
  const detailRows = details.map(([label, value]) => `<tr><td style="padding:12px 0;border-bottom:1px solid #ebe7e2;color:#736b64;font-size:13px">${escapeHtml(label)}</td><td style="padding:12px 0 12px 18px;border-bottom:1px solid #ebe7e2;color:#171513;font-size:13px;font-weight:700;text-align:right">${escapeHtml(value)}</td></tr>`).join("");
  return `<div style="margin:0;padding:32px 16px;background:#f4f1ee;color:#171513;font-family:Arial,'Noto Sans Thai',sans-serif"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff"><tr><td style="padding:36px 40px"><img src="${SITE_URL}/assets/brand/6cat-academy-logo.png" width="145" alt="6CAT Academy" style="display:block;width:145px;height:auto" /><p style="margin:36px 0 6px;color:#ff4d0a;font-size:12px;font-weight:800;letter-spacing:1px">BOOKING CONFIRMATION</p><h1 style="margin:0 0 12px;color:#171513;font-size:30px;line-height:1.2">ขอบคุณ ${escapeHtml(booking.customer_name)}<br />ยืนยันการจองเรียบร้อยแล้ว</h1><p style="margin:0 0 24px;color:#6c655f;font-size:14px;line-height:1.7">เราได้รับการชำระเงินของคุณแล้ว เก็บอีเมลฉบับนี้ไว้เป็นใบยืนยันการจองได้เลย</p><p style="margin:0 0 24px;color:#827970;font-size:12px;font-weight:700">เลขที่ใบยืนยัน: ${escapeHtml(invoiceNumber(sessionId))}</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f3f1"><tr><td style="padding:24px"><p style="margin:0 0 7px;color:#736b64;font-size:12px;font-weight:700">ผู้เรียน</p><strong style="font-size:18px">${escapeHtml(booking.customer_name)}</strong><p style="margin:7px 0 0;color:#5f5852;font-size:13px;line-height:1.6">${escapeHtml(booking.customer_email)}<br />${escapeHtml(booking.customer_phone)}</p></td><td style="padding:24px;text-align:right;vertical-align:top"><p style="margin:0;color:#736b64;font-size:12px;font-weight:700">ยอดชำระ</p><strong style="display:block;margin:6px 0;color:#171513;font-size:30px">${total}</strong><span style="color:#187243;font-size:12px;font-weight:700">ชำระเงินแล้ว</span></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px"><tr><td style="padding:0 0 18px;border-bottom:1px solid #e3ddd7"><p style="margin:0;color:#736b64;font-size:12px;font-weight:700">แพ็กเกจที่เลือก</p><strong style="display:inline-block;margin-top:7px;font-size:18px">${escapeHtml(packageName(booking.package_code))}</strong></td><td style="padding:0 0 18px;border-bottom:1px solid #e3ddd7;text-align:right;font-size:18px;font-weight:700">${total}</td></tr>${detailRows}<tr><td style="padding-top:22px;font-size:16px;font-weight:700">ยอดชำระทั้งหมด</td><td style="padding-top:22px;color:#ff4d0a;font-size:24px;font-weight:800;text-align:right">${total}</td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:30px"><tr><td align="center"><a href="${invoiceUrl}" style="display:inline-block;padding:13px 20px;border-radius:8px;background:#ff4d0a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">เปิด / ดาวน์โหลดใบยืนยัน</a></td></tr><tr><td align="center" style="padding-top:14px"><a href="${LINE_URL}" style="color:#187243;font-size:13px;font-weight:700;text-decoration:none">เพิ่มเพื่อนใน LINE เพื่อรับการดูแล</a></td></tr></table><p style="margin:32px 0 0;padding-top:22px;border-top:1px solid #e3ddd7;color:#827970;font-size:12px;line-height:1.7;text-align:center">หากต้องการความช่วยเหลือ ติดต่อ 6CAT Academy ผ่าน LINE ได้เลย</p></td></tr></table></div>`;
}

async function updateStripeFee(stripe: Stripe, bookingId: string, paymentIntentId: string, admin: any) {
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge.balance_transaction"] });
  const charge = typeof intent.latest_charge === "object" ? intent.latest_charge as Stripe.Charge : null;
  const balanceTransaction = charge && typeof charge.balance_transaction === "object"
    ? charge.balance_transaction as Stripe.BalanceTransaction
    : null;
  if (!balanceTransaction) return;
  const feeThb = balanceTransaction.fee / 100;
  const netThb = (intent.amount - balanceTransaction.fee) / 100;
  await admin.from("bookings").update({ stripe_fee_thb: feeThb, net_amount_thb: netThb, updated_at: new Date().toISOString() }).eq("id", bookingId);
}

async function sendCustomerConfirmation(admin: any, bookingId: string) {
  const { data: claimed, error: claimError } = await admin
    .from("bookings")
    .update({ customer_email_status: "sending", customer_email_error: null, updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("customer_email_status", "pending")
    .select("id, package_code, amount_thb, customer_name, customer_email, customer_phone, buddy_name, requested_date, requested_time, requested_location, stripe_checkout_session_id")
    .maybeSingle();
  if (claimError || !claimed) return;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("BOOKING_EMAIL_FROM");
  if (!resendKey || !emailFrom) {
    await admin.from("bookings").update({ customer_email_status: "not_configured", customer_email_error: "RESEND_API_KEY หรือ BOOKING_EMAIL_FROM ยังไม่ได้ตั้งค่า", updated_at: new Date().toISOString() }).eq("id", bookingId);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: emailFrom,
      to: [claimed.customer_email],
      subject: "ใบยืนยันการจอง · 6CAT Academy",
      html: customerInvoiceEmail(claimed),
    }),
  });
  if (response.ok) {
    await admin.from("bookings").update({ customer_email_status: "sent", customer_email_sent_at: new Date().toISOString(), customer_email_error: null, updated_at: new Date().toISOString() }).eq("id", bookingId);
    return;
  }
  const body = await response.text();
  await admin.from("bookings").update({ customer_email_status: "failed", customer_email_error: body.slice(0, 500), updated_at: new Date().toISOString() }).eq("id", bookingId);
}

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    const signature = request.headers.get("Stripe-Signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!signature || !webhookSecret) return new Response("Webhook is not configured", { status: 400 });

    let event: Stripe.Event;
    try {
      event = await stripeClient().webhooks.constructEventAsync(await request.text(), signature, webhookSecret, undefined, cryptoProvider);
    } catch (error) {
      return new Response(error instanceof Error ? error.message : "Invalid webhook signature", { status: 400 });
    }

    const stripe = stripeClient();
    if (event.type === "charge.updated") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
      if (paymentIntentId) {
        const { data: booking } = await ctx.supabaseAdmin.from("bookings").select("id").eq("stripe_payment_intent_id", paymentIntentId).maybeSingle();
        if (booking) await updateStripeFee(stripe, booking.id, paymentIntentId, ctx.supabaseAdmin);
      }
    } else {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (bookingId) {
        if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && (session.payment_status === "paid" || event.type === "checkout.session.async_payment_succeeded")) {
          const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
          const { error } = await ctx.supabaseAdmin.from("bookings").update({ status: "paid", stripe_checkout_session_id: session.id, stripe_payment_intent_id: paymentIntentId, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", bookingId);
          if (error) return new Response("Could not update booking", { status: 500 });
          if (paymentIntentId) await updateStripeFee(stripe, bookingId, paymentIntentId, ctx.supabaseAdmin);
          await sendCustomerConfirmation(ctx.supabaseAdmin, bookingId);
        } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
          const status = event.type === "checkout.session.expired" ? "expired" : "payment_failed";
          const { data: cancelledBooking, error } = await ctx.supabaseAdmin
            .from("bookings")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", bookingId)
            .eq("status", "pending_payment")
            .select("course_slot_id")
            .maybeSingle();
          if (error) return new Response("Could not update booking", { status: 500 });
          if (cancelledBooking?.course_slot_id) await ctx.supabaseAdmin.rpc("release_course_slot", { p_slot_id: cancelledBooking.course_slot_id });
        }
      }
    }

    const { error: eventError } = await ctx.supabaseAdmin.from("stripe_webhook_events").upsert({ stripe_event_id: event.id, event_type: event.type }, { onConflict: "stripe_event_id", ignoreDuplicates: true });
    if (eventError) return new Response("Could not record webhook", { status: 500 });
    return Response.json({ received: true });
  }),
};
