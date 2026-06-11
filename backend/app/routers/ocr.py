from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.services.ocr import OCRError, get_engine, preprocess_image

router = APIRouter(tags=["ocr"])

MAX_IMAGE_BYTES = 8 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}


@router.post("/image-ocr")
async def image_ocr(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported content type: {file.content_type}",
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds {MAX_IMAGE_BYTES // (1024 * 1024)}MB limit",
        )

    image_bytes = preprocess_image(raw_bytes)

    try:
        result = get_engine().extract(image_bytes)
    except OCRError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:  # noqa: BLE001
        return {"success": False, "error": f"OCR engine crashed: {e}"}

    if not result.text:
        return {
            "success": False,
            "message": "No text detected in image",
            "provider": result.provider,
            "confidence": result.confidence,
        }

    return {
        "success": True,
        "text": result.text,
        "latex": result.latex,
        "confidence": round(result.confidence, 2),
        "provider": result.provider,
        "fallback_reason": result.fallback_reason,
    }
