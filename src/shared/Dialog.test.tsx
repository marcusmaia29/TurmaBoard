import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("moves focus inside and closes with Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Dialog title="Confirmar ação" onClose={onClose}><button data-autofocus>Continuar</button></Dialog>);

    expect(screen.getByRole("button", { name: "Continuar" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not close while an operation is pending", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Dialog title="Salvando" isBusy onClose={onClose}><button>Continuar</button></Dialog>);

    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });
});
