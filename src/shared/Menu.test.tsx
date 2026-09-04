import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";
import { Menu } from "./Menu";

function renderMenu() {
  return render(
    <Menu label="Mais ações" triggerContent="⋯" panelClassName="panel" panelRole="menu">
      {(close) => (
        <>
          <button role="menuitem" type="button" onClick={close}>Primeiro</button>
          <button role="menuitem" type="button" onClick={close}>Segundo</button>
          <button role="menuitem" type="button" onClick={close}>Terceiro</button>
        </>
      )}
    </Menu>,
  );
}

function trigger() {
  return screen.getByRole("button", { name: "Mais ações" });
}

describe("Menu", () => {
  it("keeps the panel out of the DOM until it is opened", async () => {
    const user = userEvent.setup();
    renderMenu();

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();

    await user.click(trigger());

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
  });

  it("focuses the first item on open", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(trigger());
    expect(screen.getByRole("menuitem", { name: "Primeiro" })).toHaveFocus();
  });

  it("cycles through items with the arrow keys and jumps with Home and End", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(trigger());

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Segundo" })).toHaveFocus();

    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Terceiro" })).toHaveFocus();

    await user.keyboard("{Home}");
    expect(screen.getByRole("menuitem", { name: "Primeiro" })).toHaveFocus();

    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Terceiro" })).toHaveFocus();
  });

  it("closes on Escape and gives focus back to the trigger", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(trigger());

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("closes on an outside click without stealing focus back", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Fora</button>
        <Menu label="Mais ações" triggerContent="⋯" panelRole="menu">
          {() => <button role="menuitem" type="button">Primeiro</button>}
        </Menu>
      </>,
    );
    await user.click(trigger());

    await user.click(screen.getByRole("button", { name: "Fora" }));

    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    expect(trigger()).not.toHaveFocus();
  });

  it("closes when Tab moves focus out of the panel", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(trigger());

    await user.tab();

    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });

  it("lets Escape close only the menu when it sits inside a dialog", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog title="Entrega" onClose={onClose}>
        <Menu label="Mais ações" triggerContent="⋯" panelRole="menu">
          {() => <button role="menuitem" type="button">Primeiro</button>}
        </Menu>
      </Dialog>,
    );
    await user.click(trigger());

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
