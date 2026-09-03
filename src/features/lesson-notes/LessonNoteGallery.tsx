import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { LessonNoteImage } from "../../lib/database.types";
import { Dialog } from "../../shared/Dialog";
import { getLessonNoteImageUrl } from "./lesson-note.service";

export function LessonNoteGallery({ images }: { images: LessonNoteImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  useEffect(() => {
    if (activeIndex == null) return;
    function navigate(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") setActiveIndex((index) => index == null ? null : (index - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setActiveIndex((index) => index == null ? null : (index + 1) % images.length);
    }
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [activeIndex, images.length]);
  if (!images.length) return null;
  const active = activeIndex == null ? null : images[activeIndex];
  return (
    <>
      <div className="lesson-note-gallery">
        {images.map((image, index) => (
          <figure key={image.id}>
            <button type="button" onClick={() => setActiveIndex(index)} aria-label={`Ampliar imagem: ${image.alt_text}`}>
              <img src={getLessonNoteImageUrl(image.storage_path)} alt={image.alt_text} width={image.width} height={image.height} loading="lazy" />
              <Expand aria-hidden="true" />
            </button>
            {image.caption && <figcaption>{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {active && activeIndex != null && (
        <Dialog title={active.alt_text} className="image-viewer-dialog" onClose={() => setActiveIndex(null)}>
          <div className="image-viewer">
            <button className="icon-button" type="button" onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)} aria-label="Imagem anterior"><ChevronLeft aria-hidden="true" /></button>
            <figure><img src={getLessonNoteImageUrl(active.storage_path)} alt={active.alt_text} width={active.width} height={active.height} />{active.caption && <figcaption>{active.caption}</figcaption>}</figure>
            <button className="icon-button" type="button" onClick={() => setActiveIndex((activeIndex + 1) % images.length)} aria-label="Próxima imagem"><ChevronRight aria-hidden="true" /></button>
          </div>
        </Dialog>
      )}
    </>
  );
}
