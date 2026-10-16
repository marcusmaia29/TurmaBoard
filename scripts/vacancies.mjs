#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { validateClosure, validateVacancy } from "./vacancies/validation.mjs";
import { closeVacancy, publishVacancy } from "./vacancies/store.mjs";

function usage() {
  throw new Error("Usage: npm run vacancies -- <validate|publish|close> <file.json> [--reopen]");
}

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || !/^sb_secret_/.test(key)) {
    throw new Error("Set SUPABASE_URL and a Supabase sb_secret_ key in the controlled local environment.");
  }
  if (process.env.VITE_SUPABASE_SECRET_KEY) {
    throw new Error("Never expose SUPABASE_SECRET_KEY through a VITE_ variable.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  const [command, file, flag, extra] = process.argv.slice(2);
  if (!["validate", "publish", "close"].includes(command) || !file || extra || (flag && (command !== "publish" || flag !== "--reopen"))) usage();
  const input = JSON.parse(await readFile(file, "utf8"));
  if (command === "close") {
    const closure = validateClosure(input);
    const result = await closeVacancy(adminClient(), closure.application_url);
    console.log(JSON.stringify({ action: result.action, id: result.vacancy.id, reason: closure.reason, evidence_url: closure.evidence.url }, null, 2));
    return;
  }
  const { row, evidence } = validateVacancy(input);
  if (command === "validate") {
    console.log(JSON.stringify({ valid: true, vacancy: row, evidence }, null, 2));
    return;
  }
  const result = await publishVacancy(adminClient(), row, { reopen: flag === "--reopen" });
  console.log(JSON.stringify({ action: result.action, id: result.vacancy.id, application_url: row.application_url }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
