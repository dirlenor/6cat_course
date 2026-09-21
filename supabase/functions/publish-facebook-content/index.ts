import { withSupabase } from "npm:@supabase/server@^1";
import { publishFacebookPost } from "../_shared/facebook-content.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    if (ctx.userClaims?.email !== "admin@6cat.com") return Response.json({ error: "ไม่มีสิทธิ์เผยแพร่คอนเทนต์" }, { status: 403 });
    try {
      const payload = await request.json();
      const postId = typeof payload.postId === "string" && /^[0-9a-f-]{36}$/i.test(payload.postId) ? payload.postId : "";
      if (!postId) return Response.json({ error: "ไม่พบโพสต์ที่ต้องการเผยแพร่" }, { status: 400 });
      return Response.json(await publishFacebookPost(ctx.supabaseAdmin, postId, true));
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "โพสต์ Facebook ไม่สำเร็จ" }, { status: 400 });
    }
  }),
};
