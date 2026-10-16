export async function publishVacancy(client, row, { reopen = false, now = new Date() } = {}) {
  const table = client.from("vacancies");
  const { data: existing, error: readError } = await table
    .select("id, opening_status, first_seen_at")
    .eq("application_url", row.application_url)
    .maybeSingle();
  if (readError) throw readError;
  if (existing?.opening_status === "closed" && !reopen) {
    throw new Error("This vacancy is closed. Recheck the source and pass --reopen to reopen it explicitly.");
  }
  if (reopen && existing?.opening_status !== "closed") {
    throw new Error("--reopen only applies to an existing closed vacancy.");
  }
  const timestamp = now.toISOString();
  const values = { ...row, last_seen_at: timestamp, last_verified_at: timestamp };
  if (existing) {
    const { data, error } = await table.update(values).eq("id", existing.id).select("id, first_seen_at, opening_status").single();
    if (error) throw error;
    return { action: reopen ? "reopened" : "updated", vacancy: data };
  }
  const { data, error } = await table.insert({ ...values, first_seen_at: timestamp }).select("id, first_seen_at, opening_status").single();
  if (error) throw error;
  return { action: "created", vacancy: data };
}

export async function closeVacancy(client, applicationUrl, { now = new Date() } = {}) {
  const { data: existing, error: readError } = await client.from("vacancies")
    .select("id, opening_status")
    .eq("application_url", applicationUrl)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) throw new Error("Vacancy not found for application_url.");
  if (existing.opening_status === "closed") return { action: "already_closed", vacancy: existing };
  const { data, error } = await client.from("vacancies")
    .update({ opening_status: "closed", last_verified_at: now.toISOString() })
    .eq("id", existing.id)
    .select("id, opening_status")
    .single();
  if (error) throw error;
  return { action: "closed", vacancy: data };
}
