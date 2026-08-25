import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DeliveryWithSubject } from "../../lib/database.types";
import { DeliveryCard } from "./DeliveryCard";

const delivery: DeliveryWithSubject = {
  id: "delivery-id",
  subject_id: "subject-id",
  title: "APS 01 — API REST",
  type: "aps",
  description: "Implementar endpoints e testes.",
  due_at: "2026-08-27T23:59:00-03:00",
  source_url: "https://example.com/aps",
  status: "active",
  created_by: null,
  updated_by: null,
  created_at: "2026-08-25T12:00:00-03:00",
  updated_at: "2026-08-25T12:00:00-03:00",
  deleted_at: null,
  subject: {
    id: "subject-id",
    name: "Desenvolvimento Web",
    code: "DW",
    color: "#168C62",
    position: 1,
    notes: "",
    official_url: null,
    platform_url: null,
    repository_url: null,
    created_at: "2026-08-25T12:00:00-03:00",
    updated_at: "2026-08-25T12:00:00-03:00",
  },
};

describe("DeliveryCard", () => {
  it("shows the academic content to visitors without edit actions", () => {
    render(<DeliveryCard delivery={delivery} isAdmin={false} onEdit={() => undefined} onDelete={() => undefined} />);
    expect(screen.getByRole("heading", { name: delivery.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /fonte/i })).toHaveAttribute("href", delivery.source_url);
    expect(screen.queryByRole("button", { name: /ações/i })).not.toBeInTheDocument();
  });

  it("exposes edit and delete actions to administrators", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<DeliveryCard delivery={delivery} isAdmin onEdit={onEdit} onDelete={() => undefined} />);
    await user.click(screen.getByRole("button", { name: /ações/i }));
    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(onEdit).toHaveBeenCalledWith(delivery);
  });
});
