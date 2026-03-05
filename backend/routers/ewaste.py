"""E-Waste & Upcycling router."""
from fastapi import APIRouter, UploadFile, File
from services.ewaste_service import classify_item, get_collection_route, get_upcycle_opportunities, get_flow_summary

router = APIRouter()


@router.get("/summary")
def summary():
    """Current e-waste collection pipeline summary."""
    return get_flow_summary()


@router.post("/classify")
async def classify(file: UploadFile = File(...)):
    """
    Upload an image of a discarded item.
    Returns detected category + recycling/upcycling guidance.
    """
    image_bytes = await file.read()
    return classify_item(image_bytes, file.filename)


@router.get("/upcycle-opportunities")
def upcycle_opportunities(category: str = "all"):
    """Matches item categories to active maker-space or community projects."""
    return get_upcycle_opportunities(category)


@router.get("/collection-route")
def collection_route():
    """Optimised van collection route across campus drop-off points (greedy TSP)."""
    return get_collection_route()
