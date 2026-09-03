const getSupabaseMock = vi.hoisted(() => vi.fn());

vi.mock("../../lib/supabase", () => ({ getSupabase: getSupabaseMock }));

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, uploadLessonNoteImage, validateImageFile } from "./lesson-note.service";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("lesson note image validation", () => {
  it.each(ALLOWED_IMAGE_TYPES)("aceita %s dentro do limite", (type) => {
    const file = new File([new Uint8Array(32)], "imagem.png", { type });
    expect(validateImageFile(file)).toBeNull();
  });

  it("rejeita tipo não permitido antes do upload", () => {
    expect(validateImageFile(new File(["x"], "vetor.svg", { type: "image/svg+xml" }))).toMatch(/JPEG, PNG ou WebP/);
  });

  it("rejeita arquivos acima de 5 MB antes do upload", () => {
    const file = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "grande.jpg", { type: "image/jpeg" });
    expect(validateImageFile(file)).toMatch(/5 MB/);
  });

  it("remove o objeto enviado quando a gravação dos metadados falha", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const insert = vi.fn().mockResolvedValue({ error: new Error("metadata failure") });
    getSupabaseMock.mockReturnValue({
      storage: { from: vi.fn(() => ({ upload, remove })) },
      from: vi.fn(() => ({ insert })),
    });
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 640, height: 480, close: vi.fn() }));
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "image-uuid") });
    const file = new File(["imagem"], "foto.jpeg", { type: "image/jpeg" });

    await expect(uploadLessonNoteImage("note-id", file, { altText: "Quadro da aula", caption: "", position: 0 }))
      .rejects.toThrow("metadata failure");
    expect(upload).toHaveBeenCalledWith("note-id/image-uuid.jpg", file, expect.objectContaining({ upsert: false }));
    expect(remove).toHaveBeenCalledWith(["note-id/image-uuid.jpg"]);
  });
});
