from datetime import datetime


class ServiceRequestModel:
    collection_name = "service_requests"

    @staticmethod
    def create_document(
        request_id: str,
        title: str,
        description: str,
        category_id: str,
        created_by: str,
        status: str = "new",
        assigned_to: str | None = None,
        created_at: datetime | None = None,
        updated_at: datetime | None = None
    ):
        return {
            "id": request_id,
            "title": title,
            "description": description,
            "category_id": category_id,
            "created_by": created_by,
            "status": status,
            "assigned_to": assigned_to,
            "created_at": created_at or datetime.utcnow(),
            "updated_at": updated_at or datetime.utcnow()
        }