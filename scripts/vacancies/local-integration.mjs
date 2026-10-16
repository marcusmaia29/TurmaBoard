import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { closeVacancy, publishVacancy } from "./store.mjs";

const { SUPABASE_URL: url, SUPABASE_SECRET_KEY: secret, SUPABASE_PUBLISHABLE_KEY: publishable } = process.env;
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url ?? "") || !secret?.startsWith("sb_secret_") || !publishable?.startsWith("sb_publishable_")) {
  throw new Error("This integration check requires local Supabase URL, secret, and publishable key.");
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const visitor = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
const application_url = "https://carreiras.btgpactual.com/tecnologia/local-integration-fixture";
const row = {
  company: "BTG Pactual", title: "Local integration fixture", area: "software",
  location: "São Paulo, SP", work_mode: "hybrid", internship_period: "Janeiro de 2099",
  application_deadline: "2099-12-31", summary: "Disposable local verification record",
  source_name: "BTG Pactual", source_url: "https://carreiras.btgpactual.com/tecnologia",
  application_url, review_status: "approved", opening_status: "open",
};

async function publicRows() {
  const result = await visitor.from("vacancies").select("id, title").eq("application_url", application_url);
  if (result.error) throw result.error;
  return result.data;
}

assert.equal((await publishVacancy(admin, row)).action, "created");
assert.equal((await publicRows()).length, 1);
const first = await admin.from("vacancies").select("id, first_seen_at").eq("application_url", application_url).single();
if (first.error) throw first.error;
assert.equal((await publishVacancy(admin, row)).action, "updated");
const second = await admin.from("vacancies").select("id, first_seen_at").eq("application_url", application_url).single();
if (second.error) throw second.error;
assert.deepEqual(second.data, first.data);
await publishVacancy(admin, { ...row, title: "Updated local integration fixture" });
assert.equal((await publicRows())[0].title, "Updated local integration fixture");
const unauthorized = await visitor.from("vacancies").insert({ ...row, application_url: `${application_url}-visitor` });
assert.ok(unauthorized.error, "visitor INSERT must be denied");
assert.equal((await closeVacancy(admin, application_url)).action, "closed");
assert.equal((await publicRows()).length, 0);
await assert.rejects(publishVacancy(admin, row), /--reopen/);
assert.equal((await publishVacancy(admin, row, { reopen: true })).action, "reopened");
assert.equal((await publicRows()).length, 1);
await closeVacancy(admin, application_url);
console.log("Local publish, update, duplicate prevention, close, reopen, public read and visitor write denial passed.");
