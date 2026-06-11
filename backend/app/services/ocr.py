"""OCR engine v2 — pluggable providers with confidence + automatic fallback.

Provider chain:
    Mathpix (high quality, requires API key)  →  Pix2Text (free, open-source)

The chain returns the first result that clears `min_confidence`. If every
provider falls below threshold, the highest-confidence attempt is returned
so the user always gets *something* to edit.
"""

from __future__ import annotations

import base64
import io
import logging
from dataclasses import dataclass
from typing import Protocol

import httpx

from app.core.config import settings

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public types
# ---------------------------------------------------------------------------


@dataclass
class OCRResult:
    text: str
    confidence: float
    provider: str
    latex: str | None = None
    fallback_reason: str | None = None


class OCRError(Exception):
    pass


class OCRProvider(Protocol):
    name: str

    def is_available(self) -> bool: ...
    def extract(self, image_bytes: bytes) -> OCRResult: ...


# ---------------------------------------------------------------------------
# Image preprocessing
# ---------------------------------------------------------------------------


_MAX_SIDE = 2000


def preprocess_image(image_bytes: bytes) -> bytes:
    """Normalize an upload: auto-orient, RGB, cap longest side, re-encode PNG.

    Helps both providers by removing rotation surprises and shrinking very
    large phone photos to a manageable size.
    """
    try:
        from PIL import Image, ImageOps
    except ImportError:
        return image_bytes

    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img = ImageOps.exif_transpose(img)
            if img.mode != "RGB":
                img = img.convert("RGB")

            w, h = img.size
            longest = max(w, h)
            if longest > _MAX_SIDE:
                scale = _MAX_SIDE / longest
                img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

            buf = io.BytesIO()
            img.save(buf, format="PNG", optimize=True)
            return buf.getvalue()
    except Exception as e:
        log.warning("Image preprocessing failed (%s) — using original bytes", e)
        return image_bytes


# ---------------------------------------------------------------------------
# Mathpix provider
# ---------------------------------------------------------------------------


_MATHPIX_URL = "https://api.mathpix.com/v3/text"
_MATHPIX_TIMEOUT = 20.0


class MathpixProvider:
    name = "mathpix"

    def __init__(self) -> None:
        self._app_id = settings.mathpix_app_id
        self._app_key = settings.mathpix_app_key

    def is_available(self) -> bool:
        return bool(self._app_id and self._app_key)

    def extract(self, image_bytes: bytes) -> OCRResult:
        if not self.is_available():
            raise OCRError("Mathpix credentials not configured")

        src = "data:image/png;base64," + base64.b64encode(image_bytes).decode("ascii")
        payload = {
            "src": src,
            "formats": ["text", "latex_styled"],
            "data_options": {"include_latex": True},
            "math_inline_delimiters": ["$", "$"],
            "rm_spaces": True,
        }
        headers = {
            "app_id": self._app_id,
            "app_key": self._app_key,
            "Content-Type": "application/json",
        }

        try:
            with httpx.Client(timeout=_MATHPIX_TIMEOUT) as client:
                resp = client.post(_MATHPIX_URL, json=payload, headers=headers)
        except httpx.HTTPError as e:
            raise OCRError(f"Mathpix request failed: {e}") from e

        if resp.status_code != 200:
            raise OCRError(f"Mathpix returned HTTP {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        if data.get("error"):
            raise OCRError(f"Mathpix error: {data['error']}")

        text = (data.get("text") or "").strip()
        latex = data.get("latex_styled") or None
        confidence = float(
            data.get("confidence")
            or data.get("confidence_rate")
            or (0.9 if text else 0.0)
        )

        return OCRResult(
            text=text,
            confidence=confidence,
            provider=self.name,
            latex=latex,
        )


# ---------------------------------------------------------------------------
# Pix2Text provider (free fallback)
# ---------------------------------------------------------------------------


class Pix2TextProvider:
    name = "pix2text"

    def __init__(self) -> None:
        self._client = None

    def is_available(self) -> bool:
        try:
            import pix2text  # noqa: F401

            return True
        except ImportError:
            return False

    def _client_lazy(self):
        if self._client is None:
            from pix2text import Pix2Text

            self._client = Pix2Text()
        return self._client

    def extract(self, image_bytes: bytes) -> OCRResult:
        import os
        import tempfile

        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        try:
            page = self._client_lazy()(tmp_path)
            parts: list[str] = []
            latex_parts: list[str] = []
            for el in getattr(page, "elements", []):
                latex = getattr(el, "latex", None)
                if latex:
                    parts.append(latex)
                    latex_parts.append(latex)
                    continue
                txt = getattr(el, "text", None)
                if txt:
                    parts.append(txt)

            text = " ".join(parts).strip()
            confidence = self._synth_confidence(text, len(parts), len(latex_parts))

            return OCRResult(
                text=text,
                confidence=confidence,
                provider=self.name,
                latex=" ".join(latex_parts) if latex_parts else None,
            )
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass

    @staticmethod
    def _synth_confidence(text: str, n_elements: int, n_latex: int) -> float:
        """Pix2Text doesn't expose per-element confidence, so synthesize one
        from signal density: more elements + LaTeX presence = higher confidence."""
        if not text:
            return 0.0
        base = 0.50
        base += min(n_elements * 0.04, 0.20)
        base += 0.10 if n_latex else 0.0
        return min(round(base, 2), 0.80)


# ---------------------------------------------------------------------------
# Provider chain
# ---------------------------------------------------------------------------


class ChainedOCR:
    """Try providers in order; return the first result above the threshold."""

    def __init__(
        self,
        providers: list[OCRProvider],
        min_confidence: float = 0.60,
    ) -> None:
        self.providers = providers
        self.min_confidence = min_confidence

    def extract(self, image_bytes: bytes) -> OCRResult:
        best: OCRResult | None = None
        last_err: str | None = None

        for provider in self.providers:
            if not provider.is_available():
                last_err = f"{provider.name} not available"
                continue

            try:
                result = provider.extract(image_bytes)
            except OCRError as e:
                log.warning("OCR provider %s failed: %s", provider.name, e)
                last_err = f"{provider.name}: {e}"
                continue
            except Exception as e:
                log.exception("OCR provider %s crashed", provider.name)
                last_err = f"{provider.name} crashed: {e}"
                continue

            if result.text and result.confidence >= self.min_confidence:
                return result

            if best is None or result.confidence > best.confidence:
                best = result

        if best is not None:
            best.fallback_reason = (
                f"No provider reached confidence ≥ {self.min_confidence:.0%}"
            )
            return best

        raise OCRError(last_err or "No OCR providers were available")


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------


_chain: ChainedOCR | None = None


def get_engine() -> ChainedOCR:
    global _chain
    if _chain is not None:
        return _chain

    providers: list[OCRProvider] = []
    mathpix = MathpixProvider()
    if mathpix.is_available():
        providers.append(mathpix)
    providers.append(Pix2TextProvider())

    _chain = ChainedOCR(providers=providers, min_confidence=0.60)
    return _chain
