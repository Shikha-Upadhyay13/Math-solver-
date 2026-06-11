import os
import tempfile
from typing import Protocol

from app.core.config import settings


class OCRProvider(Protocol):
    def extract(self, image_bytes: bytes) -> str: ...


class Pix2TextProvider:
    def __init__(self) -> None:
        from pix2text import Pix2Text

        self._client = Pix2Text()

    def extract(self, image_bytes: bytes) -> str:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name
        try:
            page = self._client(tmp_path)
            parts: list[str] = []
            for el in page.elements:
                latex = getattr(el, "latex", None)
                if latex:
                    parts.append(latex)
                    continue
                txt = getattr(el, "text", None)
                if txt:
                    parts.append(txt)
            return " ".join(parts).strip()
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass


_provider_singleton: OCRProvider | None = None


def get_provider() -> OCRProvider:
    global _provider_singleton
    if _provider_singleton is not None:
        return _provider_singleton

    name = settings.ocr_provider.lower()
    if name == "mathpix":
        raise NotImplementedError(
            "Mathpix provider lands in Phase 3. Set OCR_PROVIDER=pix2text for now."
        )
    if name == "pix2text":
        _provider_singleton = Pix2TextProvider()
        return _provider_singleton

    raise ValueError(f"Unknown OCR provider: {settings.ocr_provider}")
