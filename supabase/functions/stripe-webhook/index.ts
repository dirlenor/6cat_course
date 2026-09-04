import Stripe from "npm:stripe@^22";
import { withSupabase } from "npm:@supabase/server@^1";

function stripeClient() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe ยังไม่ได้ตั้งค่า");
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

const cryptoProvider = Stripe.createSubtleCryptoProvider();

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    const signature = request.headers.get("Stripe-Signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!signature || !webhookSecret) return new Response("Webhook is not configured", { status: 400 });

    let event: Stripe.Event;
    try {
      event = await stripeClient().webhooks.constructEventAsync(
        await request.text(),
        signature,
        webhookSecret,
        undefined,
        cryptoProvider,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid webhook signature";
      return new Response(message, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (!bookingId) return Response.json({ received: true });

    let update: Record<string, string | null> | null = null;
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (session.payment_status === "paid" || event.type === "checkout.session.async_payment_succeeded") {
        update = {
          status: "paid",
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } else if (event.type === "checkout.session.async_payment_failed") {
      update = { status: "payment_failed", updated_at: new Date().toISOString() };
    } else if (event.type === "checkout.session.expired") {
      update = { status: "expired", updated_at: new Date().toISOString() };
    }

    if (update) {
      let query = ctx.supabaseAdmin.from("bookings").update(update).eq("id", bookingId);
      if (update.status !== "paid") query = query.neq("status", "paid");
      const { error } = await query;
      if (error) return new Response("Could not update booking", { status: 500 });
    }

    const { error: eventError } = await ctx.supabaseAdmin
      .from("stripe_webhook_events")
      .upsert({ stripe_event_id: event.id, event_type: event.type }, { onConflict: "stripe_event_id", ignoreDuplicates: true });
    if (eventError) return new Response("Could not record webhook", { status: 500 });

    return Response.json({ received: true });
  }),
};
