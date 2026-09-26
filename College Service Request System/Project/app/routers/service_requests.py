from fastapi import APIRouter, Depends, HTTPException
from pymongo.collection import Collection
from uuid import uuid4
from datetime import datetime

from app.dependencies import (
    get_service_requests_collection,
    get_current_user
)

from app.schemas.service_request import (
    ServiceRequestCreate,
    ServiceRequestUpdate,
    ServiceRequestAssign,
    ServiceRequestStatusUpdate,
    ServiceRequestResponse
)


router = APIRouter(
    prefix="/service-requests",
    tags=["Service Requests"]
)


@router.post("/", response_model=ServiceRequestResponse)
def create_service_request(
    request: ServiceRequestCreate,
    collection: Collection = Depends(
        get_service_requests_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["student", "faculty"]:
        raise HTTPException(
            status_code=403,
            detail="Only students and faculty can create service requests"
        )

    now = datetime.utcnow()

    request_document = {
        "id": str(uuid4()),
        "title": request.title,
        "description": request.description,
        "category_id": request.category_id,
        "created_by": current_user["id"],
        "status": "new",
        "assigned_to": None,
        "created_at": now,
        "updated_at": now
    }

    collection.insert_one(request_document)

    return request_document


@router.get("/", response_model=list[ServiceRequestResponse])
def get_service_requests(
    collection: Collection = Depends(
        get_service_requests_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"]

    if role in ["student", "faculty"]:
        requests = collection.find(
            {"created_by": current_user["id"]},
            {"_id": 0}
        )

    elif role == "service_staff":
        requests = collection.find(
            {"assigned_to": current_user["id"]},
            {"_id": 0}
        )

    elif role in ["service_lead", "admin"]:
        requests = collection.find(
            {},
            {"_id": 0}
        )

    else:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return list(requests)


@router.get("/{request_id}", response_model=ServiceRequestResponse)
def get_service_request(
    request_id: str,
    collection: Collection = Depends(
        get_service_requests_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    service_request = collection.find_one(
        {"id": request_id},
        {"_id": 0}
    )

    if not service_request:
        raise HTTPException(
            status_code=404,
            detail="Service request not found"
        )

    role = current_user["role"]

    if role in ["student", "faculty"]:
        if service_request["created_by"] != current_user["id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own requests"
            )

    elif role == "service_staff":
        if service_request["assigned_to"] != current_user["id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only view requests assigned to you"
            )

    elif role in ["service_lead", "admin"]:
        pass

    else:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return service_request


@router.put("/{request_id}", response_model=ServiceRequestResponse)
def update_service_request(
    request_id: str,
    request: ServiceRequestUpdate,
    collection: Collection = Depends(
        get_service_requests_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["student", "faculty"]:
        raise HTTPException(
            status_code=403,
            detail="Only students and faculty can edit requests"
        )

    existing_request = collection.find_one({"id": request_id})

    if not existing_request:
        raise HTTPException(
            status_code=404,
            detail="Service request not found"
        )

    if existing_request["created_by"] != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own requests"
        )

    if existing_request["status"] != "new":
        raise HTTPException(
            status_code=400,
            detail="Only new requests can be edited"
        )

    update_data = request.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields to update"
        )

    update_data["updated_at"] = datetime.utcnow()

    collection.update_one(
        {"id": request_id},
        {"$set": update_data}
    )

    return collection.find_one(
        {"id": request_id},
        {"_id": 0}
    )


@router.patch(
    "/{request_id}/assign",
    response_model=ServiceRequestResponse
)
def assign_service_request(
    request_id: str,
    request: ServiceRequestAssign,
    collection: Collection = Depends(
        get_service_requests_collection
    ),
    current_user: dict = Depends(get_current_user),
    users_collection: Collection = Depends(
        __import__(
            "app.dependencies",
            fromlist=["get_users_collection"]
        ).get_users_collection
    )
):
    if current_user["role"] not in ["service_lead", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only service lead or admin can assign requests"
        )

    existing_request = collection.find_one({"id": request_id})

    if not existing_request:
        raise HTTPException(
            status_code=404,
            detail="Service request not found"
        )

    staff = users_collection.find_one({
        "id": request.assigned_to,
        "role": "service_staff"
    })

    if not staff:
        raise HTTPException(
            status_code=400,
            detail="Assigned user must be a service staff member"
        )

    collection.update_one(
        {"id": request_id},
        {
            "$set": {
                "assigned_to": request.assigned_to,
                "status": "assigned",
                "updated_at": datetime.utcnow()
            }
        }
    )

    return collection.find_one(
        {"id": request_id},
        {"_id": 0}
    )


@router.patch(
    "/{request_id}/status",
    response_model=ServiceRequestResponse
)
def update_service_request_status(
    request_id: str,
    request: ServiceRequestStatusUpdate,
    collection: Collection = Depends(
        get_service_requests_collection
    ),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in [
        "service_staff",
        "service_lead",
        "admin"
    ]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update status"
        )

    allowed_statuses = [
        "new",
        "assigned",
        "in_progress",
        "on_hold",
        "resolved",
        "closed"
    ]

    if request.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    existing_request = collection.find_one({"id": request_id})

    if not existing_request:
        raise HTTPException(
            status_code=404,
            detail="Service request not found"
        )

    current_status = existing_request["status"]

    valid_transitions = {
        "new": ["assigned"],
        "assigned": ["in_progress"],
        "in_progress": ["on_hold", "resolved"],
        "on_hold": ["in_progress"],
        "resolved": ["closed"],
        "closed": []
    }

    if request.status not in valid_transitions.get(
        current_status,
        []
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from "
                   f"{current_status} to {request.status}"
        )

    if current_user["role"] == "service_staff":
        if existing_request["assigned_to"] != current_user["id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only update requests assigned to you"
            )

    collection.update_one(
        {"id": request_id},
        {
            "$set": {
                "status": request.status,
                "updated_at": datetime.utcnow()
            }
        }
    )

    return collection.find_one(
        {"id": request_id},
        {"_id": 0}
    )