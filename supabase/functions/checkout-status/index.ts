import { withSupabase } from "npm:@supabase/server@^1";

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405 });

    const sessionId = new URL(request.url).searchParams.get("session_id");
    if (!sessionId || !/^cs_(test|live)_/.test(sessionId)) {
      return Response.json({ error: "Invalid Checkout Session" }, { status: 400 });
    }

    const { data, error } = await ctx.supabaseAdmin
      .from("bookings")
      .select("package_code, status, amount_thb, customer_name, customer_phone, customer_email, line_id, buddy_name, requested_date, requested_time, requested_location, customer_email_status")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();
    if (error) return Response.json({ error: "Could not check payment status" }, { status: 500 });
    if (!data) return Response.json({ status: "pending_payment" });

    if (data.status !== "paid") return Response.json({ status: data.status });

    return Response.json({
      status: "paid",
      booking: {
        package_code: data.package_code,
        amount_thb: data.amount_thb,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email,
        line_id: data.line_id,
        buddy_name: data.buddy_name,
        requested_date: data.requested_date,
        requested_time: data.requested_time,
        requested_location: data.requested_location,
        customer_email_status: data.customer_email_status,
      },
    });
  }),
};
