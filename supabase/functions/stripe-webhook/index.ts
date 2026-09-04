import Stripe from "npm:stripe@^22";
import { withSupabase } from "npm:@supabase/server@^1";

function stripeClient() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe ยังไม่ได้ตั้งค่า");
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

const cryptoProvider = Stripe.createSubtleCryptoProvider();

function escapeHtml(value: unknown) {
  return String(value || "-").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function formatSchedule(booking: Record<string, unknown>) {
  if (!booking.requested_date) return "เรียนได้ทันทีหลังชำระเงิน";
  const date = new Intl.DateTimeFormat("th-TH", { dateStyle: "full", timeZone: "Asia/Bangkok" }).format(new Date(`${booking.requested_date}T00:00:00+07:00`));
  return `${date} เวลา ${booking.requested_time || "-"} น.${booking.requested_location ? ` · ${booking.requested_location}` : ""}`;
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
    .select("id, package_code, amount_thb, customer_name, customer_email, requested_date, requested_time, requested_location")
    .maybeSingle();
  if (claimError || !claimed) return;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("BOOKING_EMAIL_FROM");
  if (!resendKey || !emailFrom) {
    await admin.from("bookings").update({ customer_email_status: "not_configured", customer_email_error: "RESEND_API_KEY หรือ BOOKING_EMAIL_FROM ยังไม่ได้ตั้งค่า", updated_at: new Date().toISOString() }).eq("id", bookingId);
    return;
  }

  const schedule = formatSchedule(claimed);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: emailFrom,
      to: [claimed.customer_email],
      subject: "ยืนยันการชำระเงิน · 6CAT Academy",
      html: `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#171513"><h1 style="color:#ff4d0a">ชำระเงินสำเร็จแล้ว</h1><p>สวัสดี ${escapeHtml(claimed.customer_name)}</p><p>6CAT Academy ได้รับการชำระเงินของคุณแล้ว ทีมงานจะติดต่อยืนยันรายละเอียดอีกครั้ง</p><table style="width:100%;border-collapse:collapse"><tr><td style="padding:10px;border-bottom:1px solid #eee">แพ็กเกจ</td><td style="padding:10px;border-bottom:1px solid #eee"><strong>${escapeHtml(claimed.package_code)}</strong></td></tr><tr><td style="padding:10px;border-bottom:1px solid #eee">ยอดชำระ</td><td style="padding:10px;border-bottom:1px solid #eee"><strong>฿${Number(claimed.amount_thb).toLocaleString("th-TH")}</strong></td></tr><tr><td style="padding:10px">กำหนดเรียน</td><td style="padding:10px">${escapeHtml(schedule)}</td></tr></table><p style="margin-top:28px">หากต้องการความช่วยเหลือ ติดต่อเราได้ทาง LINE ของ 6CAT Academy</p></main>`,
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
          const { error } = await ctx.supabaseAdmin.from("bookings").update({ status, updated_at: new Date().toISOString() }).eq("id", bookingId).neq("status", "paid");
          if (error) return new Response("Could not update booking", { status: 500 });
        }
      }
    }

    const { error: eventError } = await ctx.supabaseAdmin.from("stripe_webhook_events").upsert({ stripe_event_id: event.id, event_type: event.type }, { onConflict: "stripe_event_id", ignoreDuplicates: true });
    if (eventError) return new Response("Could not record webhook", { status: 500 });
    return Response.json({ received: true });
  }),
};
