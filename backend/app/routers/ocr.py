from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.services.ocr import get_provider

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

    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds {MAX_IMAGE_BYTES // (1024 * 1024)}MB limit",
        )

    try:
        provider = get_provider()
        text = provider.extract(image_bytes)
    except Exception as e:
        return {"success": False, "error": str(e)}

    if not text:
        return {"success": False, "message": "No text detected in image"}

    return {"success": True, "text": text}
