type SupabaseAdmin = any;

class AmbiguousPublishError extends Error {}

export type PublishResult = {
  status: "published" | "skipped";
  postId: string;
  externalPostId?: string;
};

function configuredGraphVersion() {
  const version = Deno.env.get("META_GRAPH_API_VERSION")?.trim() || "";
  if (!/^v\d+\.\d+$/.test(version)) throw new Error("META_GRAPH_API_VERSION ยังไม่ได้ตั้งค่า");
  return version;
}

function facebookMessage(post: Record<string, any>) {
  const caption = String(post.caption || "").trim();
  const cta = String(post.cta || "").trim();
  if (!caption) throw new Error("โพสต์ยังไม่มีแคปชัน");
  return cta && !caption.includes(cta) ? `${caption}\n\n${cta}` : caption;
}

async function recordLog(admin: SupabaseAdmin, postId: string, eventType: string, message?: string, externalPostId?: string) {
  const { error } = await admin.from("content_publish_logs").insert({
    post_id: postId,
    event_type: eventType,
    message: message?.slice(0, 2000) || null,
    external_post_id: externalPostId || null,
  });
  if (error) console.error("Could not record content publish log", error.message);
}

export async function publishFacebookPost(admin: SupabaseAdmin, postId: string, allowEarly = false): Promise<PublishResult> {
  const { data: candidate, error: readError } = await admin
    .from("content_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!candidate || !["scheduled", "failed"].includes(candidate.status)) return { status: "skipped", postId };
  if (!candidate.approved_at) throw new Error("โพสต์นี้ยังไม่ได้รับอนุมัติ");
  if (!allowEarly && new Date(candidate.scheduled_at).getTime() > Date.now()) return { status: "skipped", postId };

  const { data: post, error: claimError } = await admin
    .from("content_posts")
    .update({
      status: "publishing",
      publish_attempts: Number(candidate.publish_attempts || 0) + 1,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("status", candidate.status)
    .eq("revision", candidate.revision)
    .select("*")
    .maybeSingle();
  if (claimError) throw new Error(claimError.message);
  if (!post) return { status: "skipped", postId };

  await recordLog(admin, post.id, "publishing", "เริ่มส่งโพสต์ไปยัง Facebook Page");
  try {
    const pageToken = Deno.env.get("META_PAGE_ACCESS_TOKEN")?.trim();
    if (!pageToken) throw new Error("META_PAGE_ACCESS_TOKEN ยังไม่ได้ตั้งค่า");
    const { data: settings, error: settingsError } = await admin
      .from("content_settings")
      .select("facebook_page_id")
      .eq("id", 1)
      .single();
    if (settingsError) throw new Error(settingsError.message);
    const pageId = String(settings.facebook_page_id || "").trim();
    if (!/^\d{5,30}$/.test(pageId)) throw new Error("ยังไม่ได้ตั้งค่า Facebook Page ID");

    const form = new FormData();
    form.set("access_token", pageToken);
    const message = facebookMessage(post);
    let edge = "feed";
    if (post.image_path) {
      const { data: image, error: imageError } = await admin.storage.from("content-assets").download(post.image_path);
      if (imageError || !image) throw new Error(imageError?.message || "ดาวน์โหลดรูปสำหรับโพสต์ไม่สำเร็จ");
      edge = "photos";
      form.set("caption", message);
      form.set("published", "true");
      form.set("source", image, post.image_path.split("/").pop() || "content-image");
    } else {
      form.set("message", message);
    }

    let response: Response;
    try {
      response = await fetch(`https://graph.facebook.com/${configuredGraphVersion()}/${pageId}/${edge}`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(60_000),
      });
    } catch {
      // ponytail: A lost response may still mean Meta published the post; require a human check before any retry.
      throw new AmbiguousPublishError("ยืนยันผลจาก Facebook ไม่ได้ กรุณาตรวจหน้าเพจก่อนกดลองใหม่เพื่อป้องกันโพสต์ซ้ำ");
    }
    const result = await response.json().catch(() => ({})) as { id?: string; post_id?: string; error?: { message?: string } };
    if (response.status >= 500) {
      throw new AmbiguousPublishError(result.error?.message || `Facebook API ตอบกลับ HTTP ${response.status} กรุณาตรวจหน้าเพจก่อนดำเนินการต่อ`);
    }
    if (!response.ok || result.error) {
      throw new Error(result.error?.message || `Facebook API ตอบกลับ HTTP ${response.status}`);
    }
    if (!result.id && !result.post_id) {
      throw new AmbiguousPublishError("Facebook ตอบว่าสำเร็จแต่ไม่ส่งรหัสโพสต์กลับมา กรุณาตรวจหน้าเพจก่อนดำเนินการต่อ");
    }

    const externalPostId = result.post_id || result.id!;
    const externalPostUrl = `https://www.facebook.com/${externalPostId}`;
    const { data: savedPost, error: updateError } = await admin
      .from("content_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        external_post_id: externalPostId,
        external_post_url: externalPostUrl,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id)
      .eq("status", "publishing")
      .eq("revision", post.revision)
      .select("id")
      .maybeSingle();
    if (updateError || !savedPost) {
      const detail = updateError?.message || "สถานะถูกเปลี่ยนโดยงานอื่น";
      console.error("Facebook published the post but the local status update failed", externalPostId, detail);
      await recordLog(admin, post.id, "published", `Facebook โพสต์สำเร็จ แต่บันทึกสถานะไม่สำเร็จ: ${detail}`, externalPostId);
      // Leave the row in publishing so neither the cron job nor the retry button can create a duplicate.
      return { status: "published", postId: post.id, externalPostId };
    }
    await recordLog(admin, post.id, "published", "โพสต์ขึ้น Facebook Page สำเร็จ", externalPostId);
    return { status: "published", postId: post.id, externalPostId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "โพสต์ Facebook ไม่สำเร็จ";
    if (error instanceof AmbiguousPublishError) {
      const { error: uncertainUpdateError } = await admin
        .from("content_posts")
        .update({ last_error: message.slice(0, 2000), updated_at: new Date().toISOString() })
        .eq("id", post.id)
        .eq("status", "publishing")
        .eq("revision", post.revision);
      if (uncertainUpdateError) console.error("Could not record ambiguous publish state", uncertainUpdateError.message);
      await recordLog(admin, post.id, "failed", message);
      // Keep publishing so the operator must reconcile the real Facebook state before another attempt.
      throw error;
    }
    const { data: failedPost, error: failedUpdateError } = await admin
      .from("content_posts")
      .update({ status: "failed", last_error: message.slice(0, 2000), updated_at: new Date().toISOString() })
      .eq("id", post.id)
      .eq("status", "publishing")
      .eq("revision", post.revision)
      .select("id")
      .maybeSingle();
    if (failedUpdateError || !failedPost) console.error("Could not move content post to failed", failedUpdateError?.message || "status changed");
    await recordLog(admin, post.id, "failed", message);
    throw error;
  }
}
