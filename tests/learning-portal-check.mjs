import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [adminHtml, adminClient, loginHtml, loginClient, dashboardHtml, dashboardClient, migration, createStudent] = await Promise.all([
  readFile(new URL("../admin-bookings.html", import.meta.url), "utf8"),
  readFile(new URL("../admin-learning.js", import.meta.url), "utf8"),
  readFile(new URL("../student-login.html", import.meta.url), "utf8"),
  readFile(new URL("../student-login.js", import.meta.url), "utf8"),
  readFile(new URL("../student-dashboard.html", import.meta.url), "utf8"),
  readFile(new URL("../student-dashboard.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20260912004803_student_learning_portal.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/functions/create-student/index.ts", import.meta.url), "utf8"),
]);

function assertSelectorsExist(client, html, pageName) {
  for (const selector of client.matchAll(/querySelector(?:All)?\((['"])(\[data-[^'"]+)\1\)/g)) {
    const attribute = selector[2].match(/\[([^=\]]+)/)?.[1];
    assert(attribute && html.includes(attribute), `Missing ${selector[2]} in ${pageName}`);
  }
}

assertSelectorsExist(adminClient, adminHtml, "admin-bookings.html");
assertSelectorsExist(loginClient, loginHtml, "student-login.html");
assertSelectorsExist(dashboardClient, dashboardHtml, "student-dashboard.html");

for (const table of ["student_profiles", "courses", "course_modules", "lessons", "enrollments", "lesson_progress"]) {
  assert(migration.includes(`alter table public.${table} enable row level security;`), `${table} must have RLS enabled`);
  assert(migration.includes(`Admins ${table === "student_profiles" ? "manage student profiles" : table === "course_modules" ? "manage course modules" : table === "lesson_progress" ? "read lesson progress" : `manage ${table}`}`), `${table} must have an admin policy`);
}

assert(migration.includes("private.has_active_enrollment"), "Course access must check an active enrollment");
assert(migration.includes("private.can_view_module"), "Module access must check publication and enrollment");
assert(migration.includes("private.can_view_lesson"), "Lesson access must check publication and enrollment");
assert(migration.includes("e.expires_at > now()"), "Expired enrollments must be denied");
assert(migration.includes("student_id = auth.uid()"), "Student records must be scoped to the signed-in user");
assert(adminHtml.includes('session.user?.app_metadata?.role === "admin"'), "Admin page must reject student sessions");
assert(!adminHtml.includes("data-admin-signup"), "Admin signup must not be publicly available");
assert(adminHtml.includes('data-dashboard-tab="courses">จัดการคอร์ส'), "Course management must have its own menu");
assert(adminHtml.includes('data-dashboard-tab="students">นักเรียน'), "Student management must have its own menu");
assert(adminHtml.includes('data-dashboard-view="courses"'), "Course management must have its own view");
assert(adminHtml.includes('data-dashboard-view="students"'), "Student management must have its own view");
assert(!adminHtml.includes('data-dashboard-tab="learning"'), "Course and student management must not share one menu");
assert(createStudent.includes('app_metadata: { role: "student" }'), "New learners must receive the student role");
assert(createStudent.includes("auth.admin.createUser"), "Student Auth users must be created on the server");
assert(createStudent.includes("auth.admin.deleteUser"), "Partial student creation must be rolled back");
assert(createStudent.includes('rpc("provision_student_enrollment"'), "Profile and enrollment writes must use one database transaction");
assert(createStudent.includes('from("student_profiles").select("id")'), "Existing students must be reusable for another course");
assert(migration.includes("on conflict (student_id, course_id) do update"), "An existing learner must be grantable another course");
assert(migration.includes("to service_role"), "Student provisioning RPC must be server-only");
assert(!dashboardClient.includes("service_role"), "Student client must never contain a service role key");
assert(dashboardClient.includes("youtube-nocookie.com/embed"), "Lessons must use the privacy-enhanced YouTube embed");
assert(dashboardClient.includes("data-student-watermark"), "Video view must include a learner watermark");

console.log("Learning portal integration checks passed");
