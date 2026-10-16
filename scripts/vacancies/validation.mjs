const sources = {
  btg: {
    company: "BTG Pactual",
    source_name: "BTG Pactual",
    hosts: ["btgpactual.com", "jobs.greenhouse.io", "boards.greenhouse.io", "job-boards.greenhouse.io"],
    atsSlug: "btgpactual",
  },
  genial: {
    company: "Genial Investimentos",
    source_name: "Genial Investimentos",
    hosts: ["genialinvestimentos.com.br", "genial.gupy.io"],
  },
  itau: {
    company: "Itaú",
    source_name: "Itaú Carreiras",
    hosts: ["itau.com.br"],
  },
};

const areas = new Set(["software", "data_ai", "infrastructure", "security", "product", "other"]);
const modes = new Set(["onsite", "hybrid", "remote"]);
const proofFields = ["vacation_internship", "technology_area", "computer_science", "location", "internship_period", "applications_open", "application_deadline"];

export function saoPauloDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

function requireText(value, field, max = 300) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new Error(`${field} must contain 1–${max} characters.`);
  }
  return value.trim();
}

function officialUrl(value, field, source) {
  const text = requireText(value, field, 2000);
  let url;
  try { url = new URL(text); } catch { throw new Error(`${field} must be an HTTPS URL.`); }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`${field} must be an HTTPS URL without credentials.`);
  }
  const host = url.hostname.toLowerCase();
  const allowed = source.hosts.some((domain) => host === domain || (domain === "btgpactual.com" || domain === "genialinvestimentos.com.br" || domain === "itau.com.br") && host.endsWith(`.${domain}`));
  if (!allowed || (host.includes("greenhouse.io") && !url.pathname.toLowerCase().includes(source.atsSlug))) {
    throw new Error(`${field} must point to an official ${source.company} page or its verified careers portal.`);
  }
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|gclid$|fbclid$)/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

function checkedToday(value, now) {
  if (value !== saoPauloDate(now)) {
    throw new Error(`checked_on must be today's date in São Paulo (${saoPauloDate(now)}).`);
  }
}

function proof(value, field, source) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`evidence.${field} is required.`);
  }
  return {
    url: officialUrl(value.url, `evidence.${field}.url`, source),
    quote: requireText(value.quote, `evidence.${field}.quote`, 600),
  };
}

function folded(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function validateVacancy(input, now = new Date()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("The input must be a JSON object.");
  const source = Object.hasOwn(sources, input.source) ? sources[input.source] : null;
  if (!source) throw new Error("source must be btg, genial, or itau.");
  checkedToday(input.checked_on, now);
  if (!areas.has(input.area)) throw new Error("area is not supported.");
  if (!modes.has(input.work_mode)) throw new Error("work_mode must be onsite, hybrid, or remote.");
  if (input.work_mode !== "remote" && input.state !== "SP") {
    throw new Error("Onsite and hybrid internships must be in São Paulo state (state: SP).");
  }
  if (input.work_mode !== "remote" && !/\bSP\b|São Paulo/i.test(input.location ?? "")) {
    throw new Error("location must identify São Paulo state for onsite and hybrid internships.");
  }
  const deadline = input.application_deadline;
  const parsedDeadline = typeof deadline === "string" ? new Date(`${deadline}T12:00:00Z`) : null;
  if (typeof deadline !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)
    || Number.isNaN(parsedDeadline.getTime()) || parsedDeadline.toISOString().slice(0, 10) !== deadline) {
    throw new Error("application_deadline must be a valid YYYY-MM-DD date.");
  }
  if (deadline < saoPauloDate(now)) throw new Error("The application deadline has passed.");
  const sourceUrl = officialUrl(input.source_url, "source_url", source);
  const applicationUrl = officialUrl(input.application_url, "application_url", source);
  if (!input.evidence || typeof input.evidence !== "object") throw new Error("evidence is required.");
  const evidence = Object.fromEntries(proofFields.map((field) => [field, proof(input.evidence[field], field, source)]));
  if (!/estagio.{0,25}ferias|vacation internship|summer internship/.test(folded(evidence.vacation_internship.quote))) {
    throw new Error("Vacation internship evidence must explicitly identify a vacation internship.");
  }
  if (!/computacao|computer science/.test(folded(evidence.computer_science.quote))) {
    throw new Error("Eligibility evidence must explicitly include Computer Science or computing.");
  }
  if (!/tecnologia|software|desenvolvimento|programac|dados|data science|\bia\b|inteligencia artificial|infraestrutura|seguranca|produto digital/.test(folded(evidence.technology_area.quote))) {
    throw new Error("Area evidence must explicitly identify a technology-related role.");
  }
  if (!/inscric.{0,12}abert|candidatur.{0,12}abert|apply now|inscreva-se|candidatar-se/.test(folded(evidence.applications_open.quote))) {
    throw new Error("Application evidence must explicitly state that applications are open.");
  }
  const locationProof = folded(evidence.location.quote);
  const modeProof = input.work_mode === "remote" ? /remot|home office/
    : input.work_mode === "hybrid" ? /hibrid/ : /presencial/;
  if (!modeProof.test(locationProof)
    || (input.work_mode !== "remote" && !/sao paulo|\bsp\b/.test(locationProof))) {
    throw new Error("Location evidence must confirm the selected mode and São Paulo when applicable.");
  }
  const brDeadline = deadline.split("-").reverse().join("/");
  if (!evidence.application_deadline.quote.includes(deadline)
    && !evidence.application_deadline.quote.includes(brDeadline)) {
    throw new Error("The deadline evidence must include the exact deadline date.");
  }
  return {
    row: {
      company: source.company,
      title: requireText(input.title, "title", 160),
      area: input.area,
      location: requireText(input.location, "location", 160),
      work_mode: input.work_mode,
      internship_period: requireText(input.internship_period, "internship_period", 120),
      application_deadline: deadline,
      summary: input.summary == null ? null : requireText(input.summary, "summary", 300),
      source_name: source.source_name,
      source_url: sourceUrl,
      application_url: applicationUrl,
      review_status: "approved",
      opening_status: "open",
    },
    evidence,
  };
}

export function validateClosure(input, now = new Date()) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("The input must be a JSON object.");
  const source = Object.hasOwn(sources, input.source) ? sources[input.source] : null;
  if (!source) throw new Error("source must be btg, genial, or itau.");
  checkedToday(input.checked_on, now);
  return {
    application_url: officialUrl(input.application_url, "application_url", source),
    reason: requireText(input.reason, "reason", 300),
    evidence: proof(input.evidence, "closure", source),
  };
}
