import type { Delivery, DeliveryWithSubject, Subject, SubjectWithLinks } from "../lib/database.types";

const timestamp = "2026-08-25T12:00:00-03:00";

export function makeSubject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: "subject-lp",
    archived_at: null,
    name: "Linguagens e Paradigmas",
    code: "LP",
    color: "#f97316",
    position: 1,
    notes: "",
    official_url: null,
    platform_url: null,
    repository_url: null,
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides,
  };
}

export function makeSubjectWithLinks(overrides: Partial<SubjectWithLinks> = {}): SubjectWithLinks {
  return { ...makeSubject(overrides as Partial<Subject>), subject_links: [], ...overrides };
}

export function makeDelivery(overrides: Partial<Delivery> & { subject?: Subject } = {}): DeliveryWithSubject {
  const { subject, ...deliveryOverrides } = overrides;
  const base = subject ?? makeSubject();
  return {
    id: "delivery-1",
    subject_id: base.id,
    title: "APS 01 — API REST",
    type: "aps",
    description: "Implementar endpoints e testes.",
    due_at: "2026-09-02T23:59:00-03:00",
    source_url: null,
    status: "active",
    created_by: null,
    created_by_name: "Admin TurmaBoard",
    updated_by: null,
    updated_by_name: "Admin TurmaBoard",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...deliveryOverrides,
    subject: base,
  };
}
