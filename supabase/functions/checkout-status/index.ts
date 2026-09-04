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
      .select("package_code, status")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();
    if (error) return Response.json({ error: "Could not check payment status" }, { status: 500 });
    if (!data) return Response.json({ status: "pending_payment" });

    return Response.json(data);
  }),
};
