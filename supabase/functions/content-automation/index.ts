import { withSupabase } from "npm:@supabase/server@^1";
import { publishFacebookPost } from "../_shared/facebook-content.ts";

function authorized(request: Request) {
  const expected = Deno.env.get("CONTENT_AUTOMATION_SECRET")?.trim();
  const received = request.headers.get("x-content-automation-secret")?.trim();
  return Boolean(expected && received && expected === received);
}

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: duePosts, error } = await ctx.supabaseAdmin
      .from("content_posts")
      .select("id")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at")
      .limit(10);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const results = [];
    for (const post of duePosts || []) {
      try {
        results.push(await publishFacebookPost(ctx.supabaseAdmin, post.id));
      } catch (publishError) {
        results.push({ status: "failed", postId: post.id, error: publishError instanceof Error ? publishError.message : "Unknown error" });
      }
    }
    return Response.json({ processed: results.length, results });
  }),
};
