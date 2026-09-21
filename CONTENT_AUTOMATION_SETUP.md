# Facebook Content Planner — production setup (manual ChatGPT workflow)

The admin UI and database migration do not call OpenAI. Use the **คัดลอกโจทย์ไป ChatGPT** button, then paste the generated content back into the admin before approving it.

## 1. Apply and deploy

```sh
supabase db push
supabase functions deploy publish-facebook-content
supabase functions deploy content-automation --no-verify-jwt
```

## 2. Configure Edge Function secrets

Set these in Supabase Dashboard → Edge Functions → Secrets, or with `supabase secrets set`:

- `META_PAGE_ACCESS_TOKEN` — Page access token with the approved permission to publish Page posts
- `META_GRAPH_API_VERSION` — a currently supported version from the Meta app dashboard, such as `vXX.0`
- `CONTENT_AUTOMATION_SECRET` — a long random value used only by the scheduled publisher

Never add these values to HTML, JavaScript, Git, or this file.

## 3. Plan content without API cost

In the admin, choose the week and enter any extra weekly direction. Click **คัดลอกโจทย์ไป ChatGPT**, paste the prompt into ChatGPT, then use the returned titles, captions, CTAs, and image prompts to fill the draft posts. Each post still requires explicit approval before it can publish.

## 4. Connect the Page

Sign in to `/admin-bookings.html`, open **คอนเทนต์ Facebook → ตั้งค่าคอนเทนต์**, then save the numeric Facebook Page ID and Page name. Test one approved post with **โพสต์ตอนนี้** before enabling the schedule.

## 5. Schedule due posts

In Supabase Vault, create:

- `content_project_url` = `https://qmayxfnadhqzilwrtepx.supabase.co`
- `content_automation_secret` = the same value used for `CONTENT_AUTOMATION_SECRET`

Then create a Supabase Cron job from the Dashboard to run every minute (`* * * * *`). Its SQL body is:

```sql
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name = 'content_project_url') || '/functions/v1/content-automation',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-content-automation-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'content_automation_secret')
  ),
  body := '{"action":"publish_due"}'::jsonb
);
```

The worker claims only approved posts whose scheduled time has passed. A failed post is not retried automatically. If Facebook's result is ambiguous, the row stays in **publishing**; wait at least five minutes, check the Page, then use one of the two reconciliation buttons in the admin before attempting another publish.
