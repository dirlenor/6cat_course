import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, client, migration, automation, publisher] = await Promise.all([
  readFile(new URL("../admin-bookings.html", import.meta.url), "utf8"),
  readFile(new URL("../admin-content.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20260908092949_facebook_content_planner.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/functions/content-automation/index.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/functions/_shared/facebook-content.ts", import.meta.url), "utf8"),
]);

for (const selector of client.matchAll(/querySelector(?:All)?\((["'])(\[data-[^"']+)\1\)/g)) {
  const attribute = selector[2].match(/\[([^=\]]+)/)?.[1];
  assert(attribute && html.includes(attribute), `Missing ${selector[2]} in admin-bookings.html`);
}

for (const table of ["content_settings", "content_posts", "content_publish_logs"]) {
  assert(migration.includes(`alter table public.${table} enable row level security;`), `${table} must have RLS enabled`);
}

assert(migration.includes("where status = 'scheduled'"), "Due-post lookup needs a partial index");
assert(migration.includes("create trigger guard_content_post_update"), "Database must guard approval-invalidating edits");
assert(migration.includes("new.status := 'draft'"), "Publishable edits must return a post to draft");
assert(migration.includes("new.approved_at := null"), "Publishable edits must clear approval in the database");
assert(migration.includes("new.revision := old.revision + 1"), "Post updates must advance the optimistic-lock revision");
assert(migration.includes("function public.reconcile_content_post"), "Publishing reconciliation must run through a database function");
assert(migration.includes("updated_at <= now() - interval '5 minutes'"), "Database reconciliation must reject active publishers");
assert(automation.includes("CONTENT_AUTOMATION_SECRET"), "Scheduled publisher must require a server-side secret");
assert(publisher.includes('.eq("status", candidate.status)'), "Publisher must atomically claim the current status");
assert(publisher.includes('.eq("revision", candidate.revision)'), "Publisher claim must use the current revision");
assert(publisher.includes('status: "publishing"'), "Publisher must claim before calling Facebook");
assert(publisher.includes("AmbiguousPublishError"), "Ambiguous Facebook responses must require manual reconciliation");
assert(publisher.includes("response.status >= 500"), "Facebook 5xx responses must be treated as ambiguous");
assert(client.includes("revision=eq.${encodeURIComponent(post.revision)}"), "Admin updates must use optimistic locking");
assert(client.includes("rows.length !== 1"), "Admin must reject stale writes");
assert(client.includes("data-content-resolve-published"), "Admin needs a manual success reconciliation action");
assert(client.includes("data-content-resolve-draft"), "Admin needs a manual not-published reconciliation action");
assert(client.includes("5 * 60 * 1000"), "Manual reconciliation must wait until the publisher is stale");
assert(client.includes('rest("rpc/reconcile_content_post"'), "Admin reconciliation must use the guarded database function");
assert(client.includes("navigator.clipboard"), "Admin must be able to copy a manual ChatGPT prompt");
assert(!client.includes("generate-content-plan"), "Admin must not call the OpenAI content-generation function");
assert(!html.includes("data-content-generate"), "Admin must not display an API-backed generation button");

console.log("Content Planner integration checks passed");
