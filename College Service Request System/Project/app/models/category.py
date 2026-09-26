from datetime import datetime


class CategoryModel:
    collection_name = "categories"

    @staticmethod
    def create_document(
        category_id: str,
        name: str,
        description: str,
        created_at: datetime
    ):
        return {
            "id": category_id,
            "name": name,
            "description": description,
            "created_at": created_at
        }